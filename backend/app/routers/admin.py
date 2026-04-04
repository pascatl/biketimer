import os

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import require_admin
from ..kc_admin import delete_kc_user
from ..database import get_db
from ..models import User, Jersey, SportType
from ..schemas import (
    UserCreate,
    UserUpdate,
    UserResponse,
    JerseyCreate,
    JerseyUpdate,
    JerseyResponse,
    SportTypeCreate,
    SportTypeUpdate,
    SportTypeResponse,
)

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Users CRUD ────────────────────────────────────────────────


@router.get("/users", response_model=List[UserResponse])
def admin_list_users(
    db: Session = Depends(get_db),
    user: dict = Depends(require_admin),
):
    return db.query(User).order_by(User.name.asc()).all()


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def admin_create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_admin),
):
    new_user = User(name=data.name, email=data.email, keycloak_id=data.keycloak_id)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.put("/users/{user_id}", response_model=UserResponse)
def admin_update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_admin),
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    if data.name is not None:
        u.name = data.name
    if data.email is not None:
        u.email = data.email
    if data.keycloak_id is not None:
        u.keycloak_id = data.keycloak_id
    if data.is_active is not None:
        u.is_active = data.is_active
    db.commit()
    db.refresh(u)
    return u


@router.delete("/users/{user_id}")
def admin_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_admin),
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    kc_id = u.keycloak_id
    db.delete(u)
    db.commit()
    # Also remove from Keycloak if linked
    if kc_id:
        try:
            delete_kc_user(kc_id)
        except Exception:
            pass  # log but don't fail if KC deletion has issues
    return {"ok": True}


# ── Jerseys CRUD ──────────────────────────────────────────────


@router.get("/jerseys", response_model=List[JerseyResponse])
def admin_list_jerseys(
    db: Session = Depends(get_db),
    user: dict = Depends(require_admin),
):
    return db.query(Jersey).order_by(Jersey.sort_order.asc()).all()


@router.post(
    "/jerseys", response_model=JerseyResponse, status_code=status.HTTP_201_CREATED
)
def admin_create_jersey(
    data: JerseyCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_admin),
):
    j = Jersey(name=data.name, sort_order=data.sort_order or 0)
    db.add(j)
    db.commit()
    db.refresh(j)
    return j


@router.put("/jerseys/{jersey_id}", response_model=JerseyResponse)
def admin_update_jersey(
    jersey_id: int,
    data: JerseyUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_admin),
):
    j = db.query(Jersey).filter(Jersey.id == jersey_id).first()
    if not j:
        raise HTTPException(status_code=404, detail="Trikot nicht gefunden")
    if data.name is not None:
        j.name = data.name
    if data.is_active is not None:
        j.is_active = data.is_active
    if data.sort_order is not None:
        j.sort_order = data.sort_order
    db.commit()
    db.refresh(j)
    return j


@router.delete("/jerseys/{jersey_id}")
def admin_delete_jersey(
    jersey_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_admin),
):
    j = db.query(Jersey).filter(Jersey.id == jersey_id).first()
    if not j:
        raise HTTPException(status_code=404, detail="Trikot nicht gefunden")
    db.delete(j)
    db.commit()
    return {"ok": True}


# ── Sport Types CRUD ──────────────────────────────────────────


@router.get("/sport-types", response_model=List[SportTypeResponse])
def admin_list_sport_types(
    db: Session = Depends(get_db),
    user: dict = Depends(require_admin),
):
    return db.query(SportType).order_by(SportType.sort_order.asc()).all()


@router.post(
    "/sport-types",
    response_model=SportTypeResponse,
    status_code=status.HTTP_201_CREATED,
)
def admin_create_sport_type(
    data: SportTypeCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_admin),
):
    st = SportType(
        key=data.key,
        label=data.label,
        icon=data.icon or "DirectionsBike",
        color=data.color or "#2D3C59",
        sort_order=data.sort_order or 0,
    )
    db.add(st)
    db.commit()
    db.refresh(st)
    return st


@router.put("/sport-types/{sport_type_id}", response_model=SportTypeResponse)
def admin_update_sport_type(
    sport_type_id: int,
    data: SportTypeUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_admin),
):
    st = db.query(SportType).filter(SportType.id == sport_type_id).first()
    if not st:
        raise HTTPException(status_code=404, detail="Sportart nicht gefunden")
    if data.key is not None:
        st.key = data.key
    if data.label is not None:
        st.label = data.label
    if data.icon is not None:
        st.icon = data.icon
    if data.color is not None:
        st.color = data.color
    if data.is_active is not None:
        st.is_active = data.is_active
    if data.sort_order is not None:
        st.sort_order = data.sort_order
    db.commit()
    db.refresh(st)
    return st


@router.delete("/sport-types/{sport_type_id}")
def admin_delete_sport_type(
    sport_type_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_admin),
):
    st = db.query(SportType).filter(SportType.id == sport_type_id).first()
    if not st:
        raise HTTPException(status_code=404, detail="Sportart nicht gefunden")
    db.delete(st)
    db.commit()
    return {"ok": True}


# ── VAPID Public Key endpoint ────────────────────────────────


@router.get("/vapid-public-key")
def get_vapid_public_key():
    """Return VAPID public key for push notification subscription."""
    return {"publicKey": os.getenv("VAPID_PUBLIC_KEY", "")}
