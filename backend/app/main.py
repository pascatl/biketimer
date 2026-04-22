import asyncio
import json
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .database import engine
from .models import Base
from .routers import (
    events,
    invitations,
    users,
    admin,
    data,
    push,
    stats,
    auth,
    weather,
    changelog,
)
from .config import APP_NAME
from .ws_manager import manager, set_event_loop
from .auth import _decode_token
from .logger import get_logger

_log = get_logger("main")

# Create tables that don't exist yet (safe with existing DB)
Base.metadata.create_all(bind=engine)

# Run migration 002 if tables don't exist yet
try:
    with engine.connect() as conn:
        result = conn.execute(
            text(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
            )
        )
        users_exist = result.scalar()
        if not users_exist:
            migration_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "migrations",
                "002_users_jerseys_sports_push.sql",
            )
            if os.path.exists(migration_path):
                with open(migration_path) as f:
                    sql = f.read()
                conn.execute(text(sql))
                conn.commit()
                _log.info("Migration 002 applied successfully")
        else:
            # Tables exist, but ensure seed data is present
            result = conn.execute(text("SELECT COUNT(*) FROM users"))
            if result.scalar() == 0:
                migration_path = os.path.join(
                    os.path.dirname(os.path.dirname(__file__)),
                    "migrations",
                    "002_users_jerseys_sports_push.sql",
                )
                if os.path.exists(migration_path):
                    with open(migration_path) as f:
                        sql = f.read()
                    conn.execute(text(sql))
                    conn.commit()
                    _log.info("Migration 002 seed data applied")
except Exception as e:
    _log.error(f"Migration 002 check: {e}")

# Run migration 003: convert TIMESTAMP → TIMESTAMPTZ
try:
    with engine.connect() as conn:
        result = conn.execute(
            text(
                "SELECT data_type FROM information_schema.columns "
                "WHERE table_name = 'events' AND column_name = 'created_at'"
            )
        )
        row = result.fetchone()
        if row and row[0] != "timestamp with time zone":
            migration_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "migrations",
                "003_timestamptz.sql",
            )
            if os.path.exists(migration_path):
                with open(migration_path) as f:
                    sql = f.read()
                conn.execute(text(sql))
                conn.commit()
                _log.info("Migration 003 (timestamptz) applied successfully")
except Exception as e:
    _log.error(f"Migration 003 check: {e}")

# Run migration 004: add notification_prefs to push_subscriptions
try:
    with engine.connect() as conn:
        result = conn.execute(
            text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = 'push_subscriptions' AND column_name = 'notification_prefs'"
            )
        )
        if not result.fetchone():
            migration_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "migrations",
                "004_push_notif_prefs.sql",
            )
            if os.path.exists(migration_path):
                with open(migration_path) as f:
                    sql = f.read()
                conn.execute(text(sql))
                conn.commit()
                _log.info("Migration 004 (notification_prefs) applied successfully")
except Exception as e:
    _log.error(f"Migration 004 check: {e}")

# Run migration 005: add email_prefs to users
try:
    with engine.connect() as conn:
        result = conn.execute(
            text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = 'users' AND column_name = 'email_prefs'"
            )
        )
        if not result.fetchone():
            migration_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "migrations",
                "005_user_email_prefs.sql",
            )
            if os.path.exists(migration_path):
                with open(migration_path) as f:
                    sql = f.read()
                conn.execute(text(sql))
                conn.commit()
                _log.info("Migration 005 (email_prefs) applied successfully")
except Exception as e:
    _log.error(f"Migration 005 check: {e}")

# Run migration 006: add event_comments table
try:
    with engine.connect() as conn:
        result = conn.execute(
            text(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'event_comments')"
            )
        )
        if not result.scalar():
            migration_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "migrations",
                "006_event_comments.sql",
            )
            if os.path.exists(migration_path):
                with open(migration_path) as f:
                    sql = f.read()
                conn.execute(text(sql))
                conn.commit()
                _log.info("Migration 006 (event_comments) applied successfully")
except Exception as e:
    _log.error(f"Migration 006 check: {e}")

# Run migration 007: update sport type icons and add Beachvolleyball
# All SQL statements in this migration are idempotent, so it is safe to run on every startup.
try:
    with engine.connect() as conn:
        migration_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "migrations",
            "007_sport_type_icons.sql",
        )
        if os.path.exists(migration_path):
            with open(migration_path) as f:
                sql = f.read()
            conn.execute(text(sql))
            conn.commit()
            _log.info("Migration 007 (sport_type_icons) applied successfully")
except Exception as e:
    _log.error(f"Migration 007 check: {e}")

# Run migration 011: user_groups table (idempotent – IF NOT EXISTS)
try:
    with engine.connect() as conn:
        migration_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "migrations",
            "011_user_groups.sql",
        )
        if os.path.exists(migration_path):
            with open(migration_path) as f:
                sql = f.read()
            conn.execute(text(sql))
            conn.commit()
            _log.info("Migration 011 (user_groups) applied successfully")
except Exception as e:
    _log.error(f"Migration 011 check: {e}")

# Run migration 012: changelog tables + seed data (idempotent – IF NOT EXISTS / ON CONFLICT)
try:
    with engine.connect() as conn:
        migration_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "migrations",
            "012_changelog.sql",
        )
        if os.path.exists(migration_path):
            with open(migration_path) as f:
                sql = f.read()
            conn.execute(text(sql))
            conn.commit()
            _log.info("Migration 012 (changelog) applied successfully")
