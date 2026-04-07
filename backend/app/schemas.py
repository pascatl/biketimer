from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr


# ── Event schemas ─────────────────────────────────────────────


class EventData(BaseModel):
    event_date: str
    event_title: Optional[str] = ""
    event_startTime: Optional[str] = "15:00"
    event_members: Optional[List[str]] = []
    event_no_members: Optional[List[str]] = []
    event_leader: Optional[str] = ""
    event_jersey: Optional[str] = ""
    event_type: Optional[str] = "rennrad"
    event_comment: Optional[str] = ""
    event_link: Optional[str] = ""
    event_meeting_text: Optional[str] = ""
    event_meeting_lat: Optional[float] = None
    event_meeting_lon: Optional[float] = None


class EventCreate(BaseModel):
    event_data: EventData


class EventUpdate(BaseModel):
    id: Optional[int] = None
    event_data: EventData


class EventResponse(BaseModel):
    id: int
    event_data: Dict[str, Any]
    creator_keycloak_id: Optional[str] = None
    creator_name: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Invitation schemas ────────────────────────────────────────


class InvitationCreate(BaseModel):
    invitee_user_ids: List[int]


class InvitationResponse(BaseModel):
    id: int
    event_id: int
    inviter_name: Optional[str] = None
    invitee_email: str
    status: str
    created_at: Optional[datetime] = None
    event_data: Optional[Dict[str, Any]] = None

    model_config = {"from_attributes": True}


# ── User schemas ──────────────────────────────────────────────


class UserCreate(BaseModel):
    name: str
    email: Optional[str] = None
    keycloak_id: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    keycloak_id: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    keycloak_id: Optional[str] = None
    name: str
    email: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


# ── Jersey schemas ────────────────────────────────────────────


class JerseyCreate(BaseModel):
    name: str
    sort_order: Optional[int] = 0


class JerseyUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class JerseyResponse(BaseModel):
    id: int
    name: str
    is_active: bool
    sort_order: int

    model_config = {"from_attributes": True}


# ── SportType schemas ─────────────────────────────────────────


class SportTypeCreate(BaseModel):
    key: str
    label: str
    icon: Optional[str] = "DirectionsBike"
    color: Optional[str] = "#2D3C59"
    sort_order: Optional[int] = 0


class SportTypeUpdate(BaseModel):
    key: Optional[str] = None
    label: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class SportTypeResponse(BaseModel):
    id: int
    key: str
    label: str
    icon: str
    color: str
    is_active: bool
    sort_order: int

    model_config = {"from_attributes": True}


# ── Event Comment schemas ─────────────────────────────────────


class EventCommentCreate(BaseModel):
    content: str


class EventCommentResponse(BaseModel):
    id: int
    event_id: int
    author_keycloak_id: str
    author_name: Optional[str] = None
    content: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Push subscription schemas ─────────────────────────────────

DEFAULT_NOTIF_PREFS = {
    "invite_received": True,
    "event_updated": True,
    "event_cancelled": True,
    "admin_user_registered": True,
    "admin_event_created": True,
    "admin_event_updated": True,
    "admin_event_deleted": True,
}

DEFAULT_EMAIL_PREFS = {
    "invite_received": True,
    "event_updated": True,
    "event_cancelled": True,
    "admin_user_registered": True,
    "admin_event_created": True,
    "admin_event_updated": True,
    "admin_event_deleted": True,
}


class PushSubscriptionCreate(BaseModel):
    endpoint: str
    keys: Dict[str, str]  # { p256dh, auth }
    prefs: Optional[Dict[str, bool]] = None  # notification preferences


class PushPrefsUpdate(BaseModel):
    prefs: Dict[str, bool]


class EmailPrefsUpdate(BaseModel):
    prefs: Dict[str, bool]


class PushSubscriptionResponse(BaseModel):
    id: int
    endpoint: str

    model_config = {"from_attributes": True}
