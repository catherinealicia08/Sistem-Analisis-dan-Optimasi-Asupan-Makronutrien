"""
Controller: foods.py
Route handlers untuk /foods.
"""

from fastapi import APIRouter, Query
from typing import List, Optional

from .. import schemas
from ..services import food_service

router = APIRouter(prefix="/foods", tags=["foods"])


@router.get("", response_model=List[schemas.FoodOut], summary="List makanan dengan filter opsional")
def list_foods(
    q: Optional[str] = Query(None, description="Filter nama makanan (case-insensitive)"),
    category: Optional[str] = Query(None, description="Filter berdasarkan kategori"),
    limit: int = Query(200, le=500, description="Jumlah maksimal hasil"),
):
    return food_service.list_foods(q=q, category=category, limit=limit)


@router.get("/categories", response_model=List[str], summary="List kategori makanan unik")
def list_categories():
    return food_service.list_categories()


@router.get("/{food_id}", response_model=schemas.FoodOut, summary="Get makanan by ID")
def get_food(food_id: str):
    return food_service.get_food(food_id)


@router.post("", response_model=schemas.FoodOut, status_code=201, summary="Tambah makanan baru")
def create_food(payload: schemas.FoodCreate):
    return food_service.create_food(payload)
