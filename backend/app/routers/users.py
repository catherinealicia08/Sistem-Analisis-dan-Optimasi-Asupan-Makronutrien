"""
Router: /users
CRUD operations untuk user profile menggunakan Firestore.
"""

from fastapi import APIRouter, HTTPException
from typing import List

from .. import schemas, calculations
from ..database import db

router = APIRouter(prefix="/users", tags=["users"])

USERS_COL = "users"


def _doc_to_user(doc) -> schemas.UserOut:
    data = doc.to_dict()
    data["id"] = doc.id
    return schemas.UserOut(**data)


@router.get("", response_model=List[schemas.UserOut])
def list_users():
    docs = db.collection(USERS_COL).stream()
    return [_doc_to_user(d) for d in docs]


@router.post("", response_model=schemas.UserOut, status_code=201)
def create_user(payload: schemas.UserCreate):
    data = payload.model_dump()
    _, ref = db.collection(USERS_COL).add(data)
    doc = ref.get()
    return _doc_to_user(doc)


@router.get("/{user_id}", response_model=schemas.UserOut)
def get_user(user_id: str):
    doc = db.collection(USERS_COL).document(user_id).get()
    if not doc.exists:
        raise HTTPException(404, "User not found")
    return _doc_to_user(doc)


@router.put("/{user_id}", response_model=schemas.UserOut)
def update_user(user_id: str, payload: schemas.UserUpdate):
    ref = db.collection(USERS_COL).document(user_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(404, "User not found")
    updates = payload.model_dump(exclude_unset=True)
    ref.update(updates)
    return _doc_to_user(ref.get())


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: str):
    ref = db.collection(USERS_COL).document(user_id)
    if not ref.get().exists:
        raise HTTPException(404, "User not found")
    ref.delete()


@router.get("/{user_id}/targets", response_model=schemas.MetabolicTargets)
def get_targets(user_id: str):
    doc = db.collection(USERS_COL).document(user_id).get()
    if not doc.exists:
        raise HTTPException(404, "User not found")

    u = doc.to_dict()
    bmr = calculations.mifflin_st_jeor(u["weight"], u["height"], u["age"], u["sex"])
    tdee = calculations.tdee(bmr, u["activity_level"])
    target_kcal = calculations.goal_calories(tdee, u["goal"])
    macros = calculations.macro_targets(target_kcal)

    return schemas.MetabolicTargets(
        bmr=round(bmr, 1),
        tdee=round(tdee, 1),
        target_calories=round(target_kcal, 1),
        target_protein_g=round(macros["protein"], 1),
        target_carbs_g=round(macros["carbs"], 1),
        target_fat_g=round(macros["fat"], 1),
    )
