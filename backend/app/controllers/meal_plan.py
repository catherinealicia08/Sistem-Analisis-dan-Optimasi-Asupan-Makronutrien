"""
Controller: meal_plan.py — meal-planner and grocery-list endpoints.
"""

from datetime import date as date_cls, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query

from .. import schemas
from ..auth.deps import get_current_user
from ..services import meal_plan_service

router = APIRouter(prefix="/users/{user_id}", tags=["meal-planner"])


def _guard(user_id: str, current: schemas.UserOut) -> None:
    if current.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")


@router.get(
    "/meal-plan",
    response_model=schemas.WeeklyMealPlanOut,
    summary="Get the week's meal plan starting at `start`",
)
def get_meal_plan(
    user_id: str,
    start: date_cls | None = Query(default=None, description="Defaults to today"),
    days: int = Query(default=7, ge=1, le=14),
    current: schemas.UserOut = Depends(get_current_user),
):
    _guard(user_id, current)
    start_date = start or date_cls.today()
    return meal_plan_service.get_weekly(user_id, start_date, days)


@router.get(
    "/meal-plan/{day}",
    response_model=schemas.DailyMealPlanOut,
    summary="Get a single day's meal plan",
)
def get_day_plan(
    user_id: str,
    day: date_cls,
    current: schemas.UserOut = Depends(get_current_user),
):
    _guard(user_id, current)
    plan = meal_plan_service.get_daily_plan(user_id, day)
    if not plan:
        raise HTTPException(status_code=404, detail="No plan generated for that date.")
    return plan


@router.post(
    "/meal-plan/generate",
    response_model=schemas.WeeklyMealPlanOut,
    summary="Generate (or regenerate) a meal plan via ILP",
)
def generate_plan(
    user_id: str,
    payload: schemas.MealPlanGenerateIn,
    current: schemas.UserOut = Depends(get_current_user),
):
    _guard(user_id, current)
    return meal_plan_service.generate(user_id, payload)


@router.get(
    "/grocery-list",
    response_model=schemas.GroceryListOut,
    summary="Aggregated grocery list for a date window",
)
def grocery_list(
    user_id: str,
    start: date_cls | None = Query(default=None),
    days: int = Query(default=7, ge=1, le=14),
    current: schemas.UserOut = Depends(get_current_user),
):
    _guard(user_id, current)
    start_date = start or date_cls.today()
    return meal_plan_service.grocery_list(user_id, start_date, days)


# Convenience: same routes but rooted at the authenticated user, for the
# frontend to avoid plumbing the user ID through every page.
me_router = APIRouter(prefix="/me", tags=["meal-planner"])


@me_router.get("/meal-plan", response_model=schemas.WeeklyMealPlanOut)
def me_get_meal_plan(
    start: date_cls | None = Query(default=None),
    days: int = Query(default=7, ge=1, le=14),
    current: schemas.UserOut = Depends(get_current_user),
):
    return meal_plan_service.get_weekly(current.id, start or date_cls.today(), days)


@me_router.post("/meal-plan/generate", response_model=schemas.WeeklyMealPlanOut)
def me_generate_plan(
    payload: schemas.MealPlanGenerateIn,
    current: schemas.UserOut = Depends(get_current_user),
):
    return meal_plan_service.generate(current.id, payload)


@me_router.get("/grocery-list", response_model=schemas.GroceryListOut)
def me_grocery_list(
    start: date_cls | None = Query(default=None),
    days: int = Query(default=7, ge=1, le=14),
    current: schemas.UserOut = Depends(get_current_user),
):
    start_date = start or date_cls.today()
    return meal_plan_service.grocery_list(current.id, start_date, days)


# Keep `timedelta` import meaningful for future extension (no-op alias).
_ = timedelta
