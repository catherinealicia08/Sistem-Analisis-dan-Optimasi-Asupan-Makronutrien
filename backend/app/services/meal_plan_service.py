"""
Service: meal_plan_service.py

Computes daily and weekly meal plans by re-using the multi-objective ILP
defined in `optimizer.py`. For each meal slot (breakfast / lunch / dinner /
snack), a per-slot macro target is derived from a configurable share of the
daily target (default: 25% / 35% / 30% / 10%, USDA-style three-meals-plus-snack
distribution). The optimizer is then called with `current_* = 0` so each slot
problem is solved independently.

Persistence: each generated day is written to

    users/{uid}/meal_plans/{YYYY-MM-DD}

with the same shape returned to the client. The grocery-list endpoint walks the
collection and aggregates grams per food across all stored days that fall in the
requested window.
"""

import hashlib
import random
from datetime import date as date_cls, datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple

from fastapi import HTTPException

from .. import optimizer, schemas
from ..database import db
from .analysis_service import _get_user_dict, _targets_for_user
from .food_service import get_all_foods_as_dicts, get_food

MEAL_PLANS_COL = "meal_plans"

DEFAULT_DISTRIBUTION: Dict[str, float] = {
    "breakfast": 0.25,
    "lunch":     0.35,
    "dinner":    0.30,
    "snack":     0.10,
}

# Foods that are typically counted in whole pieces rather than grams for shopping.
# Approximate average gram-per-piece values per the FAO household-measure table.
PIECE_FOODS: Dict[str, float] = {
    "Pisang":  120.0,
    "Apel":    180.0,
    "Jeruk":   140.0,
    "Pepaya":  500.0,
    "Mangga":  300.0,
    "Alpukat": 170.0,
    "Telur Rebus": 50.0,
    "Putih Telur": 33.0,
}


def _validate_distribution(distribution: Optional[Dict[str, float]]) -> Dict[str, float]:
    if not distribution:
        return DEFAULT_DISTRIBUTION
    keys = set(distribution.keys())
    expected = set(DEFAULT_DISTRIBUTION.keys())
    if keys != expected:
        raise HTTPException(
            status_code=400,
            detail=f"distribution must contain exactly these keys: {sorted(expected)}",
        )
    total = sum(distribution.values())
    if total <= 0 or abs(total - 1.0) > 0.02:
        raise HTTPException(
            status_code=400,
            detail=f"distribution shares must sum to 1.0 (got {total:.3f})",
        )
    return distribution


# ---------- Goal-based food pool bias ----------
#
# Same target macros can be hit by many food combinations; the choice should
# reflect the user's *goal* qualitatively, not only quantitatively.
#
#   weight_loss → low energy density, lean protein, more vegetables/fiber.
#                 Drop pure oils & high-fat dairy that are nutritionally cheap
#                 ways to spike kcal.
#   maintenance → balanced (no bias).
#   muscle_gain → bias toward high-protein animal sources + nutrient-dense carbs.

_HEAVY_FAT_FOODS = {
    "Minyak Zaitun", "Minyak Kelapa", "Mentega", "Selai Kacang",
    "Keju Cheddar",
}
_WEIGHT_LOSS_BLOCKED = _HEAVY_FAT_FOODS | {
    "Nasi Goreng", "Mie Goreng", "Ayam Goreng", "Batagor", "Gulai Kambing",
    "Soto Betawi",
}
# Lean / volumetric foods preferred for weight loss.
_WEIGHT_LOSS_PREFERRED = {
    "Dada Ayam Tanpa Kulit", "Putih Telur", "Ikan Tongkol", "Ikan Tuna",
    "Ikan Lele", "Udang", "Brokoli", "Bayam", "Kangkung", "Wortel", "Buncis",
    "Selada", "Timun", "Tomat", "Cottage Cheese", "Greek Yogurt", "Edamame Kupas",
    "Sayur Brokoli Kukus", "Tumis Kangkung", "Sayur Asem", "Ubi Jalar",
    "Quinoa Matang", "Apel", "Jeruk", "Pepaya", "Semangka",
}
# Dense, anabolic-friendly foods preferred for muscle gain.
_MUSCLE_GAIN_PREFERRED = {
    "Dada Ayam Tanpa Kulit", "Paha Ayam", "Daging Sapi Tanpa Lemak",
    "Ikan Salmon", "Ikan Tuna", "Telur Rebus", "Whey Protein Isolate",
    "Greek Yogurt", "Cottage Cheese", "Selai Kacang", "Oatmeal", "Roti Gandum",
    "Nasi Merah", "Quinoa Matang", "Ubi Jalar", "Pisang", "Alpukat",
    "Tempe", "Tahu", "Kacang Almond", "Edamame Kupas",
    "Rendang Sapi", "Ayam Bakar", "Sate Ayam",
}

