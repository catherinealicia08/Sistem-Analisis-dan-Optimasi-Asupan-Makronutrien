from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date as date_cls

from .. import models, schemas, calculations, optimizer
from ..database import get_db

router = APIRouter(prefix="/users/{user_id}", tags=["analysis"])


def _intake_for(log: models.DailyLog) -> dict:
    cal = pro = carb = fat = 0.0
    total_grams = 0.0
    for it in log.items:
        f = it.food
        ratio = it.grams / 100.0
        cal += f.calories * ratio
        pro += f.protein * ratio
        carb += f.carbs * ratio
        fat += f.fat * ratio
        total_grams += it.grams
    return {
        "calories": cal,
        "protein": pro,
        "carbs": carb,
        "fat": fat,
        "total_grams": total_grams,
    }


def _targets_for(user: models.User) -> dict:
    bmr = calculations.mifflin_st_jeor(user.weight, user.height, user.age, user.sex)
    tdee = calculations.tdee(bmr, user.activity_level)
    target_kcal = calculations.goal_calories(tdee, user.goal)
    macros = calculations.macro_targets(target_kcal)
    return {
        "bmr": bmr,
        "tdee": tdee,
        "target_calories": target_kcal,
        "target_protein_g": macros["protein"],
        "target_carbs_g": macros["carbs"],
        "target_fat_g": macros["fat"],
    }


def _insights(intake: dict, t: dict) -> list:
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
            nutrient="carbs",
            severity="medium",
            message=f"Karbohidrat masih kurang {abs(cdelta):.0f} gram dari target.",
            delta=round(cdelta, 1),
        ))
    elif cdelta > 50:
        out.append(schemas.DeficiencyInsight(
            nutrient="carbs",
            severity="medium",
            message=f"Karbohidrat melebihi target sebesar {cdelta:.0f} gram.",
            delta=round(cdelta, 1),
        ))

    cal_delta = intake["calories"] - t["target_calories"]
    if cal_delta < -300:
        out.append(schemas.DeficiencyInsight(
            nutrient="calories",
            severity="medium",
            message=f"Total kalori masih {abs(cal_delta):.0f} kcal di bawah target.",
            delta=round(cal_delta, 1),
        ))
    elif cal_delta > 300:
        out.append(schemas.DeficiencyInsight(
            nutrient="calories",
            severity="medium",
            message=f"Total kalori melebihi target sebesar {cal_delta:.0f} kcal.",
            delta=round(cal_delta, 1),
        ))

    if not out:
        out.append(schemas.DeficiencyInsight(
            nutrient="overall",
            severity="low",
            message="Asupan makronutrien Anda mendekati target harian. Pertahankan!",
            delta=0.0,
        ))
    return out


@router.get("/analysis/{day}", response_model=schemas.AnalysisOut)
def analyze_day(user_id: int, day: date_cls, db: Session = Depends(get_db)):
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    log = (
        db.query(models.DailyLog)
        .filter(models.DailyLog.user_id == user_id, models.DailyLog.date == day)
        .first()
    )
    intake = _intake_for(log) if log else {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "total_grams": 0}
    t = _targets_for(user)

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
        insights=_insights(intake, t),
    )


@router.post("/optimize/{day}", response_model=schemas.OptimizationOut)
def optimize_day(user_id: int, day: date_cls, db: Session = Depends(get_db)):
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    log = (
        db.query(models.DailyLog)
        .filter(models.DailyLog.user_id == user_id, models.DailyLog.date == day)
        .first()
    )
    intake = _intake_for(log) if log else {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "total_grams": 0}
    t = _targets_for(user)

    foods = db.query(models.Food).all()
    food_dicts = [{
        "id": f.id, "name": f.name, "calories": f.calories,
        "protein": f.protein, "carbs": f.carbs, "fat": f.fat,
    } for f in foods]

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

    food_by_id = {f.id: f for f in foods}
    recs = []
    for p in result["picks"]:
        recs.append(schemas.RecommendationItem(
            food=schemas.FoodOut.model_validate(food_by_id[p["food_id"]]),
            grams=p["grams"],
            added_calories=round(p["added_calories"], 1),
            added_protein=round(p["added_protein"], 1),
            added_carbs=round(p["added_carbs"], 1),
            added_fat=round(p["added_fat"], 1),
        ))

    projected_cal = intake["calories"] + result["added_totals"]["calories"]
    projected_pro = intake["protein"] + result["added_totals"]["protein"]
    projected_carb = intake["carbs"] + result["added_totals"]["carbs"]
    projected_fat = intake["fat"] + result["added_totals"]["fat"]

    def pct(actual, target):
        return round((actual / target * 100.0) if target > 0 else 0.0, 1)

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
