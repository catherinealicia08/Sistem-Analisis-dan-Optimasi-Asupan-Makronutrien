"""
Service: log_service.py
Operasi Firestore untuk daily food logs.

Struktur Firestore:
  users/{user_id}/logs/{YYYY-MM-DD}/items/{item_id}
    - Setiap hari = 1 dokumen di subcollection 'logs'
    - Setiap makanan yang dicatat = 1 dokumen di subcollection 'items'
"""

from fastapi import HTTPException
from datetime import date as date_cls, timedelta
from typing import List

from ..database import db
from .. import schemas
from .food_service import get_food

USERS_COL = "users"


def _log_ref(user_id: str, day: date_cls):
    """Referensi ke dokumen log harian."""
    return (
        db.collection(USERS_COL)
        .document(user_id)
        .collection("logs")
        .document(str(day))
    )


def _items_col(user_id: str, day: date_cls):
    """Referensi ke subcollection items dalam log harian."""
    return _log_ref(user_id, day).collection("items")


def _build_log_out(user_id: str, day: date_cls) -> schemas.DailyLogOut:
    """Baca log + semua items dari Firestore dan bangun DailyLogOut."""
    log_ref = _log_ref(user_id, day)
    log_doc = log_ref.get()

    # Auto-create log document jika belum ada
    if not log_doc.exists:
        log_ref.set({"user_id": user_id, "date": str(day)})

    # Baca semua items
    item_docs = _items_col(user_id, day).stream()
    items_out = []
    for item_doc in item_docs:
        item_data = item_doc.to_dict()
        food_id = item_data.get("food_id")
        grams = item_data.get("grams", 0.0)
        meal = item_data.get("meal")  # may be None on legacy entries

        # Fetch food detail
        try:
            food = get_food(food_id)
        except HTTPException:
            # Food mungkin sudah dihapus, skip
            continue

        items_out.append(schemas.LogItemOut(
            id=item_doc.id,
            food_id=food_id,
            grams=grams,
            food=food,
            meal=meal,
        ))

    return schemas.DailyLogOut(
        id=str(day),
        user_id=user_id,
        date=day,
        items=items_out,
    )


def _assert_user_exists(user_id: str) -> None:
    doc = db.collection(USERS_COL).document(user_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found")


def get_log(user_id: str, day: date_cls) -> schemas.DailyLogOut:
    _assert_user_exists(user_id)
    return _build_log_out(user_id, day)


def add_item(
    user_id: str,
    day: date_cls,
    payload: schemas.LogItemCreate,
) -> schemas.LogItemOut:
    _assert_user_exists(user_id)

    # Pastikan food ada
    food = get_food(payload.food_id)

    # Auto-create log document
    log_ref = _log_ref(user_id, day)
    if not log_ref.get().exists:
        log_ref.set({"user_id": user_id, "date": str(day)})

    # Tambah item ke subcollection
    item_payload = {
        "food_id": payload.food_id,
        "grams": payload.grams,
    }
    if payload.meal:
        item_payload["meal"] = payload.meal
    _, item_ref = _items_col(user_id, day).add(item_payload)

    return schemas.LogItemOut(
        id=item_ref.id,
        food_id=payload.food_id,
        grams=payload.grams,
        food=food,
        meal=payload.meal,
    )


def delete_item(user_id: str, day: date_cls, item_id: str) -> None:
    _assert_user_exists(user_id)
    item_ref = _items_col(user_id, day).document(item_id)
    if not item_ref.get().exists:
        raise HTTPException(status_code=404, detail="Log item not found")
    item_ref.delete()


def get_weekly_intake(
    user_id: str,
    day: date_cls,
) -> List[schemas.MacroIntake]:
    """
    Kembalikan summary makronutrien untuk 7 hari terakhir (ending at `day`).
    Indeks 0 = 6 hari lalu, indeks 6 = `day`.
    """
    _assert_user_exists(user_id)
    start = day - timedelta(days=6)
    result = []

    for i in range(7):
        d = start + timedelta(days=i)
        item_docs = list(_items_col(user_id, d).stream())

        cal = pro = carb = fat = 0.0
        for item_doc in item_docs:
            item_data = item_doc.to_dict()
            food_id = item_data.get("food_id")
            grams = item_data.get("grams", 0.0)
            try:
                food = get_food(food_id)
                ratio = grams / 100.0
                cal += food.calories * ratio
                pro += food.protein * ratio
                carb += food.carbs * ratio
                fat += food.fat * ratio
            except HTTPException:
                continue

        result.append(schemas.MacroIntake(
            calories=round(cal, 1),
            protein=round(pro, 1),
            carbs=round(carb, 1),
            fat=round(fat, 1),
        ))

    return result
