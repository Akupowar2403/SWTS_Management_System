from sqlalchemy import (
    Column, Integer, String, Text, Date, DateTime, Float, Boolean,
    Enum as SAEnum, ForeignKey
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.calendar.database import Base


class ClientType(str, enum.Enum):
    individual = "individual"
    enterprise = "enterprise"


class Citizenship(str, enum.Enum):
    indian = "Indian"
    foreign = "Foreign"


class DeveloperType(str, enum.Enum):
    individual = "individual"
    enterprise = "enterprise"


class ProfitType(str, enum.Enum):
    percentage = "percentage"
    amount = "amount"


class CompanyName(str, enum.Enum):
    swts = "SWTS"
    swts_pvt_ltd = "SWTS Pvt. Ltd."


class ProjectStatus(Base):
    __tablename__ = "project_statuses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    color = Column(String(20), nullable=False, default="#808080")

    projects = relationship("Project", back_populates="status")


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    contact_no = Column(String(20), nullable=False)
    email = Column(String(255), nullable=False)
    type = Column(SAEnum(ClientType), nullable=False)
    citizenship = Column(SAEnum(Citizenship), nullable=False)
    residential_address = Column(Text, nullable=True)
    description = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    projects = relationship("Project", back_populates="client")


class Developer(Base):
    __tablename__ = "developers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    contact_no = Column(String(20), nullable=False)
    email = Column(String(255), nullable=False)
    type = Column(SAEnum(DeveloperType), nullable=False)
    residential_address = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    default_profit_sharing_percentage = Column(Float, nullable=True)
    tds_percentage = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    projects = relationship("Project", back_populates="developer")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    project_name = Column(String(255), nullable=False)

    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    client_name = Column(String(255), nullable=True)       # free-text override (e.g. new/unnamed client)

    developer_id = Column(Integer, ForeignKey("developers.id"), nullable=True)
    developer_name = Column(String(255), nullable=True)    # free-text override (e.g. freelancer)

    status_id = Column(Integer, ForeignKey("project_statuses.id"), nullable=True)

    company_name = Column(SAEnum(CompanyName), nullable=True)

    profit_type = Column(SAEnum(ProfitType), default=ProfitType.percentage, nullable=False)
    company_profit_value = Column(Float, nullable=True)
    developer_profit_value = Column(Float, nullable=True)
    show_ppp = Column(Boolean, default=False, nullable=False)

    start_date = Column(Date, nullable=True)
    timeline_days = Column(Integer, nullable=True)
    deadline = Column(Date, nullable=True)

    description = Column(Text, nullable=True)
    created_by = Column(String(36), nullable=False)  # Keycloak UUID

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    client = relationship("Client", back_populates="projects")
    developer = relationship("Developer", back_populates="projects")
    status = relationship("ProjectStatus", back_populates="projects")
