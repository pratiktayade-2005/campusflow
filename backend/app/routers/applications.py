from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_roles
from app.routers.jobs import is_eligible
from app import models, schemas

router = APIRouter(prefix="/applications", tags=["applications"])

VALID_STATUSES = {"APPLIED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEWING", "OFFERED", "REJECTED", "WITHDRAWN"}


def notify(db: Session, user_id, title: str, body: str):
    db.add(models.Notification(user_id=user_id, title=title, body=body))


@router.post("/{job_id}", response_model=schemas.ApplicationOut, status_code=201)
def apply_to_job(
    job_id: str,
    user: models.User = Depends(require_roles("STUDENT")),
    db: Session = Depends(get_db),
):
    student = db.query(models.Student).filter(models.Student.user_id == user.id).first()
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    if job.status != "OPEN":
        raise HTTPException(400, "This job is no longer accepting applications")
    if not is_eligible(student, job):
        raise HTTPException(400, "You do not meet the eligibility criteria for this job")

    existing = db.query(models.Application).filter(
        models.Application.job_id == job_id, models.Application.student_id == student.id
    ).first()
    if existing:
        raise HTTPException(400, "You have already applied to this job")

    application = models.Application(student_id=student.id, job_id=job_id)
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@router.get("/mine", response_model=list[schemas.ApplicationDetail])
def my_applications(user: models.User = Depends(require_roles("STUDENT")), db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.user_id == user.id).first()
    apps = db.query(models.Application).filter(models.Application.student_id == student.id).order_by(
        models.Application.applied_at.desc()
    ).all()
    out = []
    for a in apps:
        out.append(schemas.ApplicationDetail(
            id=a.id, student_id=a.student_id, job_id=a.job_id, status=a.status, applied_at=a.applied_at,
            job_title=a.job.title, company_name=a.job.company.name, package_lpa=a.job.package_lpa,
        ))
    return out


@router.put("/{application_id}/withdraw", response_model=schemas.ApplicationOut)
def withdraw(
    application_id: str,
    user: models.User = Depends(require_roles("STUDENT")),
    db: Session = Depends(get_db),
):
    student = db.query(models.Student).filter(models.Student.user_id == user.id).first()
    app_row = db.query(models.Application).filter(
        models.Application.id == application_id, models.Application.student_id == student.id
    ).first()
    if not app_row:
        raise HTTPException(404, "Application not found")
    app_row.status = "WITHDRAWN"
    db.commit()
    db.refresh(app_row)
    return app_row


@router.get("/job/{job_id}", response_model=list[schemas.ApplicantOut])
def applicants_for_job(
    job_id: str,
    user: models.User = Depends(require_roles("RECRUITER", "PLACEMENT_OFFICER")),
    db: Session = Depends(get_db),
):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    if user.role.value == "RECRUITER" and job.company.owner_id != user.id:
        raise HTTPException(403, "Not your job posting")

    apps = db.query(models.Application).filter(models.Application.job_id == job_id).order_by(
        models.Application.applied_at.desc()
    ).all()
    out = []
    for a in apps:
        s = a.student
        out.append(schemas.ApplicantOut(
            application_id=a.id, student_id=s.id, full_name=s.user.full_name, email=s.user.email,
            roll_number=s.roll_number, branch=s.branch, cgpa=s.cgpa, backlogs=s.backlogs,
            resume_path=s.resume_path, status=a.status, applied_at=a.applied_at,
        ))
    return out


@router.put("/{application_id}/status", response_model=schemas.ApplicationOut)
def update_status(
    application_id: str,
    payload: schemas.StatusUpdate,
    user: models.User = Depends(require_roles("RECRUITER", "PLACEMENT_OFFICER")),
    db: Session = Depends(get_db),
):
    if payload.status not in VALID_STATUSES:
        raise HTTPException(400, "Invalid status")
    app_row = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not app_row:
        raise HTTPException(404, "Application not found")
    if user.role.value == "RECRUITER" and app_row.job.company.owner_id != user.id:
        raise HTTPException(403, "Not your job posting")

    app_row.status = payload.status
    notify(db, app_row.student.user_id, "Application update",
           f"Your application for {app_row.job.title} is now {payload.status.replace('_', ' ').title()}.")
    db.commit()
    db.refresh(app_row)
    return app_row
