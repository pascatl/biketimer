import os
import uuid as uuid_module
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy import or_
from sqlalchemy.orm import joinedload, Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Event, Invitation, User, PushSubscription
from ..ws_manager import manager as ws_manager
from ..logger import get_logger
from ..push_service import send_push_notification
from ..email_service import send_rsvp_notification_email
from ..schemas import DEFAULT_NOTIF_PREFS, DEFAULT_EMAIL_PREFS

_log = get_logger("invitations")

router = APIRouter(prefix="/invitations", tags=["invitations"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


EVENT_DATE_FORMAT = "%Y-%m-%d"


def _fmt_event_date(event: "Event | None") -> str:
    """Return a human-readable date string for the event, e.g. '12.04.25'."""
    if not event:
        return ""
    raw = event.event_data.get("event_date", "")
    try:
        return datetime.strptime(raw, EVENT_DATE_FORMAT).strftime("%d.%m.%y")
    except ValueError:
        return raw


def _push_with_pref(db, keycloak_id: str, pref_key: str, title: str, body: str):
    """Send a push notification only if the user's pref for pref_key is enabled."""
    subs = (
        db.query(PushSubscription)
        .filter(PushSubscription.keycloak_id == keycloak_id)
        .all()
    )
    for sub in subs:
        prefs = sub.notification_prefs or {}
        if prefs.get(pref_key, DEFAULT_NOTIF_PREFS.get(pref_key, False)):
            try:
                send_push_notification(
                    sub.endpoint, sub.p256dh, sub.auth, title=title, body=body
                )
            except Exception:
                pass


def _email_with_pref(
    db,
    keycloak_id: str,
    pref_key: str,
    actor_name: str,
    event_data: dict,
    action: str,
    event_id: int,
):
    """Send an RSVP notification email only if the user's email pref for pref_key is enabled."""
    db_user = db.query(User).filter(User.keycloak_id == keycloak_id).first()
    if not db_user or not db_user.email:
        return
    if db_user.email.endswith("@local"):
        return
    email_prefs = (db_user.email_prefs or {}) if db_user else {}
    if email_prefs.get(pref_key, DEFAULT_EMAIL_PREFS.get(pref_key, False)):
        try:
            send_rsvp_notification_email(
                db_user.email, actor_name, event_data, action, event_id
            )
        except Exception:
            pass


def _notify_rsvp_organizers(
    db, event, actor_sub: str, actor_name: str, pref_key: str, action: str
):
    """Notify the event creator, event leader, and all admins about an RSVP action."""
    if not event:
        return

    event_date_fmt = _fmt_event_date(event)
    push_title = "Event-Zusage" if action == "accepted" else "Event-Absage"
    push_body = (
        f"{actor_name} hat zum Event am {event_date_fmt} zugesagt."
        if action == "accepted"
        else f"{actor_name} hat zum Event am {event_date_fmt} abgesagt."
    )

    notified = set()

    # Notify event creator
    creator_id = event.creator_keycloak_id
    if creator_id and creator_id != actor_sub:
        _push_with_pref(db, creator_id, pref_key, push_title, push_body)
        _email_with_pref(
            db, creator_id, pref_key, actor_name, event.event_data, action, event.id
        )
        notified.add(creator_id)

    # Notify event leader (organizer) if different from creator
    leader_name = event.event_data.get("event_leader", "")
    if leader_name:
        leader_user = db.query(User).filter(User.name == leader_name).first()
        if (
            leader_user
            and leader_user.keycloak_id
            and leader_user.keycloak_id != actor_sub
            and leader_user.keycloak_id not in notified
        ):
            _push_with_pref(
                db, leader_user.keycloak_id, pref_key, push_title, push_body
            )
            _email_with_pref(
                db,
                leader_user.keycloak_id,
                pref_key,
                actor_name,
                event.event_data,
                action,
                event.id,
            )
            notified.add(leader_user.keycloak_id)

    # Notify all admins (for every event, regardless of involvement)
    admin_users = (
        db.query(User).filter(User.is_active.is_(True), User.is_admin.is_(True)).all()
    )
    for au in admin_users:
        if (
            au.keycloak_id
            and au.keycloak_id != actor_sub
            and au.keycloak_id not in notified
        ):
            _push_with_pref(db, au.keycloak_id, pref_key, push_title, push_body)
            _email_with_pref(
                db,
                au.keycloak_id,
                pref_key,
                actor_name,
                event.event_data,
                action,
                event.id,
            )
            notified.add(au.keycloak_id)


@router.get(
    "/mine", response_model=List[dict], summary="Eigene ausstehende Einladungen abrufen"
)
def get_my_invitations(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    sub = user["sub"]
    email = user.get("email")

    # Match by keycloak_id (most reliable) OR by stored e-mail
    conditions = [Invitation.invitee_keycloak_id == sub]
    if email:
        conditions.append(Invitation.invitee_email == email)

    rows = (
        db.query(Invitation)
        .filter(or_(*conditions), Invitation.status == "pending")
        .options(joinedload(Invitation.event))
        .all()
    )

    today = datetime.now(timezone.utc).date()

    result = []
    for inv in rows:
        event = inv.event

        # Skip invitations for past events
        if event:
            raw_date = event.event_data.get("event_date", "")
            try:
                event_date = datetime.strptime(raw_date, EVENT_DATE_FORMAT).date()
                if event_date < today:
                    continue
            except ValueError:
                pass

        result.append(
            {
                "id": inv.id,
                "event_id": inv.event_id,
                "inviter_name": inv.inviter_name,
                "invitee_email": inv.invitee_email,
                "status": inv.status,
                "event_data": event.event_data if event else {},
                "created_at": inv.created_at.isoformat() if inv.created_at else None,
            }
        )
    return result


@router.get("/respond")
def respond_via_token(
    token: str = Query(...),
    action: str = Query(...),
    db: Session = Depends(get_db),
):
    """Handle invitation accept/decline via email token link – no auth required."""
    if action not in ("accept", "decline"):
        raise HTTPException(status_code=400, detail="Ungültige Aktion")

    try:
        token_uuid = uuid_module.UUID(token)
    except ValueError:
        raise HTTPException(status_code=400, detail="Ungültiger Token")

    inv = db.query(Invitation).filter(Invitation.token == token_uuid).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Einladung nicht gefunden")

    inv.status = "accepted" if action == "accept" else "declined"
    inv.responded_at = datetime.now(timezone.utc)
    db.commit()

    return RedirectResponse(
        url=f"{FRONTEND_URL}/events/{inv.event_id}",
        status_code=302,
    )


@router.post("/{invitation_id}/accept", summary="Einladung annehmen")
def accept_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    inv = db.query(Invitation).filter(Invitation.id == invitation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Einladung nicht gefunden")
    if (
        inv.invitee_email != user.get("email")
        and inv.invitee_keycloak_id != user["sub"]
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Nicht berechtigt"
        )

    inv.status = "accepted"
    inv.invitee_keycloak_id = user["sub"]
    inv.decline_reason = None
    inv.responded_at = datetime.now(timezone.utc)
    db.commit()

    _log.info(
        f"Invitation accepted: id={invitation_id} event_id={inv.event_id} by {user.get('name') or user.get('preferred_username', '?')!r} sub={user['sub']}"
    )

    event = db.query(Event).filter(Event.id == inv.event_id).first()
    event_date_fmt = _fmt_event_date(event)
    actor_name = user.get("name") or user.get("preferred_username", "Jemand")
    accepted_invs = (
        db.query(Invitation)
        .filter(Invitation.event_id == inv.event_id, Invitation.status == "accepted")
        .all()
    )
    respond_recipients = list(
        {i.invitee_keycloak_id for i in accepted_invs if i.invitee_keycloak_id}
    )
    if (
        event
        and event.creator_keycloak_id
        and event.creator_keycloak_id not in respond_recipients
    ):
        respond_recipients.append(event.creator_keycloak_id)
    ws_manager.dispatch_sync(
        {
            "type": "invitation_responded",
            "event_id": inv.event_id,
            "message": f"{actor_name} hat zum Event am {event_date_fmt} zugesagt.",
        },
        recipient_subs=respond_recipients,
        exclude_sub=user["sub"],
    )

    _notify_rsvp_organizers(
        db, event, user["sub"], actor_name, "rsvp_accepted", "accepted"
    )

    return {"ok": True}


@router.post("/{invitation_id}/decline", summary="Einladung ablehnen")
def decline_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    inv = db.query(Invitation).filter(Invitation.id == invitation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Einladung nicht gefunden")
    if (
        inv.invitee_email != user.get("email")
        and inv.invitee_keycloak_id != user["sub"]
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Nicht berechtigt"
        )

    inv.status = "declined"
    inv.invitee_keycloak_id = user["sub"]
    inv.responded_at = datetime.now(timezone.utc)
    db.commit()

    _log.info(
        f"Invitation declined: id={invitation_id} event_id={inv.event_id} by {user.get('name') or user.get('preferred_username', '?')!r} sub={user['sub']}"
    )

    event = db.query(Event).filter(Event.id == inv.event_id).first()
    event_date_fmt = _fmt_event_date(event)
    actor_name = user.get("name") or user.get("preferred_username", "Jemand")
    accepted_invs = (
        db.query(Invitation)
        .filter(Invitation.event_id == inv.event_id, Invitation.status == "accepted")
        .all()
    )
    respond_recipients = list(
        {i.invitee_keycloak_id for i in accepted_invs if i.invitee_keycloak_id}
    )
    if (
        event
        and event.creator_keycloak_id
        and event.creator_keycloak_id not in respond_recipients
    ):
        respond_recipients.append(event.creator_keycloak_id)
    ws_manager.dispatch_sync(
        {
            "type": "invitation_responded",
            "event_id": inv.event_id,
            "message": f"{actor_name} hat zum Event am {event_date_fmt} abgesagt.",
        },
        recipient_subs=respond_recipients,
        exclude_sub=user["sub"],
    )

    _notify_rsvp_organizers(
        db, event, user["sub"], actor_name, "rsvp_declined", "declined"
    )

    return {"ok": True}


@router.post("/{invitation_id}/withdraw")
def withdraw_invitation(
    invitation_id: int,
    body: dict,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Allow an invitee who already accepted to withdraw their attendance, with a reason."""
    inv = db.query(Invitation).filter(Invitation.id == invitation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Einladung nicht gefunden")
    if (
        inv.invitee_email != user.get("email")
        and inv.invitee_keycloak_id != user["sub"]
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Nicht berechtigt"
        )
    if inv.status != "accepted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nur angenommene Einladungen können abgesagt werden",
        )

    inv.status = "withdrawn"
    inv.decline_reason = body.get("reason", "")
    inv.responded_at = datetime.now(timezone.utc)
    db.commit()

    _log.info(
        f"Invitation withdrawn: id={invitation_id} event_id={inv.event_id} by {user.get('name') or user.get('preferred_username', '?')!r} sub={user['sub']}"
    )

    event = db.query(Event).filter(Event.id == inv.event_id).first()
    event_date_fmt = _fmt_event_date(event)
    actor_name = user.get("name") or user.get("preferred_username", "Jemand")
    accepted_invs = (
        db.query(Invitation)
        .filter(Invitation.event_id == inv.event_id, Invitation.status == "accepted")
        .all()
    )
    respond_recipients = list(
        {i.invitee_keycloak_id for i in accepted_invs if i.invitee_keycloak_id}
    )
    if (
        event
        and event.creator_keycloak_id
        and event.creator_keycloak_id not in respond_recipients
    ):
        respond_recipients.append(event.creator_keycloak_id)
    ws_manager.dispatch_sync(
        {
            "type": "invitation_responded",
            "event_id": inv.event_id,
            "message": f"{actor_name} hat die Teilnahme am Event am {event_date_fmt} zurückgezogen.",
        },
        recipient_subs=respond_recipients,
        exclude_sub=user["sub"],
    )

    _notify_rsvp_organizers(
        db, event, user["sub"], actor_name, "rsvp_declined", "declined"
    )

    return {"ok": True}


@router.delete("/{invitation_id}")
def revoke_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Revoke/withdraw an invitation. Only the inviter or an admin can do this."""
    inv = db.query(Invitation).filter(Invitation.id == invitation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Einladung nicht gefunden")

    is_admin = user.get("is_admin", False)
    is_inviter = inv.inviter_keycloak_id == user["sub"]

    if not is_admin and not is_inviter:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nur der Einladende oder ein Admin kann Einladungen zurücknehmen",
        )

    event_id_for_ws = inv.event_id
    revoked_invitee_sub = inv.invitee_keycloak_id  # capture before delete

    db.delete(inv)
    db.commit()

    _log.info(
        f"Invitation revoked: id={invitation_id} event_id={event_id_for_ws} invitee_sub={revoked_invitee_sub} by {user.get('name') or user.get('preferred_username', '?')!r} sub={user['sub']}"
    )

    event = db.query(Event).filter(Event.id == event_id_for_ws).first()
    event_date_fmt = _fmt_event_date(event)
    actor_name = user.get("name") or user.get("preferred_username", "Jemand")
    # Only notify the person whose invite was revoked (if they had a keycloak account)
    revoke_recipients = [revoked_invitee_sub] if revoked_invitee_sub else []
    ws_manager.dispatch_sync(
        {
            "type": "invitation_revoked",
            "event_id": event_id_for_ws,
            "message": f"{actor_name} hat eine Einladung zum Event am {event_date_fmt} zurückgenommen.",
        },
        recipient_subs=revoke_recipients,
        exclude_sub=user["sub"],
    )

    return {"ok": True}
