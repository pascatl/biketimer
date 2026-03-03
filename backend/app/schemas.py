from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr


class EventData(BaseModel):
    event_date: str
    event_startTime: Optional[str] = "15:00"
    event_members: Optional[List[str]] = []
    event_no_members: Optional[List[str]] = []
    event_leader: Optional[str] = ""
    event_jersey: Optional[str] = ""
    event_type: Optional[str] = "rennrad"
    event_comment: Optional[str] = ""
    event_link: Optional[str] = ""


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

    model_config = {"from_attributes": True}


class InvitationCreate(BaseModel):
    invitee_email: EmailStr


class InvitationResponse(BaseModel):
    id: int
    event_id: int
    inviter_name: Optional[str] = None
    invitee_email: str
    status: str
    created_at: Optional[datetime] = None
    event_data: Optional[Dict[str, Any]] = None

    model_config = {"from_attributes": True}
