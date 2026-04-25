"""
Seed mock project data for frontend development.
Run from repo root:  python seed_projects.py
Safe to re-run — skips rows that already exist.
"""
import os, sys
from datetime import date

# swap Docker hostname for local run
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

from app.calendar.database import engine, Base
from app.calendar import models as _cal
from app.Project import models as _proj
from app.Project.models import (
    ProjectStatus, Client, Developer, Project,
    ClientType, Citizenship, DeveloperType, ProfitType, CompanyName,
)
from sqlalchemy.orm import Session

Base.metadata.create_all(bind=engine)

MOCK_USER_ID = "mock-keycloak-uuid-seed-0001"

with Session(engine) as db:

    # ── Statuses ──────────────────────────────────────────────────────────────
    status_data = [
        ("In Touch",    "#3B82F6"),
        ("In Progress", "#F59E0B"),
        ("Completed",   "#10B981"),
        ("On Hold",     "#6B7280"),
        ("Cancelled",   "#EF4444"),
    ]
    statuses = {}
    for name, color in status_data:
        s = db.query(ProjectStatus).filter(ProjectStatus.name == name).first()
        if not s:
            s = ProjectStatus(name=name, color=color)
            db.add(s)
            db.flush()
            print(f"  + Status: {name}")
        statuses[name] = s

    # ── Clients ───────────────────────────────────────────────────────────────
    client_data = [
        ("Rajesh Sharma",   "9876543210", "rajesh@example.com",  ClientType.individual, Citizenship.indian),
        ("TechCorp Ltd",    "9123456780", "contact@techcorp.com", ClientType.enterprise, Citizenship.indian),
        ("John Miller",     "0019998887", "john@miller.us",       ClientType.individual, Citizenship.foreign),
        ("Global Ventures", "0017775556", "info@globalv.com",     ClientType.enterprise, Citizenship.foreign),
        ("Priya Nair",      "9988776655", "priya@nair.in",        ClientType.individual, Citizenship.indian),
    ]
    clients = []
    for name, contact, email, ctype, citizenship in client_data:
        c = db.query(Client).filter(Client.email == email).first()
        if not c:
            c = Client(name=name, contact_no=contact, email=email,
                       type=ctype, citizenship=citizenship)
            db.add(c)
            db.flush()
            print(f"  + Client: {name}")
        clients.append(c)

    # ── Developers ────────────────────────────────────────────────────────────
    dev_data = [
        ("Amit Patel",   "9111222333", "amit@swts.in",    DeveloperType.individual, 40.0, 10.0),
        ("Sara Khan",    "9222333444", "sara@swts.in",    DeveloperType.individual, 35.0,  5.0),
        ("Dev Solutions","9333444555", "dev@solutions.in",DeveloperType.enterprise, 50.0,  2.0),
    ]
    developers = []
    for name, contact, email, dtype, profit_pct, tds in dev_data:
        d = db.query(Developer).filter(Developer.email == email).first()
        if not d:
            d = Developer(
                name=name, contact_no=contact, email=email, type=dtype,
                residential_address="Pune, India", description="SWTS developer",
                default_profit_sharing_percentage=profit_pct, tds_percentage=tds,
            )
            db.add(d)
            db.flush()
            print(f"  + Developer: {name}")
        developers.append(d)

    # ── Projects ──────────────────────────────────────────────────────────────
    project_data = [
        ("E-Commerce Website",   clients[0], developers[0], statuses["In Progress"], date(2026, 3, 1),  45, CompanyName.swts,         60.0, 40.0, False),
        ("CRM Dashboard",        clients[1], developers[1], statuses["Completed"],   date(2026, 1, 15), 30, CompanyName.swts_pvt_ltd,  55.0, 45.0, True),
        ("Mobile Banking App",   clients[2], developers[2], statuses["In Touch"],    date(2026, 4, 10), 90, CompanyName.swts,          70.0, 30.0, False),
        ("HR Management System", clients[3], developers[0], statuses["On Hold"],     date(2026, 2, 1),  60, CompanyName.swts_pvt_ltd,  65.0, 35.0, False),
        ("Portfolio Website",    clients[4], developers[1], statuses["Completed"],   date(2026, 1, 5),  15, CompanyName.swts,          80.0, 20.0, True),
        ("Inventory Tracker",    clients[0], developers[2], statuses["In Progress"], date(2026, 3, 20), 20, CompanyName.swts,          60.0, 40.0, False),
        ("School ERP",           clients[1], developers[0], statuses["Cancelled"],   date(2025, 12, 1), 90, CompanyName.swts_pvt_ltd,  50.0, 50.0, False),
    ]

    from datetime import timedelta
    for (pname, client, dev, status, start, days,
         company, co_profit, dev_profit, show_ppp) in project_data:
        exists = db.query(Project).filter(Project.project_name == pname).first()
        if not exists:
            p = Project(
                project_name=pname,
                client_id=client.id,
                developer_id=dev.id,
                status_id=status.id,
                company_name=company,
                profit_type=ProfitType.percentage,
                company_profit_value=co_profit,
                developer_profit_value=dev_profit,
                show_ppp=show_ppp,
                start_date=start,
                timeline_days=days,
                deadline=start + timedelta(days=days),
                description=f"Mock project: {pname}",
                created_by=MOCK_USER_ID,
            )
            db.add(p)
            print(f"  + Project: {pname}")

    db.commit()

print("\nSeed complete.")