except Exception as e:
    _log.error(f"Migration 012 check: {e}")

# Run migration 013: ICS export changelog entry (idempotent – ON CONFLICT DO NOTHING)
try:
    with engine.connect() as conn:
        migration_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "migrations",
            "013_ics_export_changelog.sql",
        )
        if os.path.exists(migration_path):
            with open(migration_path) as f:
                sql = f.read()
            conn.execute(text(sql))
            conn.commit()
            _log.info("Migration 013 (ics_export_changelog) applied successfully")
except Exception as e:
    _log.error(f"Migration 013 check: {e}")

FRONTEND_ORIGINS = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:5173,http://localhost:4173",
).split(",")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Capture the running event loop so sync route handlers can broadcast WS messages."""
    set_event_loop(asyncio.get_running_loop())
    yield


_OPENAPI_TAGS = [
    {
        "name": "events",
        "description": "Radveranstaltungen erstellen, abrufen, aktualisieren und löschen. "
        "Enthält auch Kommentare und ICS-Export.",
    },
    {
        "name": "invitations",
        "description": "Einladungen zu Veranstaltungen versenden, annehmen oder ablehnen.",
    },
    {
        "name": "users",
        "description": "Eigenes Benutzerprofil abrufen und verwalten (Trikot, Benachrichtigungseinstellungen, …).",
    },
    {
        "name": "admin",
        "description": "Adminbereich: Benutzer, Trikots, Sportarten und Gruppen verwalten. "
        "Erfordert die Rolle **admin**.",
    },
    {
        "name": "data",
        "description": "Stammdaten abrufen: verfügbare Trikots, Sportarten und Benutzergruppen.",
    },
    {
        "name": "push",
        "description": "Web-Push-Abonnements registrieren, aktualisieren und löschen.",
    },
    {
        "name": "stats",
        "description": "Teilnahme-Statistiken und Bestenlisten.",
    },
    {
        "name": "auth",
        "description": "Keycloak-Token validieren und Benutzer-Sync beim ersten Login.",
    },
    {
        "name": "weather",
        "description": "Wettervorhersage für einen Veranstaltungsort (Open-Meteo).",
    },
    {
        "name": "changelog",
        "description": "App-Changelog: Einträge und Kategorien abrufen.",
    },
]

app = FastAPI(
    title=f"{APP_NAME} API",
    version="2.0.0",
    description=(
        "REST-Backend für **Biketimer** – eine App zur Organisation von Radveranstaltungen.\n\n"
        "Authentifizierung erfolgt via **Keycloak** (OAuth 2.0 / OpenID Connect). "
        "Klicke auf **Authorize** und gib deinen Bearer-Token ein, um geschützte Endpunkte zu testen.\n\n"
        "Echtzeit-Updates werden über `/api/ws` (WebSocket) geliefert."
    ),
    openapi_tags=_OPENAPI_TAGS,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in FRONTEND_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events.router, prefix="/api")
app.include_router(invitations.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(data.router, prefix="/api")
app.include_router(push.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(weather.router, prefix="/api")
app.include_router(changelog.router, prefix="/api")


@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    # 1) Origin check – prevents cross-site WebSocket hijacking
    origin = websocket.headers.get("origin", "").rstrip("/")
    allowed_origins = {o.strip().rstrip("/") for o in FRONTEND_ORIGINS}
    if origin and origin not in allowed_origins:
        await websocket.close(code=1008)  # Policy Violation
        return

    # Accept without token – token arrives as first encrypted frame,
    # never in the URL where it would appear in access logs.
    await manager.connect(websocket, sub=None)
    _log.info("WS client connected (unauthenticated)")
    try:
        # 2) Grace period: client must send a valid auth frame within 10 s.
        #    After that, unauthenticated connections are closed.
        AUTH_GRACE_SECONDS = 10
        authenticated = False
        deadline = asyncio.get_event_loop().time() + AUTH_GRACE_SECONDS

        while True:
            remaining = (
                deadline - asyncio.get_event_loop().time()
                if not authenticated
                else None
            )
            if remaining is not None and remaining <= 0:
                _log.warning("WS auth grace period expired – closing connection")
                await websocket.close(code=1008)
                manager.disconnect(websocket)
                return

            try:
                raw = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=remaining,
                )
            except asyncio.TimeoutError:
                _log.warning("WS auth timeout – closing connection")
                await websocket.close(code=1008)
                manager.disconnect(websocket)
                return

            try:
                msg = json.loads(raw)
            except Exception:
                continue

            if msg.get("type") == "auth":
                # 3) Validate token and register/update the sub for this connection.
                #    Accepting a renewed token also keeps the sub current after
                #    Keycloak silently refreshes the access token on the client.
                token = msg.get("token", "")
                sub: str | None = None
                if token:
                    try:
                        sub = _decode_token(token).get("sub")
                    except Exception:
                        pass  # invalid token – close rather than stay anonymous
                if sub:
                    manager.set_sub(websocket, sub)
                    if not authenticated:
                        _log.info(f"WS authenticated sub={sub}")
                    authenticated = True
                else:
                    _log.warning("WS auth failed (invalid token) – closing connection")
                    await websocket.close(code=1008)
                    manager.disconnect(websocket)
                    return
            # All other frames are ignored (keep-alive, etc.)
    except WebSocketDisconnect:
        sub = manager.get_sub(websocket)
        _log.info(f"WS client disconnected sub={sub}")
        manager.disconnect(websocket)


@app.get("/api/health")
def health():
    return {"status": "ok"}
