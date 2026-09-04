from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_roles
from app import models, schemas

router = APIRouter(prefix="/assessments", tags=["assessments"])


@router.post("/job/{job_id}", response_model=schemas.AssessmentPublic, status_code=201)
def create_assessment(
    job_id: str,
    payload: schemas.AssessmentCreate,
    user: models.User = Depends(require_roles("RECRUITER")),
    db: Session = Depends(get_db),
):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    if job.company.owner_id != user.id:
        raise HTTPException(403, "Not your job posting")
    if job.assessment:
        raise HTTPException(400, "An assessment already exists for this job")

    assessment = models.Assessment(
        job_id=job_id, title=payload.title, duration_minutes=payload.duration_minutes,
        passing_score=payload.passing_score,
    )
    db.add(assessment)
    db.flush()
    for q in payload.questions:
        db.add(models.AssessmentQuestion(assessment_id=assessment.id, **q.model_dump()))
    db.commit()
    db.refresh(assessment)
    return _to_public(assessment)


def _to_public(assessment: models.Assessment) -> schemas.AssessmentPublic:
    total = sum(q.marks for q in assessment.questions)
    return schemas.AssessmentPublic(
        id=assessment.id, title=assessment.title, duration_minutes=assessment.duration_minutes,
        passing_score=assessment.passing_score, total_marks=total,
        questions=[schemas.QuestionPublic(
            id=q.id, question_text=q.question_text, option_a=q.option_a, option_b=q.option_b,
            option_c=q.option_c, option_d=q.option_d, marks=q.marks,
        ) for q in assessment.questions],
    )


@router.get("/job/{job_id}", response_model=schemas.AssessmentPublic)
def get_assessment(job_id: str, _: models.User = Depends(require_roles("STUDENT", "RECRUITER", "PLACEMENT_OFFICER")), db: Session = Depends(get_db)):
    assessment = db.query(models.Assessment).filter(models.Assessment.job_id == job_id).first()
    if not assessment:
        raise HTTPException(404, "No assessment for this job")
    return _to_public(assessment)


@router.post("/application/{application_id}/submit", response_model=schemas.AssessmentResult)
def submit_assessment(
    application_id: str,
    payload: schemas.AssessmentSubmit,
    user: models.User = Depends(require_roles("STUDENT")),
    db: Session = Depends(get_db),
):
    app_row = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not app_row:
        raise HTTPException(404, "Application not found")
    if app_row.student.user_id != user.id:
        raise HTTPException(403, "Not your application")

    existing = db.query(models.AssessmentAttempt).filter(
        models.AssessmentAttempt.application_id == application_id
    ).first()
    if existing:
        raise HTTPException(400, "You have already submitted this assessment")

    assessment = app_row.job.assessment
    if not assessment:
        raise HTTPException(404, "No assessment for this job")

    score = 0
    total = 0
    for q in assessment.questions:
        total += q.marks
        selected = payload.answers.get(q.id)
        if selected and selected.strip().upper() == q.correct_option.strip().upper():
            score += q.marks

    attempt = models.AssessmentAttempt(application_id=application_id, score=score, total_marks=total)
    db.add(attempt)
    passed = total > 0 and (score / total) * 100 >= assessment.passing_score
    if passed:
        app_row.status = "SHORTLISTED"
    db.commit()
    return schemas.AssessmentResult(score=score, total_marks=total, passed=passed)
