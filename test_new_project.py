"""
Test: new project creation endpoint + DB verification
Run: python test_new_project.py
"""
import os, pathlib, sys
import requests
import psycopg2
from datetime import date, timedelta

# ── load .env ──────────────────────────────────────────────────────────────────
env_path = pathlib.Path(__file__).parent / ".env"
for line in env_path.read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, v = line.split("=", 1)
    os.environ.setdefault(k.strip(), v.strip())

API   = "http://localhost:8000"
KC    = "http://localhost:8080"
REALM = "swts-realm"
CLIENT_ID = "swts-app"
DB_URL = os.environ["DATABASE_URL"].replace("@db:", "@localhost:").replace("postgresql+psycopg2://", "postgresql://")

PASS  = "test1234"   # set by previous test session

# ── helpers ────────────────────────────────────────────────────────────────────
ok = 0
fail = 0

def check(label, condition, detail=""):
    global ok, fail
    if condition:
        print(f"  [PASS] {label}")
        ok += 1
    else:
        print(f"  [FAIL] {label}" + (f" -- {detail}" if detail else ""))
        fail += 1

def header(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)

# ── get token ──────────────────────────────────────────────────────────────────
header("AUTH")
token_resp = requests.post(
    f"{KC}/realms/{REALM}/protocol/openid-connect/token",
    data={"client_id": CLIENT_ID, "grant_type": "password",
          "username": "aku", "password": PASS},
    timeout=10,
)
check("Keycloak token obtained", token_resp.status_code == 200,
      token_resp.text[:200])
if token_resp.status_code != 200:
    print("Cannot continue without a token.")
    sys.exit(1)

token = token_resp.json()["access_token"]
H = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# ── DB connection ──────────────────────────────────────────────────────────────
conn = psycopg2.connect(DB_URL)
conn.autocommit = True
cur = conn.cursor()

def db_fetch(sql, params=()):
    cur.execute(sql, params)
    return cur.fetchall()

def db_one(sql, params=()):
    cur.execute(sql, params)
    return cur.fetchone()

# ── TEST 1: minimal project (name only) ───────────────────────────────────────
header("TEST 1 -- Minimal project (name only)")
r = requests.post(f"{API}/projects/", json={"project_name": "Minimal Test Project"}, headers=H)
check("POST /projects/ returns 201", r.status_code == 201, r.text[:300])

if r.status_code == 201:
    d = r.json()
    check("id is auto-generated integer", isinstance(d["id"], int) and d["id"] > 0)
    check("project_name saved correctly", d["project_name"] == "Minimal Test Project")
    check("start_date defaults to today", d["start_date"] == str(date.today()))
    check("deadline is None (no timeline)", d["deadline"] is None)
    check("status defaults to In Touch", d.get("status") and d["status"]["name"] == "In Touch",
          str(d.get("status")))
    check("profit_type defaults to percentage", d["profit_type"] == "percentage")
    check("show_ppp defaults to False", d["show_ppp"] == False)
    check("created_by is a UUID string", isinstance(d["created_by"], str) and len(d["created_by"]) == 36)

    proj1_id = d["id"]
    row = db_one("SELECT project_name, start_date, status_id, created_by FROM projects WHERE id=%s", (proj1_id,))
    check("Row exists in DB", row is not None)
    if row:
        check("DB: project_name matches", row[0] == "Minimal Test Project")
        check("DB: start_date is today", str(row[1]) == str(date.today()))
        check("DB: status_id is set", row[2] is not None)
        check("DB: created_by is set", row[3] is not None)

# ── TEST 2: project with timeline (auto deadline) ─────────────────────────────
header("TEST 2 -- Auto deadline from timeline")
r = requests.post(f"{API}/projects/", json={
    "project_name": "Timeline Test Project",
    "start_date": "2026-05-01",
    "timeline_days": 45,
}, headers=H)
check("POST /projects/ returns 201", r.status_code == 201, r.text[:300])

