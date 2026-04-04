from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Invitation, User
from ..schemas import UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    """Return all active users (for user selection lists)."""
    return db.query(User).filter(User.is_active == True).order_by(User.name.asc()).all()


@router.get("/all", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Return all users including inactive (for admin)."""
    return db.query(User).order_by(User.name.asc()).all()


@router.post("/me", response_model=UserResponse)
def register_or_link_me(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Called on every login. Links the Keycloak account to an existing DB user
    (matched by keycloak_id → email → display name) or creates a new record.
    Also migrates synthetic-email invitations to the real Keycloak e-mail.
    """
    sub = user["sub"]
    email = user.get("email") or None
    name = user.get("name") or user.get("preferred_username", "")

    # 1. Already linked by keycloak_id – just refresh email
    existing = db.query(User).filter(User.keycloak_id == sub).first()
    if existing:
        if email and existing.email != email:
            existing.email = email
            db.commit()
            db.refresh(existing)
        return existing

    # 2. Match by real e-mail
    if email:
        by_email = db.query(User).filter(User.email == email).first()
        if by_email and by_email.keycloak_id is None:
            by_email.keycloak_id = sub
            db.commit()
            _migrate_invitations(db, by_email, sub, email)
            db.refresh(by_email)
            return by_email

    # 3. Match by display name (seeded users have no keycloak_id)
    if name:
        by_name = (
            db.query(User)
            .filter(User.name == name, User.keycloak_id.is_(None))
            .first()
        )
        if by_name:
            by_name.keycloak_id = sub
            if email:
                by_name.email = email
            db.commit()
            _migrate_invitations(db, by_name, sub, email)
            db.refresh(by_name)
            return by_name

    # 4. No match – create a new user
    new_user = User(keycloak_id=sub, name=name, email=email, is_active=True)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def _migrate_invitations(db: Session, user_obj: User, sub: str, real_email):
    """Update pending invitations that used a synthetic @local address."""
    synthetic = f"{user_obj.name.lower().replace(' ', '.')}@local"
    pending = (
        db.query(Invitation)
        .filter(
            Invitation.invitee_email == synthetic,
            Invitation.invitee_keycloak_id.is_(None),
        )
        .all()
    )
    for inv in pending:
        inv.invitee_keycloak_id = sub
        if real_email:
            inv.invitee_email = real_email
    if pending:
        db.commit()
