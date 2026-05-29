from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date as date_cls, timedelta
from typing import List

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/users/{user_id}/logs", tags=["logs"])


def _get_or_create_log(db: Session, user_id: int, day: date_cls) -> models.DailyLog:
    log = (
        db.query(models.DailyLog)
        .filter(models.DailyLog.user_id == user_id, models.DailyLog.date == day)
        .first()
    )
    if not log:
        log = models.DailyLog(user_id=user_id, date=day)
        db.add(log)
        db.commit()
        db.refresh(log)
    return log


@router.get("/{day}", response_model=schemas.DailyLogOut)
def get_log(user_id: int, day: date_cls, db: Session = Depends(get_db)):
    if not db.get(models.User, user_id):
        raise HTTPException(404, "User not found")
    return _get_or_create_log(db, user_id, day)


@router.post("/{day}/items", response_model=schemas.LogItemOut, status_code=201)
def add_item(user_id: int, day: date_cls, payload: schemas.LogItemCreate, db: Session = Depends(get_db)):
    if not db.get(models.User, user_id):
        raise HTTPException(404, "User not found")
    if not db.get(models.Food, payload.food_id):
        raise HTTPException(404, "Food not found")
    log = _get_or_create_log(db, user_id, day)
    item = models.DailyLogItem(log_id=log.id, food_id=payload.food_id, grams=payload.grams)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/items/{item_id}", status_code=204)
def delete_item(user_id: int, item_id: int, db: Session = Depends(get_db)):
    item = db.get(models.DailyLogItem, item_id)
    if not item or item.log.user_id != user_id:
        raise HTTPException(404, "Item not found")
    db.delete(item)
    db.commit()


@router.get("/weekly/{day}", response_model=List[schemas.MacroIntake])
def weekly_intake(user_id: int, day: date_cls, db: Session = Depends(get_db)):
    """Returns the 7 days ending at `day`, oldest first."""
    if not db.get(models.User, user_id):
        raise HTTPException(404, "User not found")

    start = day - timedelta(days=6)
    logs = (
        db.query(models.DailyLog)
        .filter(
            models.DailyLog.user_id == user_id,
            models.DailyLog.date >= start,
            models.DailyLog.date <= day,
        )
        .all()
    )
    by_date = {log.date: log for log in logs}
    out = []
    for i in range(7):
        d = start + timedelta(days=i)
        log = by_date.get(d)
        cal = pro = carb = fat = 0.0
        if log:
            for it in log.items:
                f = it.food
                ratio = it.grams / 100.0
                cal += f.calories * ratio
                pro += f.protein * ratio
                carb += f.carbs * ratio
                fat += f.fat * ratio
        out.append(schemas.MacroIntake(
            calories=round(cal, 1),
            protein=round(pro, 1),
            carbs=round(carb, 1),
            fat=round(fat, 1),
        ))
    return out