if r.status_code == 201:
    d = r.json()
    expected_deadline = str(date(2026, 5, 1) + timedelta(days=45))
    check("deadline = start + 45 days", d["deadline"] == expected_deadline,
          f"got {d['deadline']} expected {expected_deadline}")
    check("timeline_days saved", d["timeline_days"] == 45)
    check("start_date saved", d["start_date"] == "2026-05-01")

    row = db_one("SELECT deadline, timeline_days FROM projects WHERE id=%s", (d["id"],))
    check("DB: deadline stored correctly", row and str(row[0]) == expected_deadline)
    check("DB: timeline_days stored", row and row[1] == 45)

# ── TEST 3: create new client then link to project ────────────────────────────
header("TEST 3 -- New client creation + link to project")
client_r = requests.post(f"{API}/projects/clients", json={
    "name": "Test Client Corp",
    "contact_no": "9876543210",
    "email": "testclient@example.com",
    "type": "enterprise",
    "citizenship": "Indian",
    "residential_address": "123 Test St, Mumbai",
    "description": "Test client for project creation test",
}, headers=H)
check("POST /projects/clients returns 201", client_r.status_code == 201, client_r.text[:300])

if client_r.status_code == 201:
    client_id = client_r.json()["id"]
    check("client id returned", isinstance(client_id, int) and client_id > 0)

    row = db_one("SELECT name, email, type FROM clients WHERE id=%s", (client_id,))
    check("DB: client row exists", row is not None)
    if row:
        check("DB: client name correct", row[0] == "Test Client Corp")
        check("DB: client email correct", row[1] == "testclient@example.com")

    # now create project with this client
    r = requests.post(f"{API}/projects/", json={
        "project_name": "Project With Client",
        "client_id": client_id,
    }, headers=H)
    check("POST /projects/ with client_id returns 201", r.status_code == 201, r.text[:300])

    if r.status_code == 201:
        d = r.json()
        check("client_id linked in response", d["client_id"] == client_id)
        check("nested client.name in response", d.get("client") and d["client"]["name"] == "Test Client Corp",
              str(d.get("client")))

        row = db_one("SELECT client_id FROM projects WHERE id=%s", (d["id"],))
        check("DB: client_id FK stored", row and row[0] == client_id)

# ── TEST 4: create new developer then link to project ─────────────────────────
header("TEST 4 -- New developer creation + link to project")
dev_r = requests.post(f"{API}/projects/developers", json={
    "name": "Test Developer",
    "contact_no": "9123456789",
    "email": "devtest@example.com",
    "type": "individual",
    "residential_address": "456 Dev Lane, Pune",
    "description": "Test developer",
    "default_profit_sharing_percentage": 30.0,
    "tds_percentage": 10.0,
}, headers=H)
check("POST /projects/developers returns 201", dev_r.status_code == 201, dev_r.text[:300])

if dev_r.status_code == 201:
    dev_id = dev_r.json()["id"]
    check("developer id returned", isinstance(dev_id, int) and dev_id > 0)

    row = db_one("SELECT name, default_profit_sharing_percentage, tds_percentage FROM developers WHERE id=%s", (dev_id,))
    check("DB: developer row exists", row is not None)
    if row:
        check("DB: developer name correct", row[0] == "Test Developer")
        check("DB: profit sharing % stored", row[1] == 30.0)
        check("DB: tds % stored", row[2] == 10.0)

    r = requests.post(f"{API}/projects/", json={
        "project_name": "Project With Developer",
        "developer_id": dev_id,
    }, headers=H)
    check("POST /projects/ with developer_id returns 201", r.status_code == 201, r.text[:300])

    if r.status_code == 201:
        d = r.json()
        check("developer_id linked in response", d["developer_id"] == dev_id)
        check("nested developer.name in response",
              d.get("developer") and d["developer"]["name"] == "Test Developer",
              str(d.get("developer")))

# ── TEST 5: full project with all fields ──────────────────────────────────────
header("TEST 5 -- Full project (all fields)")
# get a real lead_source_id
sources = requests.get(f"{API}/projects/lead-sources", headers=H).json()
check("lead sources exist", len(sources) > 0)
source_id = sources[0]["id"] if sources else None

statuses = requests.get(f"{API}/projects/statuses", headers=H).json()
check("statuses exist", len(statuses) > 0)
status_id = next((s["id"] for s in statuses if s["name"] == "In Progress"), statuses[0]["id"] if statuses else None)

