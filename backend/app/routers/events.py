from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user, get_current_user_optional
from ..database import get_db
from ..email_service import send_invitation_email
from ..models import Event, Invitation
from ..schemas import EventCreate, EventResponse, EventUpdate, InvitationCreate

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=List[EventResponse])
def get_events(db: Session = Depends(get_db)):
    return db.query(Event).order_by(Event.id.asc()).all()


@router.get("/{event_id}/invitations")
def get_event_invitations(event_id: int, db: Session = Depends(get_db)):
    """Return all invitations for an event (no auth required)."""
    invitations = db.query(Invitation).filter(Invitation.event_id == event_id).all()
    return [
        {
            "id": inv.id,
            "invitee_email": inv.invitee_email,
            "inviter_name": inv.inviter_name,
            "status": inv.status,
        }
        for inv in invitations
    ]


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
def invite_user(
    event_id: int,
    invitation_in: InvitationCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event nicht gefunden")

    existing = (
        db.query(Invitation)
        .filter(
            Invitation.event_id == event_id,
            Invitation.invitee_email == str(invitation_in.invitee_email),
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Diese Person wurde bereits eingeladen",
        )

    invitation = Invitation(
        event_id=event_id,
        inviter_keycloak_id=user["sub"],
        inviter_name=user.get("name"),
        invitee_email=str(invitation_in.invitee_email),
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    # Fire-and-forget email (errors are swallowed inside send_invitation_email)
    send_invitation_email(
        invitee_email=str(invitation_in.invitee_email),
        inviter_name=user.get("name") or user.get("preferred_username", "Unbekannt"),
        event_data=event.event_data,
    )

    return {"ok": True, "invitation_id": invitation.id}
