"""Shared Keycloak Admin REST helpers."""
import os
import httpx
from fastapi import HTTPException, status

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "biketimer")
ADMIN_USER = os.getenv("KEYCLOAK_ADMIN_USER", "")
ADMIN_PASSWORD = os.getenv("KEYCLOAK_ADMIN_PASSWORD", "")


def get_admin_token() -> str:
    """Obtain a short-lived master-realm admin access token."""
    if not ADMIN_USER or not ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Keycloak-Admin nicht konfiguriert.",
        )
    resp = httpx.post(
        f"{KEYCLOAK_URL}/realms/master/protocol/openid-connect/token",
        data={
            "grant_type": "password",
            "client_id": "admin-cli",
            "username": ADMIN_USER,
            "password": ADMIN_PASSWORD,
        },
        timeout=10,
    )
    if resp.status_code == 401:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Keycloak-Admin-Zugangsdaten ungültig.",
        )
    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Keycloak-Admin nicht erreichbar (HTTP {resp.status_code}).",
        )
    return resp.json()["access_token"]


def delete_kc_user(keycloak_id: str) -> None:
    """Delete a user from Keycloak by their UUID. Ignores 404 (already gone)."""
    token = get_admin_token()
    resp = httpx.delete(
        f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users/{keycloak_id}",
        headers={"Authorization": f"Bearer {token}"},
        timeout=10,
    )
    if resp.status_code not in (204, 404):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Keycloak-Nutzer konnte nicht gelöscht werden (HTTP {resp.status_code}).",
        )
