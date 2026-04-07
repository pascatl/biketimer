from typing import List, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..auth import get_current_user, get_current_user_optional
from ..database import get_db
from ..models import Event, Invitation, User, PushSubscription, EventComment
from ..schemas import EventCreate, EventResponse, EventUpdate, InvitationCreate, EventCommentCreate, EventCommentResponse, DEFAULT_EMAIL_PREFS
from ..push_service import send_push_notification
from ..email_service import send_invitation_email, send_event_update_email, send_event_cancel_email
from ..ws_manager import manager as ws_manager

router = APIRouter(prefix="/events", tags=["events"])


def _push_with_pref(db, keycloak_id: str, pref_key: str, title: str, body: str):
    """Send a push notification only if the user's pref for pref_key is enabled."""
    subs = db.query(PushSubscription).filter(PushSubscription.keycloak_id == keycloak_id).all()
    for sub in subs:
        prefs = sub.notification_prefs or {}
        if prefs.get(pref_key, True):  # default True = on
            try:
                send_push_notification(sub.endpoint, sub.p256dh, sub.auth, title=title, body=body)
            except Exception:
                pass


def _push_admins(db, pref_key: str, title: str, body: str):
    """Send push to all admin users who have pref_key enabled."""
    admin_users = db.query(User).filter(User.is_active == True).all()
    for au in admin_users:
        if au.keycloak_id:
            _push_with_pref(db, au.keycloak_id, pref_key, title, body)


@router.get("", response_model=List[EventResponse])
def get_events(db: Session = Depends(get_db)):
    return db.query(Event).order_by(Event.id.asc()).all()