def _apply_goal_bias(pool: List[dict], goal: Optional[str]) -> List[dict]:
    if goal == "weight_loss":
        return [f for f in pool if f.get("name") not in _WEIGHT_LOSS_BLOCKED]
    return pool


def _stable_subset(pool: List[dict], seed_key: str, goal: Optional[str], cap: int) -> List[dict]:
    """
    Deterministically permute the pool so different days surface different
    staples — but the same (user, date, goal) re-runs are reproducible. Foods
    in the goal-preferred set are kept; the rest is shuffled and capped.

    A capped pool is critical for *real* variety: with the full pool every day
    the ILP solver tends to converge on the same optimum. By restricting which
    foods the solver can even see per day we force qualitatively different
    plans across the week while staying reproducible.
    """
    if not pool:
        return pool
    h = hashlib.sha256(seed_key.encode("utf-8")).hexdigest()
    rng = random.Random(int(h[:16], 16))

    preferred_names: set[str] = set()
    if goal == "muscle_gain":
        preferred_names = _MUSCLE_GAIN_PREFERRED
    elif goal == "weight_loss":
        preferred_names = _WEIGHT_LOSS_PREFERRED

    head = [f for f in pool if f.get("name") in preferred_names]
    tail = [f for f in pool if f.get("name") not in preferred_names]
    rng.shuffle(head)
    rng.shuffle(tail)
    combined = head + tail

    # Keep the cap below total pool size but never starve the solver.
    effective_cap = max(min(cap, len(combined)), min(8, len(combined)))
    return combined[:effective_cap]


_VEG_BLOCKED_CATEGORY = "Protein Hewani"
_VEG_BLOCKED_FOOD_NAMES_INDO = {
    "Bakso Sapi", "Rendang Sapi", "Ayam Bakar", "Ayam Goreng", "Ayam Geprek",
    "Soto Ayam", "Soto Betawi", "Sate Ayam", "Gulai Kambing", "Rawon",
    "Bubur Ayam", "Ikan Pepes", "Nasi Goreng", "Mie Goreng",
}
_VEGAN_EXTRA_BLOCKED_CATS = {"Susu & Olahan"}
_VEGAN_EXTRA_BLOCKED_FOODS = {"Telur Rebus", "Putih Telur", "Telur Balado", "Mentega"}


def _apply_user_preferences(
    pool: List[dict],
    dietary_preference: Optional[str],
    allergies: Optional[List[str]],
) -> List[dict]:
    """Filter the food pool by the user's dietary preference and allergens."""
    out = pool
    if dietary_preference == "vegetarian":
        out = [
            f for f in out
            if f.get("category") != _VEG_BLOCKED_CATEGORY
            and f.get("name") not in _VEG_BLOCKED_FOOD_NAMES_INDO
        ]
    elif dietary_preference == "vegan":
        out = [
            f for f in out
            if f.get("category") not in {_VEG_BLOCKED_CATEGORY, *_VEGAN_EXTRA_BLOCKED_CATS}
            and f.get("name") not in (_VEG_BLOCKED_FOOD_NAMES_INDO | _VEGAN_EXTRA_BLOCKED_FOODS)
        ]
    elif dietary_preference == "pescatarian":
        out = [
            f for f in out
            if f.get("category") != _VEG_BLOCKED_CATEGORY
            or f.get("subcategory") in {"Hidangan Ikan"}
            or f.get("name", "").startswith("Ikan")
        ]
    if allergies:
        allergens = {a.strip().lower() for a in allergies if a and a.strip()}
        out = [f for f in out if f.get("name", "").lower() not in allergens]
    return out


def _filter_foods_for_meal(meal: str, all_foods: List[dict]) -> List[dict]:
    """
    Bias each meal slot toward categories that fit it. The constraint is soft —
    we never starve the optimizer of food, but we omit clearly off-template
    items (e.g., pure oils for breakfast as the *sole* food choice).
    """
    if meal == "breakfast":
        cats = {"Karbohidrat", "Buah", "Protein Hewani", "Susu & Olahan", "Protein Nabati", "Makanan Indonesia"}
    elif meal == "lunch":
        cats = {"Karbohidrat", "Protein Hewani", "Protein Nabati", "Sayuran", "Makanan Indonesia"}
    elif meal == "dinner":
        cats = {"Karbohidrat", "Protein Hewani", "Protein Nabati", "Sayuran", "Makanan Indonesia"}
    else:  # snack
        cats = {"Buah", "Susu & Olahan", "Protein Nabati"}
    pool = [f for f in all_foods if f.get("category") in cats]
    return pool or all_foods


