"""
Migration: add lead_source_id to projects, create lead_sources table, seed default sources.
Run: python migrate_lead_sources.py
"""
import os
import pathlib

# load .env so DATABASE_URL points at localhost
env_path = pathlib.Path(__file__).parent / ".env"
if env_path.exists():
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())

# swap Docker hostname for local
db_url = os.environ.get("DATABASE_URL", "")
os.environ["DATABASE_URL"] = db_url.replace("@db:", "@localhost:")

import psycopg2

conn_str = os.environ["DATABASE_URL"].replace("postgresql+psycopg2://", "postgresql://")
conn = psycopg2.connect(conn_str)
conn.autocommit = True
cur = conn.cursor()

print("Creating lead_sources table...")
cur.execute("""
    CREATE TABLE IF NOT EXISTS lead_sources (
        id   SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
    );
""")

print("Adding lead_source_id to projects...")
cur.execute("""
    ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS lead_source_id INTEGER REFERENCES lead_sources(id);
""")

print("Seeding default lead sources...")
default_sources = [
    "Upwork", "LinkedIn", "Freelancer", "Fiverr",
    "Facebook", "Instagram", "Company Website",
]
for name in default_sources:
    cur.execute(
        "INSERT INTO lead_sources (name) VALUES (%s) ON CONFLICT (name) DO NOTHING;",
        (name,)
    )

cur.execute("SELECT id, name FROM lead_sources ORDER BY name;")
rows = cur.fetchall()
print(f"Lead sources in DB ({len(rows)}):")
for r in rows:
    print(f"  {r[0]:3}  {r[1]}")

cur.close()
conn.close()
print("Done.")
