from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import PushSubscription
from ..schemas import PushSubscriptionCreate

router = APIRouter(prefix="/push", tags=["push"])


@router.post("/subscribe")
def subscribe(
    data: PushSubscriptionCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Register a push subscription for the current user."""
    existing = (
        db.query(PushSubscription)
        .filter(PushSubscription.endpoint == data.endpoint)
        .first()
    )
    if existing:
        # Update keys if changed
        existing.keycloak_id = user["sub"]
        existing.p256dh = data.keys.get("p256dh", "")
        existing.auth = data.keys.get("auth", "")
        db.commit()
        return {"ok": True, "updated": True}

    sub = PushSubscription(
        keycloak_id=user["sub"],
        endpoint=data.endpoint,
        p256dh=data.keys.get("p256dh", ""),
        auth=data.keys.get("auth", ""),
    )
    db.add(sub)
    db.commit()
    return {"ok": True, "created": True}


@router.delete("/unsubscribe")
def unsubscribe(
    data: PushSubscriptionCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Remove a push subscription."""
    existing = (
        db.query(PushSubscription)
        .filter(PushSubscription.endpoint == data.endpoint)
        .first()
    )
    if existing:
        db.delete(existing)
        db.commit()
    return {"ok": True}