@router.get("/mine", response_model=List[EventResponse])
def get_my_events(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Return events where the user is the creator or has any invitation.
    Admin users see all events."""
    # Admins see all events
    if user.get("is_admin"):
        return db.query(Event).order_by(Event.id.asc()).all()

    sub = user["sub"]
    email = user.get("email")

    # Subquery: event_ids via invitations
    inv_conditions = [Invitation.invitee_keycloak_id == sub]
    if email:
        inv_conditions.append(Invitation.invitee_email == email)

    invited_event_ids = [
        row[0]
        for row in db.query(Invitation.event_id)
        .filter(or_(*inv_conditions))
        .distinct()
        .all()
    ]

    return (
        db.query(Event)
        .filter(
            or_(
                Event.creator_keycloak_id == sub,
                Event.id.in_(invited_event_ids),
            )
        )
        .order_by(Event.id.asc())
        .all()
    )


@router.get("/{event_id}", response_model=EventResponse)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event nicht gefunden")

    # Admin always has access
    if user.get("is_admin"):
        return event

    sub = user["sub"]
    email = user.get("email")

    # Creator always has access
    if event.creator_keycloak_id == sub:
        return event

    # Check if user has an invitation
    inv_conditions = [Invitation.invitee_keycloak_id == sub]
    if email:
        inv_conditions.append(Invitation.invitee_email == email)

    has_invitation = (
        db.query(Invitation)
        .filter(
            Invitation.event_id == event_id,
            or_(*inv_conditions),
        )
        .first()
    )
    if not has_invitation:
        raise HTTPException(status_code=403, detail="Kein Zugriff auf dieses Event")

    return event


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
            elif inv.invitee_email.endswith("@local"):
                # Synthetic email: strip suffix and look up by name
                candidate_name = inv.invitee_email[: -len("@local")]
                u = db.query(User).filter(User.name == candidate_name).first()
                if u:
                    display_name = u.name
                else:
                    # Fall back to the name part only (better than showing @local)
                    display_name = candidate_name
        result.append(
            {
                "id": inv.id,
                "invitee_email": inv.invitee_email,
                "invitee_keycloak_id": inv.invitee_keycloak_id,
                "inviter_keycloak_id": inv.inviter_keycloak_id,
                "invitee_name": display_name,
                "inviter_name": inv.inviter_name,
                "status": inv.status,
                "decline_reason": inv.decline_reason,
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
    db.flush()  # obtain new_event.id without committing

    # Auto-add creator as accepted participant
    creator_email = user.get("email") or (
        f"{(user.get('name') or user.get('preferred_username', '')).lower().replace(' ', '.')}@local"
    )
    self_invitation = Invitation(
        event_id=new_event.id,
        inviter_keycloak_id=user["sub"],
        inviter_name=user.get("name"),
        invitee_email=creator_email,
        invitee_keycloak_id=user["sub"],
        status="accepted",
        responded_at=datetime.now(timezone.utc),
    )
    db.add(self_invitation)
    db.commit()
    db.refresh(new_event)

    # Notify admins about new event
    event_date_raw = event_in.event_data.event_date
    try:
        from datetime import datetime as _dt
        event_date_fmt = _dt.strptime(event_date_raw, "%Y-%m-%d").strftime("%d.%m.%y")
    except Exception:
        event_date_fmt = event_date_raw
    creator = user.get("name") or user.get("preferred_username", "Jemand")
    _push_admins(db, "admin_event_created", "Neues Event", f"{creator} hat ein Event am {event_date_fmt} angelegt.")

    ws_manager.dispatch_sync(
        {"type": "event_created", "event_id": new_event.id},
        recipient_subs=[],  # data refresh only; push handles admin notification
    )

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

    # Notify accepted invitees
    event_date_raw = event.event_data.get("event_date", "")
    try:
        from datetime import datetime as _dt
        event_date_fmt = _dt.strptime(event_date_raw, "%Y-%m-%d").strftime("%d.%m.%y")
    except Exception:
        event_date_fmt = event_date_raw
    accepted = db.query(Invitation).filter(
        Invitation.event_id == event_id,
        Invitation.status == "accepted",
    ).all()
    editor = (user.get("name") or user.get("preferred_username", "")) if user else ""
    for inv in accepted:
        kid = inv.invitee_keycloak_id
        if kid and kid != (user.get("sub") if user else None):
            _push_with_pref(db, kid, "event_updated", "Event geändert",
                            f"Das Event am {event_date_fmt} wurde aktualisiert.")
            # Send email if invitee has email and email pref enabled
            invitee_email = inv.invitee_email
            if invitee_email and not invitee_email.endswith("@local"):
                db_user = db.query(User).filter(User.keycloak_id == kid).first()
                email_prefs = (db_user.email_prefs or {}) if db_user else {}
                if email_prefs.get("event_updated", DEFAULT_EMAIL_PREFS["event_updated"]):
                    try:
                        send_event_update_email(invitee_email, event.event_data, event_id)
                    except Exception:
                        pass
    # Notify admins
    _push_admins(db, "admin_event_updated", "Event aktualisiert",
                 f"Event am {event_date_fmt} wurde geändert (von {editor}).")

    ws_manager.dispatch_sync(
        {
            "type": "event_updated",
            "event_id": event_id,
            "message": f"Das Event am {event_date_fmt} wurde aktualisiert.",
        },
        recipient_subs=[inv.invitee_keycloak_id for inv in accepted if inv.invitee_keycloak_id],
        exclude_sub=user.get("sub") if user else None,
    )

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

    # Notify accepted invitees before deletion
    event_date_raw = event.event_data.get("event_date", "")
    try:
        from datetime import datetime as _dt
        event_date_fmt = _dt.strptime(event_date_raw, "%Y-%m-%d").strftime("%d.%m.%y")
    except Exception:
        event_date_fmt = event_date_raw
    accepted = db.query(Invitation).filter(
        Invitation.event_id == event_id,
        Invitation.status == "accepted",
    ).all()
    deleter = (user.get("name") or user.get("preferred_username", "")) if user else ""
    for inv in accepted:
        kid = inv.invitee_keycloak_id
        if kid and kid != (user.get("sub") if user else None):
            _push_with_pref(db, kid, "event_cancelled", "Event abgesagt",
                            f"Das Event am {event_date_fmt} wurde gelöscht.")
            # Send email if invitee has email and email pref enabled
            invitee_email = inv.invitee_email
            if invitee_email and not invitee_email.endswith("@local"):
                db_user = db.query(User).filter(User.keycloak_id == kid).first()
                email_prefs = (db_user.email_prefs or {}) if db_user else {}
                if email_prefs.get("event_cancelled", DEFAULT_EMAIL_PREFS["event_cancelled"]):
                    try:
                        send_event_cancel_email(invitee_email, event.event_data)
                    except Exception:
                        pass
    # Notify admins
    _push_admins(db, "admin_event_deleted", "Event gelöscht",
                 f"Event am {event_date_fmt} wurde gelöscht (von {deleter}).")

    db.delete(event)
    db.commit()

    ws_manager.dispatch_sync(
        {
            "type": "event_deleted",
            "event_id": event_id,
            "message": f"Das Event am {event_date_fmt} wurde gelöscht.",
        },
        recipient_subs=[inv.invitee_keycloak_id for inv in accepted if inv.invitee_keycloak_id],
        exclude_sub=user.get("sub") if user else None,
    )

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

    # Only the creator or the current organizer may invite
    sub = user["sub"]
    current_leader = event.event_data.get("event_leader", "")
    user_name = user.get("name") or user.get("preferred_username", "")
    is_creator = event.creator_keycloak_id == sub
    is_leader = bool(current_leader) and (
        user_name == current_leader
    )
    if not is_creator and not is_leader and not user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nur der Ersteller oder Organisator darf Personen einladen",
        )

    results = []
    event_date_raw = event.event_data.get("event_date", "")
    event_date_fmt = event_date_raw
    try:
        from datetime import datetime as _dt
        event_date_fmt = _dt.strptime(event_date_raw, "%Y-%m-%d").strftime("%d.%m.%y")
    except ValueError:
        pass
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

        # Send email notification if invitee has a real email and email pref enabled
        if invitee.email and not invitee.email.endswith("@local"):
            email_prefs = invitee.email_prefs or {}
            if email_prefs.get("invite_received", DEFAULT_EMAIL_PREFS["invite_received"]):
                try:
                    send_invitation_email(
                        invitee_email=invitee.email,
                        inviter_name=inviter_name,
                        event_data=event.event_data,
                        invitation_token=str(invitation.token),
                        event_id=event_id,
                    )
                except Exception:
                    pass

        # Send push notification to invitee if they have a subscription
        if invitee.keycloak_id:
            _push_with_pref(
                db,
                invitee.keycloak_id,
                "invite_received",
                title="Neue Einladung",
                body=f"{inviter_name} hat dich zu einem Event am {event_date_fmt} eingeladen!",
            )

    sent = sum(1 for r in results if r["ok"])
    if sent > 0:
        # All current invitees of the event (accepted + newly added pending)
        all_event_invs = db.query(Invitation).filter(Invitation.event_id == event_id).all()
        recipient_subs = list({i.invitee_keycloak_id for i in all_event_invs if i.invitee_keycloak_id})
        ws_manager.dispatch_sync(
            {
                "type": "invitation_created",
                "event_id": event_id,
                "message": f"{inviter_name} hat {sent} Person(en) zum Event am {event_date_fmt} eingeladen.",
            },
            recipient_subs=recipient_subs,
            exclude_sub=user.get("sub"),
        )
    return {
        "ok": True,
        "sent": sent,
        "total": len(invitation_in.invitee_user_ids),
        "results": results,
    }


# ── Comments ──────────────────────────────────────────────────


@router.get("/{event_id}/comments", response_model=List[EventCommentResponse])
def get_event_comments(event_id: int, db: Session = Depends(get_db)):
    """Return all comments for an event (no auth required)."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event nicht gefunden")
    return (
        db.query(EventComment)
        .filter(EventComment.event_id == event_id)
        .order_by(EventComment.created_at.asc())
        .all()
    )


@router.post(
    "/{event_id}/comments",
    response_model=EventCommentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_event_comment(
    event_id: int,
    comment_in: EventCommentCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Create a comment for an event (requires authentication)."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event nicht gefunden")

    if not comment_in.content.strip():
        raise HTTPException(status_code=422, detail="Kommentar darf nicht leer sein")

    comment = EventComment(
        event_id=event_id,
        author_keycloak_id=user["sub"],
        author_name=user.get("name") or user.get("preferred_username"),
        content=comment_in.content.strip(),
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/{event_id}/comments/{comment_id}")
def delete_event_comment(
    event_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Delete a comment. Only the author or an admin may delete."""
    comment = (
        db.query(EventComment)
        .filter(EventComment.id == comment_id, EventComment.event_id == event_id)
        .first()
    )
    if not comment:
        raise HTTPException(status_code=404, detail="Kommentar nicht gefunden")

    if comment.author_keycloak_id != user["sub"] and not user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nur der Autor oder ein Admin darf diesen Kommentar löschen",
        )

    db.delete(comment)
    db.commit()
    return {"ok": True}
