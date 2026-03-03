import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# DATABASE_URL is always injected by docker-compose from DB_USER/DB_PASSWORD/DB_NAME.
# The fallback here is only for local development outside Docker.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://biketimer:biketimer@localhost:5432/biketimer",
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
