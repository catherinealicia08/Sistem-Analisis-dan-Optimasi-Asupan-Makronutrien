"""
Controller: progress.py — progress + weight tracking endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List

from .. import schemas
from ..auth.deps import get_current_user
from ..services import progress_service

router = APIRouter(prefix="/users/{user_id}", tags=["progress"])


def _guard(user_id: str, current: schemas.UserOut) -> None:
    if current.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")


@router.get(
    "/progress",
    response_model=schemas.ProgressOut,
    summary="Daily compliance, NAS, and weight trend",
)
def get_progress(
    user_id: str,
    days: int = Query(default=7, ge=1, le=90),
    current: schemas.UserOut = Depends(get_current_user),
):
    _guard(user_id, current)
    return progress_service.progress(user_id, days)


@router.post(
    "/weight",
    response_model=schemas.WeightLogOut,
    status_code=201,
    summary="Log a weight measurement",
)
def log_weight(
    user_id: str,
    payload: schemas.WeightLogIn,
    current: schemas.UserOut = Depends(get_current_user),
):
    _guard(user_id, current)
    return progress_service.log_weight(user_id, payload)


@router.get(
    "/weight-history",
    response_model=List[schemas.WeightLogOut],
    summary="Weight log history (oldest-first)",
)
def weight_history(
    user_id: str,
    days: int = Query(default=90, ge=1, le=365),
    current: schemas.UserOut = Depends(get_current_user),
):
    _guard(user_id, current)
    return progress_service.list_weight_history(user_id, days)


# Same routes rooted at the authenticated user.
me_router = APIRouter(prefix="/me", tags=["progress"])


@me_router.get("/progress", response_model=schemas.ProgressOut)
def me_progress(
    days: int = Query(default=7, ge=1, le=90),
    current: schemas.UserOut = Depends(get_current_user),
):
    return progress_service.progress(current.id, days)


@me_router.post("/weight", response_model=schemas.WeightLogOut, status_code=201)
def me_log_weight(
    payload: schemas.WeightLogIn,
    current: schemas.UserOut = Depends(get_current_user),
):
    return progress_service.log_weight(current.id, payload)


@me_router.get("/weight-history", response_model=List[schemas.WeightLogOut])
def me_weight_history(
    days: int = Query(default=90, ge=1, le=365),
    current: schemas.UserOut = Depends(get_current_user),
):
    return progress_service.list_weight_history(current.id, days)