r = requests.post(f"{API}/projects/", json={
    "project_name": "Full Details Project",
    "client_name": "Freelance Client",     # free-text client
    "developer_name": "Freelance Dev",     # free-text developer
    "lead_source_id": source_id,
    "status_id": status_id,
    "company_name": "SWTS",
    "profit_type": "percentage",
    "company_profit_value": 70.0,
    "developer_profit_value": 30.0,
    "start_date": "2026-06-01",
    "timeline_days": 60,
    "description": "Full project test",
}, headers=H)
check("POST /projects/ full payload returns 201", r.status_code == 201, r.text[:300])

if r.status_code == 201:
    d = r.json()
    check("project_name correct", d["project_name"] == "Full Details Project")
    check("client_name (free text) saved", d["client_name"] == "Freelance Client")
    check("developer_name (free text) saved", d["developer_name"] == "Freelance Dev")
    check("lead_source_id saved", d["lead_source_id"] == source_id)
    check("lead_source nested object present", d.get("lead_source") is not None)
    check("company_name saved", d["company_name"] == "SWTS")
    check("company_profit_value saved", d["company_profit_value"] == 70.0)
    check("developer_profit_value saved", d["developer_profit_value"] == 30.0)
    check("deadline auto-calculated",
          d["deadline"] == str(date(2026, 6, 1) + timedelta(days=60)))

    proj_id = d["id"]
    row = db_one("""
        SELECT project_name, client_name, developer_name, lead_source_id,
               company_name, profit_type, company_profit_value, developer_profit_value,
               start_date, timeline_days, deadline, description
        FROM projects WHERE id=%s
    """, (proj_id,))
    check("DB: full row exists", row is not None)
    if row:
        check("DB: project_name", row[0] == "Full Details Project")
        check("DB: client_name (free text)", row[1] == "Freelance Client")
        check("DB: developer_name (free text)", row[2] == "Freelance Dev")
        check("DB: lead_source_id FK", row[3] == source_id)
        check("DB: company_name", row[4] == "swts")  # SQLAlchemy stores enum key, API serializes to value
        check("DB: profit_type", row[5] == "percentage")
        check("DB: company_profit_value", row[6] == 70.0)
        check("DB: developer_profit_value", row[7] == 30.0)
        check("DB: timeline_days", row[9] == 60)
        check("DB: deadline", str(row[10]) == str(date(2026, 6, 1) + timedelta(days=60)))
        check("DB: description", row[11] == "Full project test")

# ── TEST 6: GET /projects/ list includes new projects ─────────────────────────
header("TEST 6 -- GET /projects/ list")
r = requests.get(f"{API}/projects/", headers=H)
check("GET /projects/ returns 200", r.status_code == 200)
if r.status_code == 200:
    projects = r.json()
    check("Response is a list", isinstance(projects, list))
    names = [p["project_name"] for p in projects]
    check("Minimal project in list", "Minimal Test Project" in names)
    check("Full project in list", "Full Details Project" in names)
    check("All have id, project_name, status fields",
          all("id" in p and "project_name" in p for p in projects))

# ── TEST 7: GET /projects/{id} returns correct data ───────────────────────────
header("TEST 7 -- GET /projects/{id}")
all_r = requests.get(f"{API}/projects/", headers=H)
if all_r.status_code == 200:
    full_proj = next((p for p in all_r.json() if p["project_name"] == "Full Details Project"), None)
    if full_proj:
        r = requests.get(f"{API}/projects/{full_proj['id']}", headers=H)
        check("GET /projects/{id} returns 200", r.status_code == 200)
        if r.status_code == 200:
            d = r.json()
            check("id matches", d["id"] == full_proj["id"])
            check("project_name matches", d["project_name"] == "Full Details Project")
            check("lead_source nested present", d.get("lead_source") is not None)
            check("status nested present", d.get("status") is not None)

# ── summary ───────────────────────────────────────────────────────────────────
cur.close()
conn.close()
print(f"\n{'='*60}")
print(f"  RESULTS: {ok} passed, {fail} failed")
print('='*60)
if fail > 0:
    sys.exit(1)