def _solve_meal_slot(
    meal: str,
    share: float,
    targets: dict,
    food_pool: List[dict],
) -> schemas.MealSlotOut:
    slot_kcal    = targets["target_calories"]   * share
    slot_protein = targets["target_protein_g"]  * share
    slot_carbs   = targets["target_carbs_g"]    * share
    slot_fat     = targets["target_fat_g"]      * share

    # Snack should be small + few items; main meals can carry more variety/grams.
    if meal == "snack":
        max_items, max_grams = 2, 200
    else:
        max_items, max_grams = 4, 300

    result = optimizer.optimize_meal(
        foods=food_pool,
        target_calories=slot_kcal,
        target_protein=slot_protein,
        target_carbs=slot_carbs,
        target_fat=slot_fat,
        current_calories=0.0,
        current_protein=0.0,
        current_carbs=0.0,
        current_fat=0.0,
        max_items=max_items,
        max_grams_per_food=max_grams,
    )

    by_id = {f["id"]: f for f in food_pool}
    items: List[schemas.RecommendationItem] = []
    for p in result["picks"]:
        fd = by_id.get(p["food_id"])
        if not fd:
            continue
        items.append(schemas.RecommendationItem(
            food=schemas.FoodOut(
                id=p["food_id"],
                name=fd["name"],
                category=fd["category"],
                image_url=fd.get("image_url"),
                calories=fd["calories"],
                protein=fd["protein"],
                fat=fd["fat"],
                carbs=fd["carbs"],
                serving_size=fd.get("serving_size", 100.0),
            ),
            grams=p["grams"],
            added_calories=round(p["added_calories"], 1),
            added_protein=round(p["added_protein"], 1),
            added_carbs=round(p["added_carbs"], 1),
            added_fat=round(p["added_fat"], 1),
        ))

    totals = result["added_totals"]
    return schemas.MealSlotOut(
        meal=meal,           # type: ignore[arg-type]
        share=share,
        target_calories=round(slot_kcal, 1),
        target_protein=round(slot_protein, 1),
        target_carbs=round(slot_carbs, 1),
        target_fat=round(slot_fat, 1),
        items=items,
        totals=schemas.MacroIntake(
            calories=round(totals["calories"], 1),
            protein=round(totals["protein"], 1),
            carbs=round(totals["carbs"], 1),
            fat=round(totals["fat"], 1),
        ),
        status=result["status"],
        objective_value=round(result["objective_value"], 2),
    )


def _build_day_plan(
    user_id: str,
    day: date_cls,
    distribution: Dict[str, float],
    targets: dict,
    foods: List[dict],
    dietary_preference: Optional[str] = None,
    allergies: Optional[List[str]] = None,
    goal: Optional[str] = None,
) -> schemas.DailyMealPlanOut:
    slots: List[schemas.MealSlotOut] = []
    for meal, share in distribution.items():
        # Pool composition: meal-of-day filter → user prefs → goal bias.
        food_pool = _filter_foods_for_meal(meal, foods)
        food_pool = _apply_user_preferences(food_pool, dietary_preference, allergies)
        food_pool = _apply_goal_bias(food_pool, goal)
        # Stable, per-(user, date, meal, goal) windowed subset to drive variety
        # across days while remaining deterministic.
        food_pool = _stable_subset(
            food_pool,
            seed_key=f"{user_id}|{day.isoformat()}|{meal}|{goal or 'maintenance'}",
            goal=goal,
            cap=14 if meal != "snack" else 8,
        )
        slots.append(_solve_meal_slot(meal, share, targets, food_pool))

    total_cal = sum(s.totals.calories for s in slots)
    total_pro = sum(s.totals.protein for s in slots)
    total_carb = sum(s.totals.carbs for s in slots)
    total_fat = sum(s.totals.fat for s in slots)

    def pct(a: float, t: float) -> float:
        return round((a / t * 100.0) if t > 0 else 0.0, 1)

    targets_model = schemas.MetabolicTargets(
        bmr=round(targets["bmr"], 1),
        tdee=round(targets["tdee"], 1),
        target_calories=round(targets["target_calories"], 1),
        target_protein_g=round(targets["target_protein_g"], 1),
        target_carbs_g=round(targets["target_carbs_g"], 1),
        target_fat_g=round(targets["target_fat_g"], 1),
    )

    return schemas.DailyMealPlanOut(
        id=str(day),
        user_id=user_id,
        date=day,
        targets=targets_model,
        distribution=distribution,
        meals=slots,
        totals=schemas.MacroIntake(
            calories=round(total_cal, 1),
            protein=round(total_pro, 1),
            carbs=round(total_carb, 1),
            fat=round(total_fat, 1),
        ),
        fulfillment_pct=schemas.MacroIntake(
            calories=pct(total_cal, targets["target_calories"]),
            protein=pct(total_pro, targets["target_protein_g"]),
            carbs=pct(total_carb, targets["target_carbs_g"]),
            fat=pct(total_fat, targets["target_fat_g"]),
        ),
    )


