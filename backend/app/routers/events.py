from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user, get_current_user_optional
from ..database import get_db
from ..models import Event, Invitation, User, PushSubscription
from ..schemas import EventCreate, EventResponse, EventUpdate, InvitationCreate
from ..push_service import send_push_notification

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=List[EventResponse])
def get_events(db: Session = Depends(get_db)):
    return db.query(Event).order_by(Event.id.asc()).all()


@router.get("/{event_id}/invitations")
def get_event_invitations(event_id: int, db: Session = Depends(get_db)):
    """Return all invitations for an event (no auth required)."""
    invitations = db.query(Invitation).filter(Invitation.event_id == event_id).all()
    result = []
    for inv in invitations:
        # Try to resolve display name from users table
        display_name = inv.invitee_email
        if inv.invitee_keycloak_id:
            u = (
                db.query(User)
                .filter(User.keycloak_id == inv.invitee_keycloak_id)
                .first()
            )
            if u:
                display_name = u.name
        elif inv.invitee_email:
            u = db.query(User).filter(User.email == inv.invitee_email).first()
            if u:
                display_name = u.name
        result.append(
            {
                "id": inv.id,
                "invitee_email": inv.invitee_email,
                "invitee_name": display_name,
                "inviter_name": inv.inviter_name,
                "status": inv.status,
            }
        )
    return result


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    event_in: EventCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    new_event = Event(
        event_data=event_in.event_data.model_dump(),
        creator_keycloak_id=user["sub"],
        creator_email=user.get("email"),
        creator_name=user.get("name"),
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event


@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: int,
    event_in: EventUpdate,
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(get_current_user_optional),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event nicht gefunden")
    event.event_data = event_in.event_data.model_dump()
    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(get_current_user_optional),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event nicht gefunden")
    db.delete(event)
    db.commit()
    return {"ok": True}


@router.post("/{event_id}/invite", status_code=status.HTTP_201_CREATED)
def invite_users(
    event_id: int,
    invitation_in: InvitationCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event nicht gefunden")

    results = []
    event_date = event.event_data.get("event_date", "")
    inviter_name = user.get("name") or user.get("preferred_username", "Unbekannt")

    for uid in invitation_in.invitee_user_ids:
        invitee = db.query(User).filter(User.id == uid).first()
        if not invitee:
            results.append(
                {"user_id": uid, "ok": False, "detail": "Benutzer nicht gefunden"}
            )
            continue

        invitee_email = (
            invitee.email or f"{invitee.name.lower().replace(' ', '.')}@local"
        )

        existing = (
            db.query(Invitation)
            .filter(
                Invitation.event_id == event_id,
                Invitation.invitee_email == invitee_email,
            )
            .first()
        )
        if existing:
            results.append(
                {"user_id": uid, "ok": False, "detail": "Bereits eingeladen"}
            )
            continue

        invitation = Invitation(
            event_id=event_id,
            inviter_keycloak_id=user["sub"],
            inviter_name=user.get("name"),
            invitee_email=invitee_email,
            invitee_keycloak_id=invitee.keycloak_id,
        )
        db.add(invitation)
        db.commit()
        db.refresh(invitation)
        results.append({"user_id": uid, "ok": True, "invitation_id": invitation.id})

        # Send push notification to invitee if they have a subscription
        if invitee.keycloak_id:
            subscriptions = (
                db.query(PushSubscription)
                .filter(PushSubscription.keycloak_id == invitee.keycloak_id)
                .all()
            )
            for sub in subscriptions:
                try:
                    send_push_notification(
                        sub.endpoint,
                        sub.p256dh,
                        sub.auth,
                        title="Neue Einladung",
                        body=f"{inviter_name} hat dich zu einem Event am {event_date} eingeladen!",
                    )
                except Exception:
                    pass

    sent = sum(1 for r in results if r["ok"])
    return {
        "ok": True,
        "sent": sent,
        "total": len(invitation_in.invitee_user_ids),
        "results": results,
    }
