from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.calendar.database import get_db
from app.calendar.models import Event
from app.calendar.schemas import EventCreate, EventUpdate, EventResponse, TaskAssign
from app.auth.dependencies import get_current_user, require_role

router = APIRouter(prefix="/events", tags=["Events"])


@router.post("/", response_model=EventResponse, status_code=201)
async def create_event(
    payload: EventCreate,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = Event(**payload.model_dump(), created_by=user["id"])
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.get("/", response_model=List[EventResponse])
async def get_events(
    event_date: Optional[date] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Event).filter(
        (Event.created_by == user["id"]) | (Event.assigned_to == user["id"])
    )
    if event_date:
        query = query.filter(Event.event_date == event_date)
    elif start_date and end_date:
        query = query.filter(Event.event_date >= start_date, Event.event_date <= end_date)

    return query.order_by(Event.event_date, Event.start_time).all()


@router.post("/assign", response_model=EventResponse, status_code=201)
async def assign_task(
    payload: TaskAssign,
    user: dict = Depends(require_role("admin", "manager")),  # only admin/manager can assign
    db: Session = Depends(get_db),
):
    """Assign a task to another user. Requires admin or manager role."""
    event = Event(
        title=payload.title,
        description=payload.description,
        event_date=payload.event_date,
        start_time=payload.start_time,
        end_time=payload.end_time,
        event_type="task",
        created_by=user["id"],
        assigned_to=payload.assigned_to,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.get("/assigned-to-me", response_model=List[EventResponse])
async def get_tasks_assigned_to_me(
    order: str = "newest",
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """All tasks assigned TO the logged-in user by someone else."""
    query = db.query(Event).filter(
        Event.assigned_to == user["id"],
        Event.created_by != user["id"],
    )
    if order == "oldest":
        query = query.order_by(Event.event_date.asc(), Event.created_at.asc())
    else:
        query = query.order_by(Event.event_date.asc(), Event.created_at.desc())
    return query.all()


@router.get("/assigned-by-me", response_model=List[EventResponse])
async def get_tasks_assigned_by_me(
    order: str = "newest",
    user: dict = Depends(require_role("admin", "manager")),  # only admin/manager assign
    db: Session = Depends(get_db),
):
    """All tasks the logged-in user has assigned to others."""
    query = db.query(Event).filter(
        Event.created_by == user["id"],
        Event.assigned_to.isnot(None),
        Event.assigned_to != user["id"],
    )
    if order == "oldest":
        query = query.order_by(Event.event_date.asc(), Event.created_at.asc())
    else:
        query = query.order_by(Event.event_date.asc(), Event.created_at.desc())
    return query.all()


@router.get("/undated", response_model=List[EventResponse])
async def get_undated_events(
    order: str = "newest",
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Events with no date — always shown in task list sidebar."""
    query = db.query(Event).filter(
        (Event.created_by == user["id"]) | (Event.assigned_to == user["id"]),
        Event.event_date.is_(None),
    )
    if order == "oldest":
        query = query.order_by(Event.created_at.asc())
    else:
        query = query.order_by(Event.created_at.desc())
    return query.all()


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: int,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.created_by != user["id"] and event.assigned_to != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return event


@router.patch("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: int,
    payload: EventUpdate,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.created_by != user["id"] and event.assigned_to != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=204)
async def delete_event(
    event_id: int,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.created_by != user["id"] and event.assigned_to != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    db.delete(event)
    db.commit()
