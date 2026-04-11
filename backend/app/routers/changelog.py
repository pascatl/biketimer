from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import ChangelogEntry, ChangelogSeen, User
from ..schemas import ChangelogEntryResponse
from ..logger import get_logger

_log = get_logger("changelog")

router = APIRouter(prefix="/changelog", tags=["changelog"])


@router.get("/unseen", response_model=List[ChangelogEntryResponse])
def get_unseen_changelog(
    kc_user=Depends(get_current_user), db: Session = Depends(get_db)
):
    """Return changelog entries the current user has not yet seen."""
    user = db.query(User).filter(User.keycloak_id == kc_user["sub"]).first()
    if not user:
        return []

    seen_ids = (
        db.query(ChangelogSeen.changelog_id)
        .filter(ChangelogSeen.user_id == user.id)
        .subquery()
    )

    entries = (
        db.query(ChangelogEntry)
        .filter(ChangelogEntry.id.notin_(seen_ids))
        .order_by(ChangelogEntry.created_at.asc())
        .all()
    )

    return [
        ChangelogEntryResponse(
            id=e.id,
            slug=e.slug,
            title=e.title,
            body=e.body,
            created_at=e.created_at.isoformat() if e.created_at else "",
        )
        for e in entries
    ]


@router.post("/seen")
def mark_changelog_seen(
    entry_ids: List[int],
    kc_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark one or more changelog entries as seen by the current user."""
    user = db.query(User).filter(User.keycloak_id == kc_user["sub"]).first()
    if not user:
        return {"ok": True}

    for eid in entry_ids:
        exists = (
            db.query(ChangelogSeen)
            .filter(
                ChangelogSeen.user_id == user.id,
                ChangelogSeen.changelog_id == eid,
            )
            .first()
        )
        if not exists:
            db.add(ChangelogSeen(user_id=user.id, changelog_id=eid))

    db.commit()
    return {"ok": True}
