"""
Service: user_service.py
Semua operasi Firestore dan business logic yang berhubungan dengan User.
"""

from datetime import datetime, timezone
from typing import Any, List, Optional

from fastapi import HTTPException

from ..database import db
from .. import schemas, calculations

USERS_COL = "users"


def _doc_to_user_dict(doc) -> dict[str, Any]:
    """Return raw Firestore data merged with the document ID, used internally."""
    data = doc.to_dict() or {}
    data["id"] = doc.id
    return data


def _to_user_out(data: dict[str, Any]) -> schemas.UserOut:
    """Build a public UserOut from raw stored data, stripping secrets."""
    cleaned = {k: v for k, v in data.items() if k != "password_hash"}
    # Provide safe defaults for legacy docs.
    cleaned.setdefault("name", _compose_name(cleaned))
    cleaned.setdefault("age", 0)
    cleaned.setdefault("sex", "male")
    cleaned.setdefault("weight", 0.0)
    cleaned.setdefault("height", 0.0)
    cleaned.setdefault("activity_level", "moderate")
    cleaned.setdefault("goal", "maintenance")
    cleaned.setdefault("profile_complete", _has_profile(cleaned))
    return schemas.UserOut(**cleaned)


def _compose_name(d: dict[str, Any]) -> str:
    fn = (d.get("first_name") or "").strip()
    ln = (d.get("last_name") or "").strip()
    if fn or ln:
        return f"{fn} {ln}".strip()
    return d.get("name") or "User"


def _has_profile(d: dict[str, Any]) -> bool:
    return all(d.get(k) for k in ("age", "sex", "weight", "height"))


def list_users() -> List[schemas.UserOut]:
    docs = db.collection(USERS_COL).stream()
    return [_to_user_out(_doc_to_user_dict(d)) for d in docs]


def get_user(user_id: str) -> schemas.UserOut:
    doc = db.collection(USERS_COL).document(user_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    return _to_user_out(_doc_to_user_dict(doc))


def get_user_raw(user_id: str) -> dict[str, Any]:
    """Internal: return the raw stored dict (includes password_hash)."""
    doc = db.collection(USERS_COL).document(user_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    return _doc_to_user_dict(doc)


def find_by_email(email: str) -> Optional[dict[str, Any]]:
    email = email.lower().strip()
    docs = (
        db.collection(USERS_COL)
        .where("email", "==", email)
        .limit(1)
        .stream()
    )
    for d in docs:
        return _doc_to_user_dict(d)
    return None


def create_user(payload: schemas.UserCreate) -> schemas.UserOut:
    data = payload.model_dump()
    data["created_at"] = datetime.now(tz=timezone.utc)
    data["updated_at"] = data["created_at"]
    data["profile_complete"] = _has_profile(data)
    _, ref = db.collection(USERS_COL).add(data)
    doc = ref.get()
    return _to_user_out(_doc_to_user_dict(doc))


def create_auth_user(
    *,
    email: str,
    password_hash: str,
    first_name: str,
    last_name: str,
) -> schemas.UserOut:
    """Create a user from the /auth/register flow with profile fields empty."""
    now = datetime.now(tz=timezone.utc)
    data: dict[str, Any] = {
        "email": email.lower().strip(),
        "password_hash": password_hash,
        "first_name": first_name.strip(),
        "last_name": last_name.strip(),
        "name": f"{first_name.strip()} {last_name.strip()}".strip() or "User",
        # Placeholder profile fields — populated via profile-setup.
        "age": 0,
        "sex": "male",
        "weight": 0.0,
        "height": 0.0,
        "activity_level": "moderate",
        "goal": "maintenance",
        "profile_complete": False,
        "created_at": now,
        "updated_at": now,
    }
    _, ref = db.collection(USERS_COL).add(data)
    return _to_user_out(_doc_to_user_dict(ref.get()))


def update_user(user_id: str, payload: schemas.UserUpdate) -> schemas.UserOut:
    ref = db.collection(USERS_COL).document(user_id)
    snap = ref.get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="User not found")
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Keep `name` in sync when first/last names change.
    current = snap.to_dict() or {}
    merged = {**current, **updates}
    if "first_name" in updates or "last_name" in updates:
        updates["name"] = _compose_name(merged)

    updates["updated_at"] = datetime.now(tz=timezone.utc)
    updates["profile_complete"] = _has_profile({**merged, **updates})

    ref.update(updates)
    return _to_user_out(_doc_to_user_dict(ref.get()))


def apply_profile_setup(user_id: str, payload: schemas.ProfileSetupIn) -> schemas.UserOut:
    ref = db.collection(USERS_COL).document(user_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="User not found")
    updates = payload.model_dump()
    updates["profile_complete"] = True
    updates["updated_at"] = datetime.now(tz=timezone.utc)
    ref.update(updates)
    return _to_user_out(_doc_to_user_dict(ref.get()))


def delete_user(user_id: str) -> None:
    ref = db.collection(USERS_COL).document(user_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="User not found")
    ref.delete()


def get_user_targets(user_id: str) -> schemas.MetabolicTargets:
    doc = db.collection(USERS_COL).document(user_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    u = doc.to_dict() or {}
    # Guard against unfinished profile (avoids divide-by-zero in calculations).
    if not _has_profile(u):
        return schemas.MetabolicTargets(
            bmr=0, tdee=0, target_calories=0,
            target_protein_g=0, target_carbs_g=0, target_fat_g=0,
        )

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
