from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import PushSubscription, User
from ..schemas import PushSubscriptionCreate, PushPrefsUpdate, EmailPrefsUpdate, DEFAULT_NOTIF_PREFS, DEFAULT_EMAIL_PREFS

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
    stored = (sub.notification_prefs or {}) if sub else {}
    # Merge with defaults so all keys are always present
    return {"prefs": {**DEFAULT_NOTIF_PREFS, **stored}}


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


@router.get("/email-prefs")
def get_email_prefs(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Get email notification preferences for the current user."""
    db_user = db.query(User).filter(User.keycloak_id == user["sub"]).first()
    stored = (db_user.email_prefs or {}) if db_user else {}
    # Merge with defaults so all keys are always present
    return {"prefs": {**DEFAULT_EMAIL_PREFS, **stored}}


@router.patch("/email-prefs")
def update_email_prefs(
    data: EmailPrefsUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Update email notification preferences for the current user."""
    db_user = db.query(User).filter(User.keycloak_id == user["sub"]).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    db_user.email_prefs = data.prefs
    db.commit()
    return {"ok": True}
