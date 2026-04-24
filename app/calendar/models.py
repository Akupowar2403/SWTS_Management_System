from sqlalchemy import Column, Integer, String, Date, Time, DateTime, Text, Enum as SAEnum
from sqlalchemy.sql import func
import enum

from app.calendar.database import Base


class EventType(str, enum.Enum):
    general = "general"
    zoom = "zoom"
    followup = "followup"
    task = "task"


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    event_date = Column(Date, nullable=True)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)

    event_type = Column(SAEnum(EventType), default=EventType.general, nullable=False)

    created_by = Column(String(36), nullable=False)   # Keycloak UUID
    assigned_to = Column(String(36), nullable=True)   # Keycloak UUID

    color = Column(String(20), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
