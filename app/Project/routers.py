from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.calendar.database import get_db
from app.Project.models import Project, ProjectStatus, Client, Developer
from app.Project.schemas import (
    ProjectResponse, ProjectUpdate,
    ProjectStatusUpdate, ProjectStatusResponse,
    ClientResponse, DeveloperResponse,
)
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("/clients", response_model=List[ClientResponse])
async def list_clients(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    query = db.query(Client)
    if search:
        query = query.filter(Client.name.ilike(f"%{search}%"))
    return query.order_by(Client.name).limit(50).all()


@router.get("/developers", response_model=List[DeveloperResponse])
async def list_developers(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    query = db.query(Developer)
    if search:
        query = query.filter(Developer.name.ilike(f"%{search}%"))
    return query.order_by(Developer.name).limit(50).all()


@router.get("/statuses", response_model=List[ProjectStatusResponse])
async def list_statuses(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    return db.query(ProjectStatus).order_by(ProjectStatus.name).all()


@router.get("/", response_model=List[ProjectResponse])
async def list_projects(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    return db.query(Project).order_by(Project.created_at.desc()).all()


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    from datetime import timedelta
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    # recalculate deadline if timeline changed
    if project.start_date and project.timeline_days and "deadline" not in payload.model_dump(exclude_unset=True):
        project.deadline = project.start_date + timedelta(days=project.timeline_days)
    db.commit()
    db.refresh(project)
    return project


@router.patch("/{project_id}/status", response_model=ProjectResponse)
async def update_status(
    project_id: int,
    payload: ProjectStatusUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if payload.status_id is not None:
        status = db.query(ProjectStatus).filter(ProjectStatus.id == payload.status_id).first()
        if not status:
            raise HTTPException(status_code=404, detail="Status not found")
        project.status_id = payload.status_id
    db.commit()
    db.refresh(project)
    return project


@router.patch("/{project_id}/toggle-ppp", response_model=ProjectResponse)
async def toggle_ppp(
    project_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.show_ppp = not project.show_ppp
    db.commit()
    db.refresh(project)
    return project
