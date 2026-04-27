from pydantic import BaseModel, model_validator
from typing import Optional
from datetime import date, datetime
from app.Project.models import ClientType, Citizenship, DeveloperType, ProfitType, CompanyName


# ── LeadSource ────────────────────────────────────────────────────────────────

class LeadSourceCreate(BaseModel):
    name: str


class LeadSourceResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


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
    lead_source_id: Optional[int] = None
    status_id: Optional[int] = None
    company_name: Optional[CompanyName] = None
    is_inhouse_developer: bool = False
    profit_type: ProfitType = ProfitType.percentage
    company_profit_value: Optional[float] = None
    developer_profit_value: Optional[float] = None
    start_date: Optional[date] = None
    timeline_days: Optional[int] = None
    deadline: Optional[date] = None
    description: Optional[str] = None

    @model_validator(mode="after")
    def profit_must_sum_to_100(self) -> "ProjectCreate":
        if self.is_inhouse_developer:
            return self
        if self.profit_type == ProfitType.percentage:
            c = self.company_profit_value
            d = self.developer_profit_value
            if c is not None and d is not None and abs(c + d - 100) > 0.01:
                raise ValueError("Company and developer profit percentages must sum to 100%")
        return self


class ProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    client_id: Optional[int] = None
    client_name: Optional[str] = None
    developer_id: Optional[int] = None
    developer_name: Optional[str] = None
    lead_source_id: Optional[int] = None
    status_id: Optional[int] = None
    company_name: Optional[CompanyName] = None
    is_inhouse_developer: Optional[bool] = None
    profit_type: Optional[ProfitType] = None
    company_profit_value: Optional[float] = None
    developer_profit_value: Optional[float] = None
    show_ppp: Optional[bool] = None
    start_date: Optional[date] = None
    timeline_days: Optional[int] = None
    deadline: Optional[date] = None
    description: Optional[str] = None

    @model_validator(mode="after")
    def profit_must_sum_to_100(self) -> "ProjectUpdate":
        if self.is_inhouse_developer:
            return self
        pt = self.profit_type
        c = self.company_profit_value
        d = self.developer_profit_value
        if pt == ProfitType.percentage and c is not None and d is not None:
            if abs(c + d - 100) > 0.01:
                raise ValueError("Company and developer profit percentages must sum to 100%")
        return self


class ProjectResponse(BaseModel):
    id: int
    project_name: str
    client_id: Optional[int]
    client_name: Optional[str]
    developer_id: Optional[int]
    developer_name: Optional[str]
    lead_source_id: Optional[int]
    status_id: Optional[int]
    company_name: Optional[CompanyName]
    is_inhouse_developer: bool
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

    # nested for display
    client: Optional[ClientResponse] = None
    developer: Optional[DeveloperResponse] = None
    status: Optional[ProjectStatusResponse] = None
    lead_source: Optional[LeadSourceResponse] = None

    class Config:
        from_attributes = True
