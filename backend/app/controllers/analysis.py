"""
Controller: analysis.py
Route handlers untuk /users/{user_id}/analysis dan /optimize.
"""

from fastapi import APIRouter
from datetime import date as date_cls

from .. import schemas
from ..services import analysis_service

router = APIRouter(prefix="/users/{user_id}", tags=["analysis"])


@router.get(
    "/analysis/{day}",
    response_model=schemas.AnalysisOut,
    summary="Analisis makronutrien harian",
)
def analyze_day(user_id: str, day: date_cls):
    return analysis_service.analyze_day(user_id, day)


@router.post(
    "/optimize/{day}",
    response_model=schemas.OptimizationOut,
    summary="Rekomendasi makanan optimal (ILP)",
)
def optimize_day(user_id: str, day: date_cls):
    return analysis_service.optimize_day(user_id, day)
