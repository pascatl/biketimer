import os
from typing import Optional

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2AuthorizationCodeBearer
from jose import JWTError, jwt

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://localhost:8080")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "biketimer")
KEYCLOAK_CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID", "biketimer-frontend")

JWKS_URL = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/certs"
ISSUER = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}"

oauth2_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl=f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/auth",
    tokenUrl=f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token",
    auto_error=False,
)

_jwks_cache: Optional[dict] = None


def _get_jwks() -> dict:
    """Fetch and cache JWKS from Keycloak (sync)."""
    global _jwks_cache
    if _jwks_cache is None:
        resp = httpx.get(JWKS_URL, timeout=10)
        resp.raise_for_status()
        _jwks_cache = resp.json()
    return _jwks_cache


def _decode_token(token: str) -> dict:
    jwks = _get_jwks()
    payload = jwt.decode(
        token,
        jwks,
        algorithms=["RS256"],
        issuer=ISSUER,
        options={"verify_aud": False},
    )
    # Extract realm roles
    realm_roles = payload.get("realm_access", {}).get("roles", [])
    return {
        "sub": payload.get("sub"),
        "email": payload.get("email"),
        "name": payload.get("name") or payload.get("preferred_username", ""),
        "preferred_username": payload.get("preferred_username", ""),
        "roles": realm_roles,
        "is_admin": "admin" in realm_roles,
    }


def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> dict:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nicht eingeloggt",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        return _decode_token(token)
    except (JWTError, Exception) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Ungültiger Token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
) -> Optional[dict]:
    if not token:
        return None
    try:
        return _decode_token(token)
    except Exception:
        return None


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """Dependency that requires the user to have the 'admin' realm role."""
    if not user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin-Berechtigung erforderlich",
        )
    return user
