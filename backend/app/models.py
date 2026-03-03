import uuid
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship

from .database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    event_data = Column(JSON, nullable=False, default=dict)
    creator_keycloak_id = Column(String(255), nullable=True)
    creator_email = Column(String(255), nullable=True)
    creator_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    invitations = relationship(
        "Invitation", back_populates="event", cascade="all, delete-orphan"
    )


class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(
        Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False
    )
    inviter_keycloak_id = Column(String(255), nullable=False)
    inviter_name = Column(String(255), nullable=True)
    invitee_email = Column(String(255), nullable=False)
    invitee_keycloak_id = Column(String(255), nullable=True)
    status = Column(String(20), default="pending")  # pending | accepted | declined
    token = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True)
    created_at = Column(DateTime, server_default=func.now())
    responded_at = Column(DateTime, nullable=True)

    event = relationship("Event", back_populates="invitations")
