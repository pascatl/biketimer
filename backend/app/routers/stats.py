from collections import defaultdict
from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Event, Invitation, User

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("")
def get_stats(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Return participation statistics for all users."""
    total_events = db.query(func.count(Event.id)).scalar() or 0

    # Count accepted invitations per user
    rows = (
        db.query(
            User.id,
            User.name,
            func.count(Invitation.id).label("count"),
        )
        .outerjoin(
            Invitation,
            (
                (Invitation.invitee_email == User.email)
                | (Invitation.invitee_keycloak_id == User.keycloak_id)
            )
            & (Invitation.status == "accepted"),
        )
        .filter(User.is_active == True)
        .group_by(User.id, User.name)
        .order_by(func.count(Invitation.id).desc(), User.name)
        .all()
    )

    ranking = [
        {"user_id": r.id, "name": r.name, "participations": r.count} for r in rows
    ]

    # Per-user: events they were invited to (any status)
    my_email = user.get("email")
    my_sub = user.get("sub")
    my_stats = {"accepted": 0, "declined": 0, "pending": 0}
    if my_email or my_sub:
        filters = []
        if my_email:
            filters.append(Invitation.invitee_email == my_email)
        if my_sub:
            filters.append(Invitation.invitee_keycloak_id == my_sub)

        from sqlalchemy import or_

        my_invitations = (
            db.query(Invitation.status, func.count(Invitation.id))
            .filter(or_(*filters))
            .group_by(Invitation.status)
            .all()
        )
        for s, c in my_invitations:
            if s in my_stats:
                my_stats[s] = c

    return {
        "total_events": total_events,
        "ranking": ranking,
        "my_stats": my_stats,
    }
