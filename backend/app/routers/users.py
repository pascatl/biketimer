from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Invitation, User, PushSubscription, UserGroup
from ..push_service import send_push_notification
from ..schemas import UserResponse, UserGroupsUpdate, UserGroupsResponse
from ..logger import get_logger

_log = get_logger("users")

router = APIRouter(prefix="/users", tags=["users"])


def _push_with_pref(db, keycloak_id: str, pref_key: str, title: str, body: str):
    subs = (
        db.query(PushSubscription)
        .filter(PushSubscription.keycloak_id == keycloak_id)
        .all()
    )
    for sub in subs:
        prefs = sub.notification_prefs or {}
        if prefs.get(pref_key, False):  # default False = opt-in
            try:
                send_push_notification(
                    sub.endpoint, sub.p256dh, sub.auth, title=title, body=body
                )
            except Exception:
                pass


def _notify_admins_new_user(db, new_sub: str, name: str):
    """Send admin_user_registered push only to admin users."""
    admin_users = (
        db.query(User).filter(User.is_active == True, User.is_admin == True).all()
    )
    for au in admin_users:
        if au.keycloak_id and au.keycloak_id != new_sub:
            _push_with_pref(
                db,
                au.keycloak_id,
                "admin_user_registered",
                "Neuer Benutzer",
                f"{name} hat sich registriert.",
            )
    _log.info(f"New user registered: {name!r} sub={new_sub}")


@router.get("", response_model=List[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
    group: Optional[str] = Query(None, description="Filter by sport_type key (group)"),
):
    """Return all active users, optionally filtered by group membership."""
    query = db.query(User).filter(User.is_active == True)
    if group:
        member_ids = (
            db.query(UserGroup.user_id)
            .filter(UserGroup.sport_type_key == group)
            .subquery()
        )
        query = query.filter(User.id.in_(member_ids))
    return query.order_by(User.name.asc()).all()


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

    # 1. Already linked by keycloak_id – refresh email and sync admin role
    existing = db.query(User).filter(User.keycloak_id == sub).first()
    if existing:
        changed = False
        if email and existing.email != email:
            existing.email = email
            changed = True
        is_admin_now = user.get("is_admin", False)
        if existing.is_admin != is_admin_now:
            existing.is_admin = is_admin_now
            changed = True
        if changed:
            db.commit()
            db.refresh(existing)
        _log.info(f"User login: {existing.name!r} sub={sub}")
        return existing

    # 2. Match by real e-mail
    if email:
        by_email = db.query(User).filter(User.email == email).first()
        if by_email and by_email.keycloak_id is None:
            by_email.keycloak_id = sub
            by_email.is_admin = user.get("is_admin", False)
            db.commit()
            _migrate_invitations(db, by_email, sub, email)
            db.refresh(by_email)
            _notify_admins_new_user(db, sub, by_email.name)
            return by_email

    # 3. Match by display name (seeded users have no keycloak_id)
    if name:
        by_name = (
            db.query(User).filter(User.name == name, User.keycloak_id.is_(None)).first()
        )
        if by_name:
            by_name.keycloak_id = sub
            by_name.is_admin = user.get("is_admin", False)
            if email:
                by_name.email = email
            db.commit()
            _migrate_invitations(db, by_name, sub, email)
            db.refresh(by_name)
            _notify_admins_new_user(db, sub, by_name.name)
            return by_name

    # 4. No match – create a new user
    new_user = User(
        keycloak_id=sub,
        name=name,
        email=email,
        is_active=True,
        is_admin=user.get("is_admin", False),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    _notify_admins_new_user(db, sub, name)
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


# ── Group membership endpoints ────────────────────────────────


@router.get("/me/groups", response_model=UserGroupsResponse)
def get_my_groups(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Return the sport-type group keys the current user belongs to."""
    sub = user["sub"]
    db_user = db.query(User).filter(User.keycloak_id == sub).first()
    if not db_user:
        return UserGroupsResponse(groups=[])
    rows = (
        db.query(UserGroup.sport_type_key).filter(UserGroup.user_id == db_user.id).all()
    )
    return UserGroupsResponse(groups=[r[0] for r in rows])


@router.put("/me/groups", response_model=UserGroupsResponse)
def update_my_groups(
    body: UserGroupsUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Replace the current user's group memberships with the given list."""
    sub = user["sub"]
    db_user = db.query(User).filter(User.keycloak_id == sub).first()
    if not db_user:
        return UserGroupsResponse(groups=[])

    # Remove old memberships
    db.query(UserGroup).filter(UserGroup.user_id == db_user.id).delete()

    # Insert new memberships
    for key in set(body.groups):
        db.add(UserGroup(user_id=db_user.id, sport_type_key=key))
    db.commit()

    _log.info(f"User {db_user.name!r} updated groups: {body.groups}")
    return UserGroupsResponse(groups=list(set(body.groups)))
