import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine
from .models import Base
from .routers import events, invitations

# Create tables that don't exist yet (safe with existing DB)
Base.metadata.create_all(bind=engine)

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


@app.get("/api/health")
def health():
    return {"status": "ok"}
