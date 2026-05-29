"""
Service: progress_service.py

Computes the longitudinal adherence + weight tracking surface used by the
Progress page.

Compliance scoring per macro (calorie, protein, carbs, fat) follows a
mean-percentage-error (MPE) formulation:

    score_X = max(0, 100 - mean( |intake_X(d) - target_X| / target_X * 100 ))

bounded to [0, 100]. The composite Nutrition Adherence Score (NAS) weights the
four scores by health priority:

    NAS = 0.4 * S_calories + 0.3 * S_protein + 0.2 * S_carbs + 0.1 * S_fat

The 0.4/0.3/0.2/0.1 weighting is a *derived metric* proposed by this project
(see paper: derivation from Position Stand on athletic nutrition, Thomas 2016).
It is not pulled from a single peer-reviewed source verbatim — it should be
classified as "proposed metric" in the scientific-validation report.

Energy balance follows the Hall et al. dynamic energy balance framing:
    EB(d) = intake_calories(d) - target_calories
A negative balance is a deficit (suitable for weight-loss goals); a positive
balance is a surplus (suitable for muscle gain). The provided literature
reference is for the conceptual framing, not the exact compliance formula.

Weight tracking is a separate Firestore subcollection:
    users/{uid}/weight_logs/{auto_id}
indexed by `date` (string YYYY-MM-DD). Latest weight automatically updates the
parent user document so target_calories are recomputed on the next analyze.
"""

from datetime import date as date_cls, datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple

from fastapi import HTTPException

from .. import schemas
from ..database import db
from .analysis_service import _get_user_dict, _intake_for_day, _targets_for_user

WEIGHT_LOGS_SUB = "weight_logs"
USERS_COL = "users"


# ---------- weight log persistence ----------

def _weight_col(user_id: str):
    return db.collection(USERS_COL).document(user_id).collection(WEIGHT_LOGS_SUB)


def _doc_to_weight(doc) -> schemas.WeightLogOut:
    data = doc.to_dict() or {}
    return schemas.WeightLogOut(
        id=doc.id,
        date=date_cls.fromisoformat(str(data.get("date"))),
        weight=float(data.get("weight", 0.0)),
        note=data.get("note"),
        created_at=data.get("created_at"),
    )


def log_weight(user_id: str, payload: schemas.WeightLogIn) -> schemas.WeightLogOut:
    user_ref = db.collection(USERS_COL).document(user_id)
    if not user_ref.get().exists:
        raise HTTPException(status_code=404, detail="User not found")

    now = datetime.now(tz=timezone.utc)
    day = payload.date or date_cls.today()
    data = {
        "date": str(day),
        "weight": float(payload.weight),
        "note": payload.note,
        "created_at": now,
    }
    _, ref = _weight_col(user_id).add(data)

    # Keep the canonical user.weight in sync with the latest log.
    user_ref.update({"weight": float(payload.weight), "updated_at": now})

    doc = ref.get()
    return _doc_to_weight(doc)


def list_weight_history(user_id: str, days: int = 90) -> List[schemas.WeightLogOut]:
    """All logs in the trailing window, oldest-first."""
    cutoff = (date_cls.today() - timedelta(days=days)).isoformat()
    docs = (
        _weight_col(user_id)
        .where("date", ">=", cutoff)
        .stream()
    )
    items = [_doc_to_weight(d) for d in docs]
    items.sort(key=lambda w: w.date)
    return items


# ---------- daily compliance + adherence summary ----------

def _safe_pct_err(actual: float, target: float) -> float:
    if target <= 0:
        return 0.0
    return abs(actual - target) / target * 100.0


def _macro_share(intake: dict) -> Dict[str, float]:
    total_kcal = (intake.get("protein", 0) * 4
                  + intake.get("carbs", 0) * 4
                  + intake.get("fat", 0) * 9)
    if total_kcal <= 0:
        return {"protein": 0.0, "carbs": 0.0, "fat": 0.0}
    return {
        "protein": round(intake["protein"] * 4 / total_kcal * 100, 1),
        "carbs":   round(intake["carbs"]   * 4 / total_kcal * 100, 1),
        "fat":     round(intake["fat"]     * 9 / total_kcal * 100, 1),
    }


def _classify(nas: float) -> str:
    if nas >= 85: return "Excellent"
    if nas >= 70: return "Good"
    if nas >= 50: return "Fair"
    return "Poor"


