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
    created_by: int
    assigned_to: Optional[int] = None
    color: Optional[str] = None


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    event_type: Optional[EventType] = None
    assigned_to: Optional[int] = None
    color: Optional[str] = None


class EventResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    event_date: Optional[date]
    start_time: Optional[time]
    end_time: Optional[time]
    event_type: EventType
    created_by: int
    assigned_to: Optional[int]
    color: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
