import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, require_roles
from app.config import UPLOAD_DIR
from app import models, schemas

router = APIRouter(prefix="/students", tags=["students"])


def get_student_or_404(db: Session, user_id) -> models.Student:
    student = db.query(models.Student).filter(models.Student.user_id == user_id).first()
    if not student:
        raise HTTPException(404, "Student profile not found")
    return student


@router.get("/me", response_model=schemas.StudentOut)
def my_profile(user: models.User = Depends(require_roles("STUDENT")), db: Session = Depends(get_db)):
    return get_student_or_404(db, user.id)


@router.put("/me", response_model=schemas.StudentOut)
def update_my_profile(
    payload: schemas.StudentUpdate,
    user: models.User = Depends(require_roles("STUDENT")),
    db: Session = Depends(get_db),
):
    student = get_student_or_404(db, user.id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(student, field, value)
    db.commit()
    db.refresh(student)
    return student


@router.post("/me/resume", response_model=schemas.StudentOut)
def upload_resume(
    file: UploadFile = File(...),
    user: models.User = Depends(require_roles("STUDENT")),
    db: Session = Depends(get_db),
):
    student = get_student_or_404(db, user.id)
    allowed = {".pdf", ".doc", ".docx"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(400, "Only PDF or Word documents are allowed")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename = f"{student.id}_{uuid.uuid4().hex[:8]}{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        f.write(file.file.read())

    student.resume_path = filename
    db.commit()
    db.refresh(student)
    return student


@router.get("", response_model=list[schemas.StudentWithUser])
def list_students(
    branch: str | None = None,
    min_cgpa: float | None = None,
    search: str | None = None,
    _: models.User = Depends(require_roles("PLACEMENT_OFFICER", "FACULTY", "RECRUITER")),
    db: Session = Depends(get_db),
):
    q = db.query(models.Student, models.User).join(models.User, models.Student.user_id == models.User.id)
    if branch:
        q = q.filter(models.Student.branch == branch)
    if min_cgpa is not None:
        q = q.filter(models.Student.cgpa >= min_cgpa)
    if search:
        like = f"%{search}%"
        q = q.filter(models.User.full_name.ilike(like) | models.Student.roll_number.ilike(like))

    results = []
    for student, u in q.all():
        results.append(schemas.StudentWithUser(
            id=student.id, user_id=student.user_id, roll_number=student.roll_number,
            branch=student.branch, graduation_year=student.graduation_year, cgpa=student.cgpa,
            backlogs=student.backlogs, phone=student.phone, skills=student.skills,
            resume_path=student.resume_path, full_name=u.full_name, email=u.email,
        ))
    return results
