import os
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Jersey, SportType

router = APIRouter(tags=["data"])


@router.get("/jerseys", response_model=list)
def get_jerseys(db: Session = Depends(get_db)):
    """Return all active jerseys."""
    rows = (
        db.query(Jersey)
        .filter(Jersey.is_active == True)
        .order_by(Jersey.sort_order.asc())
        .all()
    )
    return [{"id": r.id, "name": r.name} for r in rows]


@router.get("/sport-types", response_model=list)
def get_sport_types(db: Session = Depends(get_db)):
    """Return all active sport types."""
    rows = (
        db.query(SportType)
        .filter(SportType.is_active == True)
        .order_by(SportType.sort_order.asc())
        .all()
    )
    return [
        {"id": r.id, "key": r.key, "label": r.label, "icon": r.icon, "color": r.color}
        for r in rows
    ]


@router.get("/vapid-public-key")
def get_vapid_public_key():
    """Return VAPID public key for push notification subscription."""
    return {"publicKey": os.getenv("VAPID_PUBLIC_KEY", "")}
