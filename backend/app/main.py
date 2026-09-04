import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine
from app.config import UPLOAD_DIR, ALLOWED_ORIGINS
from app.routers import (
    auth, students, companies, jobs, applications, interviews,
    offers, assessments, announcements, notifications, analytics, faculty, users,
)

Base.metadata.create_all(bind=engine)
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="CampusFlow API",
    description="Campus placement operations platform for students, faculty, placement officers and recruiters.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(auth.router)
app.include_router(students.router)
app.include_router(companies.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(interviews.router)
app.include_router(offers.router)
app.include_router(assessments.router)
app.include_router(announcements.router)
app.include_router(notifications.router)
app.include_router(analytics.router)
app.include_router(faculty.router)
app.include_router(users.router)


@app.get("/")
def root():
    return {"message": "CampusFlow API is running", "docs": "/docs"}
