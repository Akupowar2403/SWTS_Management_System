"""
Test script for app/Project/models.py
Run from the repo root:  python test_project_models.py
"""
import sys
import os
from datetime import date

# Read .env manually and swap Docker hostname "db" -> "localhost" for local runs
_env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(_env_path):
    with open(_env_path) as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _k, _v = _line.split("=", 1)
                os.environ.setdefault(_k.strip(), _v.strip())
_url = os.environ.get("DATABASE_URL", "")
if "@db:" in _url:
    os.environ["DATABASE_URL"] = _url.replace("@db:", "@localhost:")

# ── bootstrap ────────────────────────────────────────────────────────────────
from app.calendar.database import engine, Base
from app.calendar import models as _cal_models          # keep calendar tables
from app.Project import models as pm                    # registers project tables
from app.Project.models import (
    ProjectStatus, Client, Developer, Project,
    ClientType, Citizenship, DeveloperType, ProfitType, CompanyName,
)
from sqlalchemy.orm import Session

PASS = "\033[92m[PASS]\033[0m"
FAIL = "\033[91m[FAIL]\033[0m"

errors = []


def check(label, condition, detail=""):
    if condition:
        print(f"{PASS} {label}")
    else:
        print(f"{FAIL} {label}  {detail}")
        errors.append(label)


# ── 1. Create tables ──────────────────────────────────────────────────────────
print("\n-- Creating tables --")
try:
    Base.metadata.create_all(bind=engine)
    print(f"{PASS} create_all() succeeded")
except Exception as e:
    print(f"{FAIL} create_all() raised: {e}")
    sys.exit(1)

# Verify expected tables exist in the DB
from sqlalchemy import inspect
inspector = inspect(engine)
existing = inspector.get_table_names()
for tbl in ("project_statuses", "clients", "developers", "projects"):
    check(f"table '{tbl}' exists", tbl in existing)

# ── 2. Seed & query ───────────────────────────────────────────────────────────
print("\n-- Seed data --")
with Session(engine) as db:

    # ProjectStatus
    status = ProjectStatus(name="In Touch", color="#FFA500")
    db.add(status)
    db.flush()
    check("ProjectStatus insert", status.id is not None)

    # Client
    client = Client(
        name="Acme Corp",
        contact_no="9999999999",
        email="acme@example.com",
        type=ClientType.enterprise,
        citizenship=Citizenship.indian,
        residential_address="Mumbai",
        description="Test client",
    )
    db.add(client)
    db.flush()
    check("Client insert", client.id is not None)

    # Developer
    dev = Developer(
        name="Alice Dev",
        contact_no="8888888888",
        email="alice@example.com",
        type=DeveloperType.individual,
        residential_address="Pune",
        description="Full-stack developer",
        default_profit_sharing_percentage=40.0,
        tds_percentage=10.0,
    )
    db.add(dev)
    db.flush()
    check("Developer insert", dev.id is not None)

    # Project
    project = Project(
        project_name="Test Project Alpha",
        client_id=client.id,
        developer_id=dev.id,
        status_id=status.id,
        company_name=CompanyName.swts,
        profit_type=ProfitType.percentage,
        company_profit_value=60.0,
        developer_profit_value=40.0,
        show_ppp=False,
        start_date=date.today(),
        timeline_days=30,
        deadline=date(2026, 5, 25),
        description="Integration test project",
        created_by="test-keycloak-uuid-0000",
    )
    db.add(project)
    db.flush()
    check("Project insert", project.id is not None)

    db.commit()
    proj_id = project.id
    client_id = client.id
    dev_id = dev.id
    status_id = status.id

# ── 3. Query & relationships ──────────────────────────────────────────────────
print("\n-- Query & relationships --")
with Session(engine) as db:
    p = db.query(Project).filter(Project.id == proj_id).first()
    check("Project query by id", p is not None)
    check("Project.project_name", p.project_name == "Test Project Alpha")
    check("Project.client relationship", p.client is not None and p.client.name == "Acme Corp")
    check("Project.developer relationship", p.developer is not None and p.developer.name == "Alice Dev")
    check("Project.status relationship", p.status is not None and p.status.name == "In Touch")
    check("Project.show_ppp default False", p.show_ppp is False)
    check("Project.deadline stored", p.deadline == date(2026, 5, 25))

    # Toggle show_ppp
    p.show_ppp = True
    db.commit()
    db.refresh(p)
    check("Project.show_ppp toggled True", p.show_ppp is True)

    # Search clients by name (case-insensitive)
    results = db.query(Client).filter(Client.name.ilike("%acme%")).all()
    check("Client search by name", len(results) == 1)

    # List statuses
    statuses = db.query(ProjectStatus).all()
    check("ProjectStatus list", any(s.name == "In Touch" for s in statuses))

# ── 4. Cleanup ────────────────────────────────────────────────────────────────
print("\n-- Cleanup --")
with Session(engine) as db:
    db.query(Project).filter(Project.id == proj_id).delete()
    db.query(Client).filter(Client.id == client_id).delete()
    db.query(Developer).filter(Developer.id == dev_id).delete()
    db.query(ProjectStatus).filter(ProjectStatus.id == status_id).delete()
    db.commit()
    check("Cleanup deleted all test rows", True)

# ── Result ─────────────────────────────────────────────────────────────────────
print()
if errors:
    print(f"\033[91m{len(errors)} check(s) FAILED:\033[0m {errors}")
    sys.exit(1)
else:
    print("\033[92mAll checks passed.\033[0m")
