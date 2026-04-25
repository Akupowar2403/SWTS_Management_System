from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.Project.models import ClientType, Citizenship, DeveloperType, ProfitType, CompanyName


# ── ProjectStatus ─────────────────────────────────────────────────────────────

class ProjectStatusCreate(BaseModel):
    name: str
    color: str = "#808080"


class ProjectStatusUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    status_id: Optional[int] = None  # used when changing a project's status


class ProjectStatusResponse(BaseModel):
    id: int
    name: str
    color: str

    class Config:
        from_attributes = True


# ── Client ────────────────────────────────────────────────────────────────────

class ClientCreate(BaseModel):
    name: str
    contact_no: str
    email: str
    type: ClientType
    citizenship: Citizenship
    residential_address: Optional[str] = None
    description: Optional[str] = None


class ClientResponse(BaseModel):
    id: int
    name: str
    contact_no: str
    email: str
    type: ClientType
    citizenship: Citizenship
    residential_address: Optional[str]
    description: Optional[str]

    class Config:
        from_attributes = True


# ── Developer ─────────────────────────────────────────────────────────────────

class DeveloperCreate(BaseModel):
    name: str
    contact_no: str
    email: str
    type: DeveloperType
    residential_address: str
    description: str
    default_profit_sharing_percentage: Optional[float] = None
    tds_percentage: Optional[float] = None


class DeveloperResponse(BaseModel):
    id: int
    name: str
    contact_no: str
    email: str
    type: DeveloperType
    residential_address: str
    description: str
    default_profit_sharing_percentage: Optional[float]
    tds_percentage: Optional[float]

    class Config:
        from_attributes = True


# ── Project ───────────────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    project_name: str
    client_id: Optional[int] = None
    client_name: Optional[str] = None
    developer_id: Optional[int] = None
    developer_name: Optional[str] = None
    status_id: Optional[int] = None
    company_name: Optional[CompanyName] = None
    profit_type: ProfitType = ProfitType.percentage
    company_profit_value: Optional[float] = None
    developer_profit_value: Optional[float] = None
    start_date: Optional[date] = None
    timeline_days: Optional[int] = None
    deadline: Optional[date] = None
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    client_id: Optional[int] = None
    client_name: Optional[str] = None
    developer_id: Optional[int] = None
    developer_name: Optional[str] = None
    status_id: Optional[int] = None
    company_name: Optional[CompanyName] = None
    profit_type: Optional[ProfitType] = None
    company_profit_value: Optional[float] = None
    developer_profit_value: Optional[float] = None
    show_ppp: Optional[bool] = None
    start_date: Optional[date] = None
    timeline_days: Optional[int] = None
    deadline: Optional[date] = None
    description: Optional[str] = None


class ProjectResponse(BaseModel):
    id: int
    project_name: str
    client_id: Optional[int]
    client_name: Optional[str]
    developer_id: Optional[int]
    developer_name: Optional[str]
    status_id: Optional[int]
    company_name: Optional[CompanyName]
    profit_type: ProfitType
    company_profit_value: Optional[float]
    developer_profit_value: Optional[float]
    show_ppp: bool
    start_date: Optional[date]
    timeline_days: Optional[int]
    deadline: Optional[date]
    description: Optional[str]
    created_by: str
    created_at: datetime

    # nested for table display
    client: Optional[ClientResponse] = None
    developer: Optional[DeveloperResponse] = None
    status: Optional[ProjectStatusResponse] = None

    class Config:
        from_attributes = True
