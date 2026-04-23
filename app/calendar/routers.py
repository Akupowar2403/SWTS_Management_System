from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.calendar.database import get_db
from app.calendar.models import Event
from app.calendar.schemas import EventCreate, EventUpdate, EventResponse, TaskAssign

router = APIRouter(prefix="/events", tags=["Events"])


@router.post("/", response_model=EventResponse, status_code=201)
def create_event(payload: EventCreate, db: Session = Depends(get_db)):
    event = Event(**payload.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.get("/", response_model=List[EventResponse])
def get_events(
    user_id: int,
    event_date: Optional[date] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Event).filter(
        (Event.created_by == user_id) | (Event.assigned_to == user_id)
    )
    if event_date:
        query = query.filter(Event.event_date == event_date)
    elif start_date and end_date:
        query = query.filter(Event.event_date >= start_date, Event.event_date <= end_date)

    return query.order_by(Event.event_date, Event.start_time).all()


@router.post("/assign", response_model=EventResponse, status_code=201)
def assign_task(payload: TaskAssign, db: Session = Depends(get_db)):
    """Assign a task to another user with optional date & time."""
    event = Event(
        title=payload.title,
        description=payload.description,
        event_date=payload.event_date,
        start_time=payload.start_time,
        end_time=payload.end_time,
        event_type="task",
        created_by=payload.created_by,
        assigned_to=payload.assigned_to,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.get("/assigned-to-me", response_model=List[EventResponse])
def get_tasks_assigned_to_me(
    user_id: int,
    order: str = "newest",
    db: Session = Depends(get_db),
):
    """All tasks assigned TO this user by someone else."""
    query = db.query(Event).filter(
        Event.assigned_to == user_id,
        Event.created_by != user_id,
    )
    if order == "oldest":
        query = query.order_by(Event.event_date.asc(), Event.created_at.asc())
    else:
        query = query.order_by(Event.event_date.asc(), Event.created_at.desc())
    return query.all()


@router.get("/assigned-by-me", response_model=List[EventResponse])
def get_tasks_assigned_by_me(
    user_id: int,
    order: str = "newest",
    db: Session = Depends(get_db),
):
    """All tasks this user has assigned to others."""
    query = db.query(Event).filter(
        Event.created_by == user_id,
        Event.assigned_to != None,
        Event.assigned_to != user_id,
    )
    if order == "oldest":
        query = query.order_by(Event.event_date.asc(), Event.created_at.asc())
    else:
        query = query.order_by(Event.event_date.asc(), Event.created_at.desc())
    return query.all()


@router.get("/undated", response_model=List[EventResponse])
def get_undated_events(
    user_id: int,
    order: str = "newest",
    db: Session = Depends(get_db),
):
    """
    Get all events with no date — always shown in task list.
    - ?order=newest  → latest created first (default)
    - ?order=oldest  → oldest created first
    """
    query = db.query(Event).filter(
        (Event.created_by == user_id) | (Event.assigned_to == user_id),
        Event.event_date == None,
    )

    if order == "oldest":
        query = query.order_by(Event.created_at.asc())
    else:
        query = query.order_by(Event.created_at.desc())

    return query.all()


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.patch("/{event_id}", response_model=EventResponse)
def update_event(event_id: int, payload: EventUpdate, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=204)
def delete_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
