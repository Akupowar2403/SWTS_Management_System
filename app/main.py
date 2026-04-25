from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.calendar.database import engine, Base
from app.calendar import models
from app.Project import models as project_models  # registers project tables with Base
from app.calendar.routers import router as calendar_router, users_router
from app.Project.routers import router as project_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SWTS Management System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(calendar_router)
app.include_router(users_router)
app.include_router(project_router)


@app.get("/")
def root():
    return {"status": "SWTS API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}
