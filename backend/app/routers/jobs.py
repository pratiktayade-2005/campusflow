from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.deps import get_current_user, require_roles
from app import models, schemas

router = APIRouter(prefix="/jobs", tags=["jobs"])


def is_eligible(student: models.Student, job: models.Job) -> bool:
    if student.cgpa < job.min_cgpa:
        return False
    if student.backlogs > job.max_backlogs:
        return False
    if job.allowed_branches:
        allowed = {b.strip().upper() for b in job.allowed_branches.split(",") if b.strip()}
        if allowed and student.branch.upper() not in allowed:
            return False
    return True


def serialize_job(db: Session, job: models.Job, student: models.Student | None = None) -> schemas.JobWithCompany:
    applicant_count = db.query(models.Application).filter(models.Application.job_id == job.id).count()
    # Build from a plain dict rather than model_validate(job) directly: JobWithCompany
    # requires company_name/applicant_count which don't exist as attributes on the ORM
    # Job object, so from_attributes validation would fail before we could set them.
    payload = schemas.JobOut.model_validate(job).model_dump()
    payload["company_name"] = job.company.name
    payload["company_logo_path"] = job.company.logo_path
    payload["applicant_count"] = applicant_count
    if student is not None:
        payload["eligible"] = is_eligible(student, job)
        payload["already_applied"] = db.query(models.Application).filter(
            models.Application.job_id == job.id, models.Application.student_id == student.id
        ).first() is not None
    return schemas.JobWithCompany(**payload)


@router.get("", response_model=list[schemas.JobWithCompany])
def list_jobs(
    status_filter: str | None = None,
    search: str | None = None,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(models.Job)
    if status_filter:
        q = q.filter(models.Job.status == status_filter)
    if search:
        like = f"%{search}%"
        q = q.filter(models.Job.title.ilike(like))
    q = q.order_by(models.Job.created_at.desc())

    student = None
    if user.role.value == "STUDENT":
        student = db.query(models.Student).filter(models.Student.user_id == user.id).first()

    return [serialize_job(db, job, student) for job in q.all()]


@router.get("/mine", response_model=list[schemas.JobWithCompany])
def my_company_jobs(user: models.User = Depends(require_roles("RECRUITER")), db: Session = Depends(get_db)):
    company = db.query(models.Company).filter(models.Company.owner_id == user.id).first()
    if not company:
        return []
    jobs = db.query(models.Job).filter(models.Job.company_id == company.id).order_by(models.Job.created_at.desc()).all()
    return [serialize_job(db, job) for job in jobs]


@router.get("/{job_id}", response_model=schemas.JobWithCompany)
def get_job(job_id: str, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    student = None
    if user.role.value == "STUDENT":
        student = db.query(models.Student).filter(models.Student.user_id == user.id).first()
    return serialize_job(db, job, student)


@router.post("", response_model=schemas.JobWithCompany, status_code=201)
def create_job(
    payload: schemas.JobCreate,
    user: models.User = Depends(require_roles("RECRUITER")),
    db: Session = Depends(get_db),
):
    company = db.query(models.Company).filter(models.Company.owner_id == user.id).first()
    if not company:
        raise HTTPException(400, "Create a company profile first")
    job = models.Job(company_id=company.id, **payload.model_dump())
    db.add(job)
    db.commit()
    db.refresh(job)
    return serialize_job(db, job)


@router.put("/{job_id}/status", response_model=schemas.JobWithCompany)
def update_job_status(
    job_id: str,
    payload: schemas.StatusUpdate,
    user: models.User = Depends(require_roles("RECRUITER")),
    db: Session = Depends(get_db),
):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    if job.company.owner_id != user.id:
        raise HTTPException(403, "Not your job posting")
    if payload.status not in {"OPEN", "CLOSED"}:
        raise HTTPException(400, "Invalid status")
    job.status = payload.status
    db.commit()
    db.refresh(job)
    return serialize_job(db, job)
