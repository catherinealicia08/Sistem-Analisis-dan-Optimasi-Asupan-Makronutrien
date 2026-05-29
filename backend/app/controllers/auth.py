"""
Controller: auth.py — register, login, current user.
"""

from fastapi import APIRouter, Depends, HTTPException

from .. import schemas
from ..auth.security import create_access_token, hash_password, verify_password
from ..auth.deps import get_current_user
from ..services import user_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.TokenPair, status_code=201, summary="Register a new account")
def register(payload: schemas.RegisterIn):
    if user_service.find_by_email(payload.email):
        raise HTTPException(status_code=409, detail="Email already registered")
    user = user_service.create_auth_user(
        email=str(payload.email),
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
    )
    token = create_access_token(subject=user.id)
    return schemas.TokenPair(access_token=token, user=user)


@router.post("/login", response_model=schemas.TokenPair, summary="Email + password login")
def login(payload: schemas.LoginIn):
    rec = user_service.find_by_email(str(payload.email))
    if not rec or not verify_password(payload.password, rec.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user = user_service.get_user(rec["id"])
    token = create_access_token(subject=user.id)
    return schemas.TokenPair(access_token=token, user=user)


@router.get("/me", response_model=schemas.UserOut, summary="Get the authenticated user")
def me(current: schemas.UserOut = Depends(get_current_user)):
    return current
