"""
Service: food_service.py
Semua operasi Firestore yang berhubungan dengan Food/makanan.
Query dilakukan di memory karena Firestore gratis tier tidak mendukung
case-insensitive text search secara native.
"""

from fastapi import HTTPException
from typing import List, Optional

from ..database import db
from .. import schemas

FOODS_COL = "foods"


def _doc_to_food(doc) -> schemas.FoodOut:
    data = doc.to_dict()
    data["id"] = doc.id
    return schemas.FoodOut(**data)


def list_foods(
    q: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 200,
) -> List[schemas.FoodOut]:
    """
    Ambil semua makanan dari Firestore, lalu filter di memory.
    Filter:
      - q        : substring case-insensitive pada field 'name'
      - category : exact match pada field 'category'
    """
    col = db.collection(FOODS_COL)

    # Kalau ada filter category yang exact, manfaatkan Firestore query
    if category and not q:
        docs = col.where("category", "==", category).stream()
    else:
        docs = col.stream()

    results = []
    for doc in docs:
        food = _doc_to_food(doc)
        if q and q.lower() not in food.name.lower():
            continue
        if category and food.category != category:
            continue
        results.append(food)
        if len(results) >= limit:
            break

    return sorted(results, key=lambda f: f.name)


def list_categories() -> List[str]:
    """Ambil semua kategori unik dari Firestore."""
    docs = db.collection(FOODS_COL).stream()
    categories = set()
    for doc in docs:
        data = doc.to_dict()
        if "category" in data:
            categories.add(data["category"])
    return sorted(categories)


def get_food(food_id: str) -> schemas.FoodOut:
    doc = db.collection(FOODS_COL).document(food_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Food not found")
    return _doc_to_food(doc)


def create_food(payload: schemas.FoodCreate) -> schemas.FoodOut:
    data = payload.model_dump()
    _, ref = db.collection(FOODS_COL).add(data)
    doc = ref.get()
    return _doc_to_food(doc)


def get_all_foods_as_dicts() -> List[dict]:
    """Digunakan oleh analysis_service untuk ILP optimizer."""
    docs = db.collection(FOODS_COL).stream()
    foods = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        foods.append(data)
    return foods
