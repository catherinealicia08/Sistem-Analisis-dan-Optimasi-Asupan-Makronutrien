"""
Controller: users.py
Route handlers untuk /users — tipis, hanya menerima request dan return response.
Semua logika ada di services/user_service.py
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List

from .. import schemas
from ..auth.deps import get_current_user
from ..services import user_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=List[schemas.UserOut], summary="List semua user")
def list_users():
    return user_service.list_users()


@router.post("", response_model=schemas.UserOut, status_code=201, summary="Buat user baru")
def create_user(payload: schemas.UserCreate):
    return user_service.create_user(payload)


@router.get("/me", response_model=schemas.UserOut, summary="Get the authenticated user")
def me(current: schemas.UserOut = Depends(get_current_user)):
    return current


@router.put("/me/profile", response_model=schemas.UserOut, summary="Profile-setup (current user)")
def setup_my_profile(
    payload: schemas.ProfileSetupIn,
    current: schemas.UserOut = Depends(get_current_user),
):
    return user_service.apply_profile_setup(current.id, payload)


@router.get("/{user_id}", response_model=schemas.UserOut, summary="Get user by ID")
def get_user(user_id: str):
    return user_service.get_user(user_id)


@router.put("/{user_id}", response_model=schemas.UserOut, summary="Update user")
def update_user(
    user_id: str,
    payload: schemas.UserUpdate,
    current: schemas.UserOut = Depends(get_current_user),
):
    if current.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return user_service.update_user(user_id, payload)


@router.put("/{user_id}/profile", response_model=schemas.UserOut, summary="Profile-setup")
def setup_profile(
    user_id: str,
    payload: schemas.ProfileSetupIn,
    current: schemas.UserOut = Depends(get_current_user),
):
    if current.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return user_service.apply_profile_setup(user_id, payload)


@router.delete("/{user_id}", status_code=204, summary="Hapus user")
def delete_user(user_id: str, current: schemas.UserOut = Depends(get_current_user)):
    if current.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    user_service.delete_user(user_id)


@router.get("/{user_id}/targets", response_model=schemas.MetabolicTargets, summary="Hitung target metabolik user")
def get_user_targets(user_id: str):
    return user_service.get_user_targets(user_id)