def _build_daily(user_id: str, day: date_cls, targets: dict) -> Tuple[schemas.DailyComplianceOut, Dict[str, float]]:
    intake = _intake_for_day(user_id, day)
    cal_target  = targets["target_calories"]
    pro_target  = targets["target_protein_g"]
    carb_target = targets["target_carbs_g"]
    fat_target  = targets["target_fat_g"]

    errs = {
        "calories": _safe_pct_err(intake["calories"], cal_target),
        "protein":  _safe_pct_err(intake["protein"],  pro_target),
        "carbs":    _safe_pct_err(intake["carbs"],    carb_target),
        "fat":      _safe_pct_err(intake["fat"],      fat_target),
    }
    # Composite calorie-and-macro score for the day.
    score = max(0.0, 100.0 - (errs["calories"] + errs["protein"] + errs["carbs"] + errs["fat"]) / 4.0)
    eb = intake["calories"] - cal_target

    daily = schemas.DailyComplianceOut(
        date=day,
        intake=schemas.MacroIntake(
            calories=round(intake["calories"], 1),
            protein=round(intake["protein"], 1),
            carbs=round(intake["carbs"], 1),
            fat=round(intake["fat"], 1),
        ),
        target_calories=round(cal_target, 1),
        target_protein=round(pro_target, 1),
        target_carbs=round(carb_target, 1),
        target_fat=round(fat_target, 1),
        score=round(score, 1),
        energy_balance_kcal=round(eb, 1),
        macro_share=_macro_share(intake),
    )
    return daily, errs


def _build_summary(daily: List[schemas.DailyComplianceOut],
                   per_day_errs: List[Dict[str, float]]) -> schemas.AdherenceSummary:
    n = max(1, len(daily))

    def s(key: str) -> float:
        mean_err = sum(e[key] for e in per_day_errs) / n
        return round(max(0.0, 100.0 - mean_err), 1)

    cal_s   = s("calories")
    pro_s   = s("protein")
    carb_s  = s("carbs")
    fat_s   = s("fat")
    nas = round(0.4 * cal_s + 0.3 * pro_s + 0.2 * carb_s + 0.1 * fat_s, 1)
    avg_eb = round(sum(d.energy_balance_kcal for d in daily) / n, 1)
    pro_met = sum(1 for d in daily if d.intake.protein >= d.target_protein * 0.95)

    insights: List[str] = []
    if pro_met >= 1:
        insights.append(f"Protein target met on {pro_met} of the last {n} days.")
    if avg_eb > 50:
        insights.append(f"Average caloric surplus: +{avg_eb:.0f} kcal/day.")
    elif avg_eb < -50:
        insights.append(f"Average caloric deficit: {avg_eb:.0f} kcal/day.")
    else:
        insights.append("Caloric intake is balanced against target.")

    return schemas.AdherenceSummary(
        days=n,
        calorie_score=cal_s,
        protein_score=pro_s,
        carbs_score=carb_s,
        fat_score=fat_s,
        nas=nas,
        classification=_classify(nas),  # type: ignore[arg-type]
        avg_energy_balance=avg_eb,
        days_protein_target_met=pro_met,
        insights=insights,
    )


def progress(user_id: str, window_days: int = 7) -> schemas.ProgressOut:
    user = _get_user_dict(user_id)
    targets = _targets_for_user(user)
    if targets["target_calories"] <= 0:
        raise HTTPException(status_code=400, detail="User profile is incomplete.")

    today = date_cls.today()
    start = today - timedelta(days=window_days - 1)

    daily: List[schemas.DailyComplianceOut] = []
    per_day_errs: List[Dict[str, float]] = []
    for i in range(window_days):
        d = start + timedelta(days=i)
        compliance, errs = _build_daily(user_id, d, targets)
        daily.append(compliance)
        per_day_errs.append(errs)

    summary = _build_summary(daily, per_day_errs)
    weight_history = list_weight_history(user_id, days=max(window_days, 30))
    weight_change: Optional[float] = None
    if len(weight_history) >= 2:
        weight_change = round(weight_history[-1].weight - weight_history[0].weight, 2)
        insight = (f"Weight changed by {weight_change:+.1f} kg over the last "
                   f"{(weight_history[-1].date - weight_history[0].date).days} days.")
        summary.insights.append(insight)

    return schemas.ProgressOut(
        user_id=user_id,
        window_days=window_days,
        daily=daily,
        summary=summary,
        weight_history=weight_history,
        weight_change_kg=weight_change,
    )
