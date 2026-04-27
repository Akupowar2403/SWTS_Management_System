from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import timedelta, date as date_type

from app.calendar.database import get_db
from app.Project.models import Project, ProjectStatus, Client, Developer, LeadSource, ProjectComment
from app.Project.schemas import (
    ProjectCreate, ProjectResponse, ProjectUpdate,
    ProjectStatusUpdate, ProjectStatusResponse,
    ClientCreate, ClientResponse,
    DeveloperCreate, DeveloperResponse,
    LeadSourceResponse,
    CommentCreate, CommentUpdate, CommentResponse,
)
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("/lead-sources", response_model=List[LeadSourceResponse])
async def list_lead_sources(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    return db.query(LeadSource).order_by(LeadSource.name).all()


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


@router.post("/clients", response_model=ClientResponse, status_code=201)
async def create_client(
    payload: ClientCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    client = Client(**payload.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


@router.post("/developers", response_model=DeveloperResponse, status_code=201)
async def create_developer(
    payload: DeveloperCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    developer = Developer(**payload.model_dump())
    db.add(developer)
    db.commit()
    db.refresh(developer)
    return developer


@router.get("/statuses", response_model=List[ProjectStatusResponse])
async def list_statuses(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    return db.query(ProjectStatus).order_by(ProjectStatus.name).all()


@router.post("/", response_model=ProjectResponse, status_code=201)
async def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    data = payload.model_dump()

    # auto-set start_date to today if not provided
    if not data.get("start_date"):
        data["start_date"] = date_type.today()

    # auto-calculate deadline from start_date + timeline_days
    if data.get("start_date") and data.get("timeline_days") and not data.get("deadline"):
        data["deadline"] = data["start_date"] + timedelta(days=data["timeline_days"])

    # set default status to "In Touch" if not provided
    if not data.get("status_id"):
        default_status = db.query(ProjectStatus).filter(
            ProjectStatus.name.ilike("in touch")
        ).first()
        if default_status:
            data["status_id"] = default_status.id

    data["created_by"] = user["id"]
    project = Project(**data)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


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


# ── Comments ──────────────────────────────────────────────────────────────────

@router.get("/{project_id}/comments", response_model=List[CommentResponse])
async def list_comments(
    project_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    if not db.query(Project).filter(Project.id == project_id).first():
        raise HTTPException(status_code=404, detail="Project not found")
    return (
        db.query(ProjectComment)
        .filter(ProjectComment.project_id == project_id)
        .order_by(ProjectComment.commented_at.desc())
        .all()
    )


@router.post("/{project_id}/comments", response_model=CommentResponse, status_code=201)
async def create_comment(
    project_id: int,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    if not db.query(Project).filter(Project.id == project_id).first():
        raise HTTPException(status_code=404, detail="Project not found")
    comment = ProjectComment(
        project_id=project_id,
        body=payload.body,
        commented_at=payload.commented_at,
        created_by=user["id"],
        author_name=user.get("name") or user.get("preferred_username") or user["id"],
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.patch("/{project_id}/comments/{comment_id}", response_model=CommentResponse)
async def update_comment(
    project_id: int,
    comment_id: int,
    payload: CommentUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    comment = (
        db.query(ProjectComment)
        .filter(ProjectComment.id == comment_id, ProjectComment.project_id == project_id)
        .first()
    )
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.created_by != user["id"]:
        raise HTTPException(status_code=403, detail="You can only edit your own comments")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(comment, field, value)
    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/{project_id}/comments/{comment_id}", status_code=204)
async def delete_comment(
    project_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    comment = (
        db.query(ProjectComment)
        .filter(ProjectComment.id == comment_id, ProjectComment.project_id == project_id)
        .first()
    )
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.created_by != user["id"]:
        raise HTTPException(status_code=403, detail="You can only delete your own comments")
    db.delete(comment)
    db.commit()
