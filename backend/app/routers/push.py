from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import PushSubscription
from ..schemas import PushSubscriptionCreate, PushPrefsUpdate, DEFAULT_NOTIF_PREFS

router = APIRouter(prefix="/push", tags=["push"])


@router.post("/subscribe")
def subscribe(
    data: PushSubscriptionCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Register a push subscription for the current user."""
    prefs = data.prefs or DEFAULT_NOTIF_PREFS
    existing = (
        db.query(PushSubscription)
        .filter(PushSubscription.endpoint == data.endpoint)
        .first()
    )
    if existing:
        existing.keycloak_id = user["sub"]
        existing.p256dh = data.keys.get("p256dh", "")
        existing.auth = data.keys.get("auth", "")
        if data.prefs is not None:
            existing.notification_prefs = prefs
        db.commit()
        return {"ok": True, "updated": True}

    sub = PushSubscription(
        keycloak_id=user["sub"],
        endpoint=data.endpoint,
        p256dh=data.keys.get("p256dh", ""),
        auth=data.keys.get("auth", ""),
        notification_prefs=prefs,
    )
    db.add(sub)
    db.commit()
    return {"ok": True, "created": True}


@router.patch("/prefs")
def update_prefs(
    data: PushPrefsUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Update notification preferences for all subscriptions of the current user."""
    subs = (
        db.query(PushSubscription)
        .filter(PushSubscription.keycloak_id == user["sub"])
        .all()
    )
    for sub in subs:
        sub.notification_prefs = data.prefs
    db.commit()
    return {"ok": True, "updated": len(subs)}


@router.get("/prefs")
def get_prefs(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Get notification preferences for the current user."""
    sub = (
        db.query(PushSubscription)
        .filter(PushSubscription.keycloak_id == user["sub"])
        .first()
    )
    if not sub or sub.notification_prefs is None:
        return {"prefs": DEFAULT_NOTIF_PREFS}
    return {"prefs": sub.notification_prefs}


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
