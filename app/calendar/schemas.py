from pydantic import BaseModel
from typing import Optional
from datetime import date, time, datetime
from app.calendar.models import EventType


class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    event_type: EventType = EventType.general
    assigned_to: Optional[str] = None   # Keycloak UUID of assignee
    color: Optional[str] = None
    # created_by is NOT accepted from the client — always set from the JWT token


class TaskAssign(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    assigned_to: str                    # Keycloak UUID of the person receiving the task
    color: Optional[str] = None
    # created_by is NOT accepted from the client — always set from the JWT token


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    event_type: Optional[EventType] = None
    assigned_to: Optional[str] = None  # Keycloak UUID
    color: Optional[str] = None


class EventResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    event_date: Optional[date]
    start_time: Optional[time]
    end_time: Optional[time]
    event_type: EventType
    created_by: str                     # Keycloak UUID
    assigned_to: Optional[str]          # Keycloak UUID
    color: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
