from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_roles
from app import models, schemas

router = APIRouter(prefix="/interviews", tags=["interviews"])


def notify(db: Session, user_id, title: str, body: str):
    db.add(models.Notification(user_id=user_id, title=title, body=body))


@router.post("", response_model=schemas.InterviewOut, status_code=201)
def schedule_interview(
    payload: schemas.InterviewCreate,
    user: models.User = Depends(require_roles("RECRUITER", "PLACEMENT_OFFICER")),
    db: Session = Depends(get_db),
):
    app_row = db.query(models.Application).filter(models.Application.id == payload.application_id).first()
    if not app_row:
        raise HTTPException(404, "Application not found")
    if user.role.value == "RECRUITER" and app_row.job.company.owner_id != user.id:
        raise HTTPException(403, "Not your job posting")

    interview = models.Interview(**payload.model_dump())
    db.add(interview)
    app_row.status = "INTERVIEWING"
    notify(db, app_row.student.user_id, "Interview scheduled",
           f"{payload.round_name} interview for {app_row.job.title} scheduled.")
    db.commit()
    db.refresh(interview)
    return interview


@router.get("/mine", response_model=list[schemas.InterviewDetail])
def my_interviews(user: models.User = Depends(require_roles("STUDENT")), db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.user_id == user.id).first()
    interviews = db.query(models.Interview).join(models.Application).filter(
        models.Application.student_id == student.id
    ).order_by(models.Interview.scheduled_at.desc()).all()
    out = []
    for i in interviews:
        out.append(schemas.InterviewDetail(
            id=i.id, application_id=i.application_id, scheduled_at=i.scheduled_at, mode=i.mode,
            round_number=i.round_number, round_name=i.round_name, status=i.status, feedback=i.feedback,
            result=i.result, job_title=i.application.job.title, company_name=i.application.job.company.name,
        ))
    return out


@router.get("/job/{job_id}", response_model=list[schemas.InterviewDetail])
def interviews_for_job(
    job_id: str,
    user: models.User = Depends(require_roles("RECRUITER", "PLACEMENT_OFFICER")),
    db: Session = Depends(get_db),
):
    interviews = db.query(models.Interview).join(models.Application).filter(
        models.Application.job_id == job_id
    ).order_by(models.Interview.scheduled_at.asc()).all()
    out = []
    for i in interviews:
        out.append(schemas.InterviewDetail(
            id=i.id, application_id=i.application_id, scheduled_at=i.scheduled_at, mode=i.mode,
            round_number=i.round_number, round_name=i.round_name, status=i.status, feedback=i.feedback,
            result=i.result, job_title=i.application.job.title, company_name=i.application.job.company.name,
            student_name=i.application.student.user.full_name,
        ))
    return out


@router.put("/{interview_id}", response_model=schemas.InterviewOut)
def update_interview(
    interview_id: str,
    payload: schemas.InterviewUpdate,
    user: models.User = Depends(require_roles("RECRUITER", "PLACEMENT_OFFICER")),
    db: Session = Depends(get_db),
):
    interview = db.query(models.Interview).filter(models.Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(404, "Interview not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(interview, field, value)
    db.commit()
    db.refresh(interview)
    return interview
