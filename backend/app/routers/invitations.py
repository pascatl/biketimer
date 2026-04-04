from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Event, Invitation

router = APIRouter(prefix="/invitations", tags=["invitations"])


@router.get("/mine", response_model=List[dict])
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
        .all()
    )

    result = []
    for inv in rows:
        event = db.query(Event).filter(Event.id == inv.event_id).first()
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


@router.post("/{invitation_id}/accept")
def accept_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    inv = db.query(Invitation).filter(Invitation.id == invitation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Einladung nicht gefunden")
    if inv.invitee_email != user.get("email") and inv.invitee_keycloak_id != user["sub"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Nicht berechtigt"
        )

    inv.status = "accepted"
    inv.invitee_keycloak_id = user["sub"]
    inv.decline_reason = None
    inv.responded_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True}


@router.post("/{invitation_id}/decline")
def decline_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    inv = db.query(Invitation).filter(Invitation.id == invitation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Einladung nicht gefunden")
    if inv.invitee_email != user.get("email") and inv.invitee_keycloak_id != user["sub"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Nicht berechtigt"
        )

    inv.status = "declined"
    inv.invitee_keycloak_id = user["sub"]
    inv.responded_at = datetime.now(timezone.utc)
    db.commit()
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
    if inv.invitee_email != user.get("email") and inv.invitee_keycloak_id != user["sub"]:
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

    db.delete(inv)
    db.commit()
    return {"ok": True}
