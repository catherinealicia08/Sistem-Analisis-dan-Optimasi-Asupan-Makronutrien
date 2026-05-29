"""
Service: analysis_service.py
Kalkulasi analisis makronutrien dan ILP optimization menggunakan data Firestore.
"""

from fastapi import HTTPException
from datetime import date as date_cls
from typing import List

from ..database import db
from .. import schemas, calculations, optimizer
from .food_service import get_food, get_all_foods_as_dicts

USERS_COL = "users"


def _get_user_dict(user_id: str) -> dict:
    doc = db.collection(USERS_COL).document(user_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    return doc.to_dict()


def _get_items_col(user_id: str, day: date_cls):
    return (
        db.collection(USERS_COL)
        .document(user_id)
        .collection("logs")
        .document(str(day))
        .collection("items")
    )


def _intake_for_day(user_id: str, day: date_cls) -> dict:
    """Hitung total intake makronutrien dari log harian."""
    item_docs = list(_get_items_col(user_id, day).stream())

    cal = pro = carb = fat = total_grams = 0.0
    for item_doc in item_docs:
        item = item_doc.to_dict()
        food_id = item.get("food_id")
        grams = item.get("grams", 0.0)
        try:
            food = get_food(food_id)
            ratio = grams / 100.0
            cal += food.calories * ratio
            pro += food.protein * ratio
            carb += food.carbs * ratio
            fat += food.fat * ratio
            total_grams += grams
        except HTTPException:
            continue

    return {
        "calories": cal,
        "protein": pro,
        "carbs": carb,
        "fat": fat,
        "total_grams": total_grams,
    }


def _targets_for_user(u: dict) -> dict:
    bmr = calculations.mifflin_st_jeor(u["weight"], u["height"], u["age"], u["sex"])
    tdee = calculations.tdee(bmr, u["activity_level"])
    target_kcal = calculations.goal_calories(tdee, u["goal"])
    macros = calculations.macro_targets(target_kcal)
    return {
        "bmr": bmr,
        "tdee": tdee,
        "target_calories": target_kcal,
        "target_protein_g": macros["protein"],
        "target_carbs_g": macros["carbs"],
        "target_fat_g": macros["fat"],
    }


def _compute_insights(intake: dict, t: dict) -> List[schemas.DeficiencyInsight]:
    out = []

    pdelta = intake["protein"] - t["target_protein_g"]
    if pdelta < -10:
        out.append(schemas.DeficiencyInsight(
            nutrient="protein",
            severity="high" if pdelta < -30 else "medium",
            message=f"Asupan protein masih kurang {abs(pdelta):.0f} gram untuk mencapai target harian.",
            delta=round(pdelta, 1),
        ))
    elif pdelta < -3:
        out.append(schemas.DeficiencyInsight(
            nutrient="protein", severity="low",
            message=f"Protein sedikit di bawah target ({abs(pdelta):.0f} g lagi).",
            delta=round(pdelta, 1),
        ))

    fdelta = intake["fat"] - t["target_fat_g"]
    if fdelta > 15:
        out.append(schemas.DeficiencyInsight(
            nutrient="fat",
            severity="high" if fdelta > 30 else "medium",
            message=f"Asupan lemak melebihi target sebesar {fdelta:.0f} gram.",
            delta=round(fdelta, 1),
        ))

    cdelta = intake["carbs"] - t["target_carbs_g"]
    if cdelta < -40:
        out.append(schemas.DeficiencyInsight(
            nutrient="carbs", severity="medium",
            message=f"Karbohidrat masih kurang {abs(cdelta):.0f} gram dari target.",
            delta=round(cdelta, 1),
        ))
    elif cdelta > 50:
        out.append(schemas.DeficiencyInsight(
            nutrient="carbs", severity="medium",
            message=f"Karbohidrat melebihi target sebesar {cdelta:.0f} gram.",
            delta=round(cdelta, 1),
        ))

    cal_delta = intake["calories"] - t["target_calories"]
    if cal_delta < -300:
        out.append(schemas.DeficiencyInsight(
            nutrient="calories", severity="medium",
            message=f"Total kalori masih {abs(cal_delta):.0f} kcal di bawah target.",
            delta=round(cal_delta, 1),
        ))
    elif cal_delta > 300:
        out.append(schemas.DeficiencyInsight(
            nutrient="calories", severity="medium",
            message=f"Total kalori melebihi target sebesar {cal_delta:.0f} kcal.",
            delta=round(cal_delta, 1),
        ))

    if not out:
        out.append(schemas.DeficiencyInsight(
            nutrient="overall", severity="low",
            message="Asupan makronutrien Anda mendekati target harian. Pertahankan!",
            delta=0.0,
        ))
    return out


def analyze_day(user_id: str, day: date_cls) -> schemas.AnalysisOut:
    u = _get_user_dict(user_id)
    intake = _intake_for_day(user_id, day)
    t = _targets_for_user(u)

    def pct(actual, target):
        return round((actual / target * 100.0) if target > 0 else 0.0, 1)

    intake_kcal_split = {
        "carbs": intake["carbs"] * 4.0,
        "protein": intake["protein"] * 4.0,
        "fat": intake["fat"] * 9.0,
    }

    quality = schemas.QualityScores(
        protein_density=round(intake["protein"] / intake["calories"], 4) if intake["calories"] > 0 else 0.0,
        energy_density=round(intake["calories"] / intake["total_grams"], 3) if intake["total_grams"] > 0 else 0.0,
        macro_balance_score=calculations.macro_balance_score(intake_kcal_split),
    )

    return schemas.AnalysisOut(
        targets=schemas.MetabolicTargets(
            bmr=round(t["bmr"], 1),
            tdee=round(t["tdee"], 1),
            target_calories=round(t["target_calories"], 1),
            target_protein_g=round(t["target_protein_g"], 1),
            target_carbs_g=round(t["target_carbs_g"], 1),
            target_fat_g=round(t["target_fat_g"], 1),
        ),
        intake=schemas.MacroIntake(
            calories=round(intake["calories"], 1),
            protein=round(intake["protein"], 1),
            carbs=round(intake["carbs"], 1),
            fat=round(intake["fat"], 1),
        ),
        fulfillment_pct=schemas.MacroIntake(
            calories=pct(intake["calories"], t["target_calories"]),
            protein=pct(intake["protein"], t["target_protein_g"]),
            carbs=pct(intake["carbs"], t["target_carbs_g"]),
            fat=pct(intake["fat"], t["target_fat_g"]),
        ),
        quality=quality,
        insights=_compute_insights(intake, t),
    )


def optimize_day(user_id: str, day: date_cls) -> schemas.OptimizationOut:
    u = _get_user_dict(user_id)
    intake = _intake_for_day(user_id, day)
    t = _targets_for_user(u)

    food_dicts = get_all_foods_as_dicts()

    result = optimizer.optimize_meal(
        foods=food_dicts,
        target_calories=t["target_calories"],
        target_protein=t["target_protein_g"],
        target_carbs=t["target_carbs_g"],
        target_fat=t["target_fat_g"],
        current_calories=intake["calories"],
        current_protein=intake["protein"],
        current_carbs=intake["carbs"],
        current_fat=intake["fat"],
    )

    food_by_id = {f["id"]: f for f in food_dicts}
    recs = []
    for p in result["picks"]:
        fid = p["food_id"]
        if fid not in food_by_id:
            continue
        fd = food_by_id[fid]
        food_out = schemas.FoodOut(
            id=fid,
            name=fd["name"],
            category=fd["category"],
            image_url=fd.get("image_url"),
            calories=fd["calories"],
            protein=fd["protein"],
            fat=fd["fat"],
            carbs=fd["carbs"],
            serving_size=fd.get("serving_size", 100.0),
        )
        recs.append(schemas.RecommendationItem(
            food=food_out,
            grams=p["grams"],
            added_calories=round(p["added_calories"], 1),
            added_protein=round(p["added_protein"], 1),
            added_carbs=round(p["added_carbs"], 1),
            added_fat=round(p["added_fat"], 1),
        ))

    def pct(actual, target):
        return round((actual / target * 100.0) if target > 0 else 0.0, 1)

    projected_cal = intake["calories"] + result["added_totals"]["calories"]
    projected_pro = intake["protein"] + result["added_totals"]["protein"]
    projected_carb = intake["carbs"] + result["added_totals"]["carbs"]
    projected_fat = intake["fat"] + result["added_totals"]["fat"]

    return schemas.OptimizationOut(
        status=result["status"],
        objective_value=round(result["objective_value"], 2),
        recommendations=recs,
        projected_intake=schemas.MacroIntake(
            calories=round(projected_cal, 1),
            protein=round(projected_pro, 1),
            carbs=round(projected_carb, 1),
            fat=round(projected_fat, 1),
        ),
        projected_fulfillment_pct=schemas.MacroIntake(
            calories=pct(projected_cal, t["target_calories"]),
            protein=pct(projected_pro, t["target_protein_g"]),
            carbs=pct(projected_carb, t["target_carbs_g"]),
            fat=pct(projected_fat, t["target_fat_g"]),
        ),
    )
