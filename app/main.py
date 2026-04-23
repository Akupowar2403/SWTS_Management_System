from fastapi import FastAPI
from app.calendar.database import engine, Base
from app.calendar import models
from app.calendar.routers import router as calendar_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SWTS Management System", version="1.0.0")

app.include_router(calendar_router)


@app.get("/")
def root():
    return {"status": "SWTS API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}
