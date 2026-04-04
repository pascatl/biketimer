import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .database import engine
from .models import Base
from .routers import events, invitations, users, admin, data, push, stats

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
                print("Migration 002 applied successfully")
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
                    print("Migration 002 seed data applied")
except Exception as e:
    print(f"Migration check: {e}")

FRONTEND_ORIGINS = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:5173,http://localhost:4173",
).split(",")

app = FastAPI(title="Biketimer API", version="2.0.0")

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


@app.get("/api/health")
def health():
    return {"status": "ok"}
