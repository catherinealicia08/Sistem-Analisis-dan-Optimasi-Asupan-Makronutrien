"""
Controller: logs.py
Route handlers untuk /users/{user_id}/logs/{day}.
"""

from fastapi import APIRouter
from datetime import date as date_cls
from typing import List

from .. import schemas
from ..services import log_service

router = APIRouter(prefix="/users/{user_id}/logs", tags=["logs"])


@router.get("/{day}", response_model=schemas.DailyLogOut, summary="Get log harian user")
def get_log(user_id: str, day: date_cls):
    return log_service.get_log(user_id, day)


@router.post("/{day}/items", response_model=schemas.LogItemOut, status_code=201, summary="Tambah item ke log harian")
def add_item(user_id: str, day: date_cls, payload: schemas.LogItemCreate):
    return log_service.add_item(user_id, day, payload)


@router.delete("/{day}/items/{item_id}", status_code=204, summary="Hapus item dari log harian")
def delete_item(user_id: str, day: date_cls, item_id: str):
    log_service.delete_item(user_id, day, item_id)


@router.get("/weekly/{day}", response_model=List[schemas.MacroIntake], summary="7 hari history makronutrien")
def weekly_intake(user_id: str, day: date_cls):
    return log_service.get_weekly_intake(user_id, day)