def _day_to_storage(plan: schemas.DailyMealPlanOut) -> dict:
    data = plan.model_dump(mode="json")
    data["generated_at"] = datetime.now(tz=timezone.utc).isoformat()
    return data


def _storage_to_day(data: dict, user_id: str, day: date_cls) -> schemas.DailyMealPlanOut:
    # Be defensive — older stored docs may be missing fields.
    data.setdefault("id", str(day))
    data.setdefault("user_id", user_id)
    data.setdefault("date", str(day))
    data.setdefault("distribution", DEFAULT_DISTRIBUTION)
    return schemas.DailyMealPlanOut(**data)


def _plans_col(user_id: str):
    return db.collection("users").document(user_id).collection(MEAL_PLANS_COL)


def get_daily_plan(user_id: str, day: date_cls) -> Optional[schemas.DailyMealPlanOut]:
    doc = _plans_col(user_id).document(str(day)).get()
    if not doc.exists:
        return None
    return _storage_to_day(doc.to_dict() or {}, user_id, day)


def generate(
    user_id: str,
    payload: schemas.MealPlanGenerateIn,
) -> schemas.WeeklyMealPlanOut:
    user = _get_user_dict(user_id)
    targets = _targets_for_user(user)
    if targets["target_calories"] <= 0:
        raise HTTPException(
            status_code=400,
            detail="User profile is incomplete — finish profile setup first.",
        )

    distribution = _validate_distribution(payload.distribution)
    foods = get_all_foods_as_dicts()
    if not foods:
        raise HTTPException(status_code=500, detail="Food database is empty.")

    start = payload.start_date or date_cls.today()
    dietary_pref = user.get("dietary_preference")
    allergies = user.get("allergies")
    goal = user.get("goal")
    days_out: List[schemas.DailyMealPlanOut] = []
    for offset in range(payload.days):
        d = start + timedelta(days=offset)
        existing = get_daily_plan(user_id, d)
        if existing and not payload.overwrite:
            days_out.append(existing)
            continue
        plan = _build_day_plan(
            user_id, d, distribution, targets, foods,
            dietary_preference=dietary_pref, allergies=allergies, goal=goal,
        )
        _plans_col(user_id).document(str(d)).set(_day_to_storage(plan))
        days_out.append(plan)

    return schemas.WeeklyMealPlanOut(
        user_id=user_id,
        start_date=start,
        end_date=start + timedelta(days=payload.days - 1),
        days=days_out,
    )


def get_weekly(user_id: str, start: date_cls, days: int = 7) -> schemas.WeeklyMealPlanOut:
    out: List[schemas.DailyMealPlanOut] = []
    for offset in range(days):
        d = start + timedelta(days=offset)
        plan = get_daily_plan(user_id, d)
        if plan:
            out.append(plan)
    return schemas.WeeklyMealPlanOut(
        user_id=user_id,
        start_date=start,
        end_date=start + timedelta(days=days - 1),
        days=out,
    )


def _aggregate_grocery(plans: List[schemas.DailyMealPlanOut]) -> Tuple[Dict[str, dict], int]:
    """Aggregate { food_id: {food_id, total_grams, appearances} }."""
    acc: Dict[str, dict] = {}
    days_covered = 0
    for plan in plans:
        days_covered += 1
        for slot in plan.meals:
            for item in slot.items:
                entry = acc.setdefault(item.food.id, {
                    "food_id": item.food.id,
                    "total_grams": 0.0,
                    "appearances": 0,
                })
                entry["total_grams"] += item.grams
                entry["appearances"] += 1
    return acc, days_covered


def grocery_list(user_id: str, start: date_cls, days: int = 7) -> schemas.GroceryListOut:
    plans: List[schemas.DailyMealPlanOut] = []
    for offset in range(days):
        d = start + timedelta(days=offset)
        plan = get_daily_plan(user_id, d)
        if plan:
            plans.append(plan)

    acc, days_covered = _aggregate_grocery(plans)
    entries: List[schemas.GroceryEntry] = []

    for food_id, agg in acc.items():
        try:
            food = get_food(food_id)
        except HTTPException:
            continue
        piece_g = PIECE_FOODS.get(food.name)
        pieces = round(agg["total_grams"] / piece_g, 1) if piece_g else None
        entries.append(schemas.GroceryEntry(
            food=food,
            total_grams=round(agg["total_grams"], 1),
            pieces=pieces,
            appearances=int(agg["appearances"]),
        ))

    entries.sort(key=lambda e: (-e.total_grams, e.food.name))

    return schemas.GroceryListOut(
        user_id=user_id,
        start_date=start,
        end_date=start + timedelta(days=days - 1),
        days_covered=days_covered,
        entries=entries,
    )
