"""
FastAPI dependency for resolving the current authenticated user from the JWT
Authorization: Bearer <token> header.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from .. import schemas
from ..services import user_service
from .security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)


def get_current_user(token: str | None = Depends(oauth2_scheme)) -> schemas.UserOut:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_token(token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    try:
        return user_service.get_user(user_id)
    except HTTPException as e:
        if e.status_code == 404:
            raise HTTPException(status_code=401, detail="User no longer exists") from e
        raise
