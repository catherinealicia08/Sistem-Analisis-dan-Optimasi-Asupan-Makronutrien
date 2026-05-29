"""
Multi-objective Integer Linear Programming optimizer for meal recommendations.

Formulation:
  Decision variables  x_i = grams of food i to add (integer; modeled in 10 g steps).
  Objective           minimize weighted absolute deviation from macro and calorie targets.
  Constraints
      - Protein added must close at least half the protein deficit (encourages high-protein picks).
      - Calories added must not exceed remaining calorie budget * 1.05 (small slack).
      - Fat added must not push total fat over target * 1.05.
      - Each food x_i in [0, max_grams_per_food].
      - Total number of foods picked <= max_items (sparsity).
"""

from typing import List, Dict, Optional
import pulp


GRAM_STEP = 10  # grams per ILP unit — keeps the search space small.
DEFAULT_MAX_GRAMS_PER_FOOD = 300
DEFAULT_MAX_ITEMS = 4
BIG_M = 10_000


def optimize_meal(
    foods: List[Dict],
    target_calories: float,
    target_protein: float,
    target_carbs: float,
    target_fat: float,
    current_calories: float,
    current_protein: float,
    current_carbs: float,
    current_fat: float,
    max_items: int = DEFAULT_MAX_ITEMS,
    max_grams_per_food: int = DEFAULT_MAX_GRAMS_PER_FOOD,
) -> Dict:
    """
    foods: list of dicts with keys id, name, calories, protein, fat, carbs
           (all per 100 g).
    Returns a dict with status, objective, picks (food_id -> grams), totals.
    """

    if not foods:
        return _empty_result("no_foods")

    remaining_cal = max(0.0, target_calories - current_calories)
    deficit_protein = max(0.0, target_protein - current_protein)
    deficit_carbs = max(0.0, target_carbs - current_carbs)
    remaining_fat = max(0.0, target_fat - current_fat)

    if remaining_cal < 50 and deficit_protein < 5:
        # Nothing meaningful to recommend — already on target.
        return _empty_result("already_on_target")

    prob = pulp.LpProblem("meal_optimization", pulp.LpMinimize)

    # x_i = number of 10g units of food i
    units_cap = max(1, max_grams_per_food // GRAM_STEP)
    x = {
        f["id"]: pulp.LpVariable(f"x_{f['id']}", lowBound=0, upBound=units_cap, cat="Integer")
        for f in foods
    }
    # y_i = 1 if food i picked (x_i > 0)
    y = {
        f["id"]: pulp.LpVariable(f"y_{f['id']}", cat="Binary")
        for f in foods
    }

    # Per-unit (10 g) nutrient contribution.
    def per_unit(f, key):
        return (f[key] / 100.0) * GRAM_STEP

    # Total added macros.
    added_cal = pulp.lpSum(per_unit(f, "calories") * x[f["id"]] for f in foods)
    added_pro = pulp.lpSum(per_unit(f, "protein") * x[f["id"]] for f in foods)
    added_carb = pulp.lpSum(per_unit(f, "carbs") * x[f["id"]] for f in foods)
    added_fat = pulp.lpSum(per_unit(f, "fat") * x[f["id"]] for f in foods)

    # Deviation auxiliary variables (|target_deficit - added|)
    dev_pro = pulp.LpVariable("dev_pro", lowBound=0)
    dev_carb = pulp.LpVariable("dev_carb", lowBound=0)
    dev_fat = pulp.LpVariable("dev_fat", lowBound=0)
    dev_cal = pulp.LpVariable("dev_cal", lowBound=0)

    prob += dev_pro >= deficit_protein - added_pro
    prob += dev_pro >= added_pro - deficit_protein
    prob += dev_carb >= deficit_carbs - added_carb
    prob += dev_carb >= added_carb - deficit_carbs
    prob += dev_fat >= remaining_fat - added_fat
    prob += dev_fat >= added_fat - remaining_fat
    prob += dev_cal >= remaining_cal - added_cal
    prob += dev_cal >= added_cal - remaining_cal

    # Objective: weighted absolute deviation. Protein weighted highest because
    # protein deficit is the hardest-to-fix nutrient and most impactful for goal.
    prob += (
        4.0 * dev_pro
        + 1.5 * dev_carb
        + 2.0 * dev_fat
        + 1.0 * dev_cal
    )

    # Hard constraints.
    # 1. Calories cannot exceed remaining budget by more than 5%.
    prob += added_cal <= remaining_cal * 1.05 + 50  # +50 kcal slack for tiny budgets

    # 2. Fat cannot exceed remaining fat budget by more than 5%.
    prob += added_fat <= remaining_fat * 1.05 + 5

    # 3. Protein added covers at least 50% of protein deficit (if deficit > 5 g).
    if deficit_protein > 5:
        prob += added_pro >= deficit_protein * 0.5

    # 4. Linking x_i and y_i — x_i > 0 implies y_i = 1.
    for f in foods:
        prob += x[f["id"]] <= units_cap * y[f["id"]]
        prob += x[f["id"]] >= y[f["id"]]  # if y=1 then at least 10 g

    # 5. Sparsity: at most max_items distinct foods.
    prob += pulp.lpSum(y[f["id"]] for f in foods) <= max_items

    # 6. At least one item if there is a meaningful deficit.
    prob += pulp.lpSum(y[f["id"]] for f in foods) >= 1

    solver = pulp.PULP_CBC_CMD(msg=False, timeLimit=10)
    result = prob.solve(solver)

    status = pulp.LpStatus[result]
    if status not in ("Optimal", "Not Solved", "Undefined"):
        # Loosen: drop protein lower bound and resolve.
        return _empty_result(f"infeasible:{status}")

    picks = []
    by_id = {f["id"]: f for f in foods}
    for fid, var in x.items():
        units = var.value() or 0
        if units >= 1:
            grams = units * GRAM_STEP
            f = by_id[fid]
            picks.append({
                "food_id": fid,
                "grams": grams,
                "added_calories": f["calories"] * grams / 100.0,
                "added_protein": f["protein"] * grams / 100.0,
                "added_carbs": f["carbs"] * grams / 100.0,
                "added_fat": f["fat"] * grams / 100.0,
            })

    if not picks:
        return _empty_result("no_picks")

    total_cal = sum(p["added_calories"] for p in picks)
    total_pro = sum(p["added_protein"] for p in picks)
    total_carb = sum(p["added_carbs"] for p in picks)
    total_fat = sum(p["added_fat"] for p in picks)

    return {
        "status": status,
        "objective_value": float(pulp.value(prob.objective) or 0.0),
        "picks": picks,
        "added_totals": {
            "calories": total_cal,
            "protein": total_pro,
            "carbs": total_carb,
            "fat": total_fat,
        },
    }


def _empty_result(status: str) -> Dict:
    return {
        "status": status,
        "objective_value": 0.0,
        "picks": [],
        "added_totals": {"calories": 0.0, "protein": 0.0, "carbs": 0.0, "fat": 0.0},
    }
