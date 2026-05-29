"""
Metabolic and macronutrient calculations.

References:
- Mifflin MD et al. (1990). A new predictive equation for resting energy
  expenditure in healthy individuals. Am J Clin Nutr 51(2):241-247.
- Academy of Nutrition and Dietetics / ACSM activity multipliers.
- Institute of Medicine — Acceptable Macronutrient Distribution Range (AMDR).
"""

from typing import Dict


ACTIVITY_FACTORS: Dict[str, float] = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "very_active": 1.725,
    "athlete": 1.9,
}

# kcal / gram
KCAL_PER_G = {"protein": 4.0, "carbs": 4.0, "fat": 9.0}

# Default macro split — within AMDR (Institute of Medicine)
DEFAULT_MACRO_SPLIT = {"carbs": 0.50, "protein": 0.25, "fat": 0.25}

GOAL_ADJUSTMENT = {
    "weight_loss": -0.15,
    "maintenance": 0.0,
    "muscle_gain": 0.10,
}


def mifflin_st_jeor(weight_kg: float, height_cm: float, age: int, sex: str) -> float:
    """Mifflin-St Jeor BMR (kcal/day)."""
    base = 10 * weight_kg + 6.25 * height_cm - 5 * age
    return base + (5 if sex == "male" else -161)


def tdee(bmr: float, activity_level: str) -> float:
    factor = ACTIVITY_FACTORS.get(activity_level, 1.55)
    return bmr * factor


def goal_calories(tdee_kcal: float, goal: str) -> float:
    return tdee_kcal * (1.0 + GOAL_ADJUSTMENT.get(goal, 0.0))


def macro_targets(target_kcal: float, split: Dict[str, float] = None) -> Dict[str, float]:
    """Returns grams of carbs, protein, fat for a calorie target."""
    s = split or DEFAULT_MACRO_SPLIT
    return {
        "carbs": (target_kcal * s["carbs"]) / KCAL_PER_G["carbs"],
        "protein": (target_kcal * s["protein"]) / KCAL_PER_G["protein"],
        "fat": (target_kcal * s["fat"]) / KCAL_PER_G["fat"],
    }


def macro_balance_score(intake_kcal_split: Dict[str, float]) -> float:
    """
    Score 0–100 measuring how close the actual macro split is to AMDR midpoints
    (carbs 55%, protein 22.5%, fat 27.5%).
    """
    ideal = {"carbs": 0.55, "protein": 0.225, "fat": 0.275}
    total = sum(intake_kcal_split.values())
    if total <= 0:
        return 0.0
    actual = {k: v / total for k, v in intake_kcal_split.items()}
    # Sum of absolute deviations -> map to 0..100.
    deviation = sum(abs(actual[k] - ideal[k]) for k in ideal)
    # Max possible deviation = 2 (one macro at 100%, others 0)
    score = max(0.0, 1.0 - deviation / 2.0) * 100.0
    return round(score, 1)
