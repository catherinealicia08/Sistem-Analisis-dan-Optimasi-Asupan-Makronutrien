from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/foods", tags=["foods"])


@router.get("", response_model=List[schemas.FoodOut])
def list_foods(
    db: Session = Depends(get_db),
    q: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = Query(200, le=500),
):
    query = db.query(models.Food)
    if q:
        query = query.filter(models.Food.name.ilike(f"%{q}%"))
    if category:
        query = query.filter(models.Food.category == category)
    return query.order_by(models.Food.name).limit(limit).all()


@router.get("/categories", response_model=List[str])
def list_categories(db: Session = Depends(get_db)):
    rows = db.query(models.Food.category).distinct().all()
    return sorted({r[0] for r in rows})


@router.get("/{food_id}", response_model=schemas.FoodOut)
def get_food(food_id: int, db: Session = Depends(get_db)):
    food = db.get(models.Food, food_id)
    if not food:
        raise HTTPException(404, "Food not found")
    return food


@router.post("", response_model=schemas.FoodOut, status_code=201)
def create_food(payload: schemas.FoodCreate, db: Session = Depends(get_db)):
    food = models.Food(**payload.model_dump())
    db.add(food)
    db.commit()
    db.refresh(food)
    return food
