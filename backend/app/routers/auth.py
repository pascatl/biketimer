"""
In-app registration via Keycloak Admin REST API.

Requires env vars:
  KEYCLOAK_ADMIN_USER
  KEYCLOAK_ADMIN_PASSWORD
  KEYCLOAK_URL
  KEYCLOAK_REALM
"""
import os

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..kc_admin import get_admin_token, KEYCLOAK_URL, KEYCLOAK_REALM, ADMIN_USER, ADMIN_PASSWORD
from ..models import User
from ..email_service import send_welcome_email
from ..logger import get_logger

_log = get_logger("auth")

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    username: str
    email: str = ""
    password: str
    display_name: str = ""  # optional, falls back to username


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(body: RegisterRequest, db: Session = Depends(get_db)):
    """
    Create a new Keycloak user + matching DB user record.
    Returns a success message; the client should then log in normally.
    """
    if not ADMIN_USER or not ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Registrierung nicht konfiguriert.",
        )

    admin_token = get_admin_token()

    display = body.display_name.strip() or body.username

    # Create user in Keycloak
    payload = {
        "username": body.username,
        "email": body.email,
        "enabled": True,
        "emailVerified": True,
        "firstName": display,
        "requiredActions": [],  # ensure no pending actions block login
        "credentials": [
            {
                "type": "password",
                "value": body.password,
                "temporary": False,
            }
        ],
    }

    resp = httpx.post(
        f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=10,
    )

    if resp.status_code == 409:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Nutzername oder E-Mail bereits vergeben.",
        )
    if resp.status_code not in (200, 201):
        detail = resp.text or "Unbekannter Fehler bei der Registrierung"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

    # Fetch the newly created user's ID from Keycloak so we can link it
    search_resp = httpx.get(
        f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users",
        params={"username": body.username, "exact": "true"},
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=10,
    )
    keycloak_id = None
    if search_resp.status_code == 200:
        users = search_resp.json()
        if users:
            keycloak_id = users[0]["id"]

    # Try to link to an existing DB user (by display_name or email)
    db_user = None
    if body.email:
        db_user = db.query(User).filter(User.email == body.email).first()
    if not db_user and display:
        db_user = db.query(User).filter(User.name == display).first()
    if not db_user and body.username:
        db_user = db.query(User).filter(User.name == body.username).first()

    if db_user:
        if keycloak_id:
            db_user.keycloak_id = keycloak_id
        if body.email and not db_user.email:
            db_user.email = body.email
        db.commit()
    else:
        # Create a new DB user
        db_user = User(
            name=display,
            email=body.email,
            keycloak_id=keycloak_id,
        )
        db.add(db_user)
        db.commit()

    # Send welcome email if we have an address
    if body.email:
        try:
            send_welcome_email(body.email, display)
        except Exception:
            pass

    _log.info(f"User registered: {display!r} email={body.email or '(none)'}")
    return {"ok": True, "message": "Registrierung erfolgreich. Du kannst dich jetzt einloggen."}

