import uuid
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    keycloak_id = Column(String(255), unique=True, nullable=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    email_prefs = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class UserGroup(Base):
    __tablename__ = "user_groups"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    sport_type_key = Column(
        String(100), ForeignKey("sport_types.key", ondelete="CASCADE"), nullable=False
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Jersey(Base):
    __tablename__ = "jerseys"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SportType(Base):
    __tablename__ = "sport_types"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), nullable=False, unique=True)
    label = Column(String(255), nullable=False)
    icon = Column(String(100), nullable=False, default="DirectionsBike")
    color = Column(String(20), nullable=False, default="#2D3C59")
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    keycloak_id = Column(String(255), nullable=False)
    endpoint = Column(Text, nullable=False, unique=True)
    p256dh = Column(Text, nullable=False)
    auth = Column(Text, nullable=False)
    notification_prefs = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    event_data = Column(JSON, nullable=False, default=dict)
    creator_keycloak_id = Column(String(255), nullable=True)
    creator_email = Column(String(255), nullable=True)
    creator_name = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    invitations = relationship(
        "Invitation", back_populates="event", cascade="all, delete-orphan"
    )
    comments = relationship(
        "EventComment", back_populates="event", cascade="all, delete-orphan"
    )


class EventComment(Base):
    __tablename__ = "event_comments"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(
        Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False
    )
    author_keycloak_id = Column(String(255), nullable=False)
    author_name = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    event = relationship("Event", back_populates="comments")
    reactions = relationship(
        "CommentReaction", back_populates="comment", cascade="all, delete-orphan"
    )


class CommentReaction(Base):
    __tablename__ = "comment_reactions"

    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(
        Integer, ForeignKey("event_comments.id", ondelete="CASCADE"), nullable=False
    )
    user_keycloak_id = Column(String(255), nullable=False)
    user_name = Column(String(255), nullable=True)
    emoji = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    comment = relationship("EventComment", back_populates="reactions")


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
    status = Column(
        String(20), default="pending"
    )  # pending | accepted | declined | withdrawn
    token = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True)
    decline_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    responded_at = Column(DateTime(timezone=True), nullable=True)

    event = relationship("Event", back_populates="invitations")
