from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app import models, schemas
from app.security import hash_password, verify_password, create_access_token

from fastapi.security import OAuth2PasswordBearer
from app.security import decode_access_token

from app.eligibility import check_eligibility
import uuid

from fastapi import UploadFile,File

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.security import HTTPBearer

oauth2_scheme = HTTPBearer()

def get_current_user(token=Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_access_token(token.credentials)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user

@app.get("/")
def root():
    return {"message": "CampusFlow backend is running"}


@app.post("/auth/register", response_model=schemas.UserOut, status_code=201)
def register(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/auth/login")
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token(str(user.id), user.role)
    return {"access_token": token, "token_type": "bearer"}

@app.get("/auth/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@app.post("/students/me", response_model=schemas.StudentOut, status_code=201)
def create_student_profile(
    payload: schemas.StudentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    existing = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student profile already exists")

    new_student = models.Student(
        user_id=current_user.id,
        roll_number=payload.roll_number,
        branch=payload.branch,
        graduation_year=payload.graduation_year,
        cgpa=payload.cgpa,
        backlogs=payload.backlogs,
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return new_student


@app.get("/students/me", response_model=schemas.StudentOut)
def get_my_student_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student


@app.post("/companies", response_model=schemas.CompanyOut, status_code=201)
def create_company(
    payload: schemas.CompanyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "RECRUITER":
        raise HTTPException(status_code=403, detail="Only recruiters can create companies")

    existing = db.query(models.Company).filter(models.Company.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Company with this name already exists")

    new_company = models.Company(
        name=payload.name,
        description=payload.description,
        website=payload.website,
        location=payload.location,
    )
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    return new_company


@app.get("/companies", response_model=list[schemas.CompanyOut])
def list_companies(db: Session = Depends(get_db)):
    return db.query(models.Company).all()


@app.post("/jobs", response_model=schemas.JobOut, status_code=201)
def create_job(
    payload: schemas.JobCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "RECRUITER":
        raise HTTPException(status_code=403, detail="Only recruiters can post jobs")

    company = db.query(models.Company).filter(models.Company.id == payload.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    new_job = models.Job(
        company_id=payload.company_id,
        title=payload.title,
        package_lpa=payload.package_lpa,
        location=payload.location,
        min_cgpa=payload.min_cgpa,
        max_backlogs=payload.max_backlogs,
        allowed_branches=payload.allowed_branches,
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job


@app.get("/jobs", response_model=list[schemas.JobOut])
def list_jobs(db: Session = Depends(get_db)):
    return db.query(models.Job).all()

@app.get("/jobs/{job_id}/check-eligibility")
def check_job_eligibility(
    job_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "STUDENT":
        raise HTTPException(status_code=403, detail="Only students can check their own eligibility")

    student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return check_eligibility(student, job)



@app.post("/applications", response_model=schemas.ApplicationOut, status_code=201)
def apply_to_job(
    payload: schemas.ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "STUDENT":
        raise HTTPException(status_code=403, detail="Only students can apply to jobs")

    student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    job = db.query(models.Job).filter(models.Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    existing = (
        db.query(models.Application)
        .filter(models.Application.student_id == student.id, models.Application.job_id == job.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You already applied to this job")

    eligibility = check_eligibility(student, job)
    if not eligibility["eligible"]:
        raise HTTPException(status_code=400, detail=f"Not eligible: {', '.join(eligibility['reasons'])}")

    new_application = models.Application(student_id=student.id, job_id=job.id)
    db.add(new_application)
    db.commit()
    db.refresh(new_application)
    return new_application


@app.get("/applications/me", response_model=list[schemas.ApplicationOut])
def my_applications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    return db.query(models.Application).filter(models.Application.student_id == student.id).all()


@app.patch("/companies/{company_id}/approve", response_model=schemas.CompanyOut)
def approve_company(
    company_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "PLACEMENT_OFFICER":
        raise HTTPException(status_code=403, detail="Only placement officers can approve companies")

    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    company.status = "APPROVED"
    db.commit()
    db.refresh(company)
    return company


@app.patch("/companies/{company_id}/reject", response_model=schemas.CompanyOut)
def reject_company(
    company_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "PLACEMENT_OFFICER":
        raise HTTPException(status_code=403, detail="Only placement officers can reject companies")

    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    company.status = "REJECTED"
    db.commit()
    db.refresh(company)
    return company



@app.get("/officer/students", response_model=list[schemas.StudentOut])
def list_all_students(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "PLACEMENT_OFFICER":
        raise HTTPException(status_code=403, detail="Only placement officers can view all students")

    return db.query(models.Student).all()


@app.get("/officer/applications", response_model=list[schemas.ApplicationOut])
def list_all_applications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "PLACEMENT_OFFICER":
        raise HTTPException(status_code=403, detail="Only placement officers can view all applications")

    return db.query(models.Application).all()




import enum
from sqlalchemy import Enum as SQLEnum


class RoleEnum(str, enum.Enum):
    STUDENT = "STUDENT"
    FACULTY = "FACULTY"
    PLACEMENT_OFFICER = "PLACEMENT_OFFICER"
    RECRUITER = "RECRUITER"
    ADMIN = "ADMIN"


# ---------- Interviews ----------

@app.post("/interviews", response_model=schemas.InterviewOut, status_code=201)
def schedule_interview(
    payload: schemas.InterviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "RECRUITER":
        raise HTTPException(status_code=403, detail="Only recruiters can schedule interviews")

    application = db.query(models.Application).filter(models.Application.id == payload.application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    new_interview = models.Interview(
        application_id=payload.application_id,
        scheduled_at=payload.scheduled_at,
        mode=payload.mode,
    )
    db.add(new_interview)
    application.status = "TECHNICAL_INTERVIEW"

    student = db.query(models.Student).filter(models.Student.id == application.student_id).first()
    notify = models.Notification(
        user_id=student.user_id,
        title="Interview Scheduled",
        body=f"Your interview is scheduled at {payload.scheduled_at}",
    )
    db.add(notify)

    db.commit()
    db.refresh(new_interview)
    return new_interview


@app.get("/applications/{application_id}/interviews", response_model=list[schemas.InterviewOut])
def get_interviews_for_application(
    application_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return db.query(models.Interview).filter(models.Interview.application_id == application_id).all()


# ---------- Offers ----------

@app.post("/offers", response_model=schemas.OfferOut, status_code=201)
def issue_offer(
    payload: schemas.OfferCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "RECRUITER":
        raise HTTPException(status_code=403, detail="Only recruiters can issue offers")

    application = db.query(models.Application).filter(models.Application.id == payload.application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    existing = db.query(models.Offer).filter(models.Offer.application_id == payload.application_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Offer already issued for this application")

    new_offer = models.Offer(
        application_id=payload.application_id,
        package_lpa=payload.package_lpa,
        role=payload.role,
    )
    db.add(new_offer)
    application.status = "SELECTED"

    student = db.query(models.Student).filter(models.Student.id == application.student_id).first()
    notify = models.Notification(
        user_id=student.user_id,
        title="Offer Received!",
        body=f"You received an offer for {payload.role} at {payload.package_lpa} LPA",
    )
    db.add(notify)

    db.commit()
    db.refresh(new_offer)
    return new_offer


@app.patch("/offers/{offer_id}/respond", response_model=schemas.OfferOut)
def respond_to_offer(
    offer_id: uuid.UUID,
    accept: bool,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "STUDENT":
        raise HTTPException(status_code=403, detail="Only students can respond to offers")

    offer = db.query(models.Offer).filter(models.Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    offer.status = "ACCEPTED" if accept else "DECLINED"
    db.commit()
    db.refresh(offer)
    return offer


# ---------- Notifications ----------

@app.get("/notifications/me", response_model=list[schemas.NotificationOut])
def my_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.Notification)
        .filter(models.Notification.user_id == current_user.id)
        .order_by(models.Notification.created_at.desc())
        .all()
    )


@app.patch("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    notification = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.commit()
    return {"message": "Marked as read"}



# ---------- Assessments ----------

@app.post("/assessments", response_model=schemas.AssessmentOut, status_code=201)
def create_assessment(
    payload: schemas.AssessmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "RECRUITER":
        raise HTTPException(status_code=403, detail="Only recruiters can create assessments")

    new_assessment = models.Assessment(
        job_id=payload.job_id,
        title=payload.title,
        duration_minutes=payload.duration_minutes,
        passing_score=payload.passing_score,
    )
    db.add(new_assessment)
    db.flush()  # generates new_assessment.id without a full commit yet

    for q in payload.questions:
        db.add(models.AssessmentQuestion(
            assessment_id=new_assessment.id,
            question_text=q.question_text,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d,
            correct_option=q.correct_option,
            marks=q.marks,
        ))

    db.commit()
    db.refresh(new_assessment)
    return new_assessment


@app.get("/jobs/{job_id}/assessment", response_model=schemas.AssessmentOut)
def get_assessment_for_job(job_id: uuid.UUID, db: Session = Depends(get_db)):
    assessment = db.query(models.Assessment).filter(models.Assessment.job_id == job_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="No assessment found for this job")
    return assessment


@app.post("/assessments/submit", response_model=schemas.AssessmentResult)
def submit_assessment(
    payload: schemas.SubmitAssessment,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "STUDENT":
        raise HTTPException(status_code=403, detail="Only students can submit assessments")

    total_score = 0
    total_marks = 0
    passing_score = 0

    for answer in payload.answers:
        question = db.query(models.AssessmentQuestion).filter(
            models.AssessmentQuestion.id == answer.question_id
        ).first()
        if not question:
            continue

        total_marks += question.marks
        is_correct = answer.selected_option.upper() == question.correct_option.upper()
        if is_correct:
            total_score += question.marks

        db.add(models.StudentAnswer(
            application_id=payload.application_id,
            question_id=answer.question_id,
            selected_option=answer.selected_option,
            is_correct=is_correct,
        ))

        assessment = db.query(models.Assessment).filter(
            models.Assessment.id == question.assessment_id
        ).first()
        if assessment:
            passing_score = assessment.passing_score

    application = db.query(models.Application).filter(
        models.Application.id == payload.application_id
    ).first()
    if application:
        application.status = "ASSESSMENT"

    db.commit()

    return schemas.AssessmentResult(
        score=total_score,
        total_marks=total_marks,
        passed=total_score >= passing_score,
    )


# ---------- Analytics ----------

@app.get("/analytics/overview")
def analytics_overview(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "PLACEMENT_OFFICER":
        raise HTTPException(status_code=403, detail="Only placement officers can view analytics")

    total_students = db.query(models.Student).count()
    total_companies = db.query(models.Company).count()
    total_jobs = db.query(models.Job).count()
    total_applications = db.query(models.Application).count()
    total_placed = db.query(models.Application).filter(models.Application.status == "SELECTED").count()

    placement_rate = round((total_placed / total_students) * 100, 1) if total_students > 0 else 0

    return {
        "total_students": total_students,
        "total_companies": total_companies,
        "total_jobs": total_jobs,
        "total_applications": total_applications,
        "total_placed": total_placed,
        "placement_rate": placement_rate,
    }


@app.get("/analytics/branch-wise")
def analytics_branch_wise(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "PLACEMENT_OFFICER":
        raise HTTPException(status_code=403, detail="Only placement officers can view analytics")

    students = db.query(models.Student).all()
    branch_stats = {}

    for student in students:
        branch = student.branch
        if branch not in branch_stats:
            branch_stats[branch] = {"total": 0, "placed": 0}
        branch_stats[branch]["total"] += 1

        applications = db.query(models.Application).filter(
            models.Application.student_id == student.id,
            models.Application.status == "SELECTED",
        ).count()
        if applications > 0:
            branch_stats[branch]["placed"] += 1

    result = []
    for branch, stats in branch_stats.items():
        rate = round((stats["placed"] / stats["total"]) * 100, 1) if stats["total"] > 0 else 0
        result.append({"branch": branch, "total": stats["total"], "placed": stats["placed"], "placement_rate": rate})

    return result



# ---------- Faculty: Attendance ----------

@app.post("/attendance", response_model=schemas.AttendanceOut, status_code=201)
def add_attendance(
    payload: schemas.AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "FACULTY":
        raise HTTPException(status_code=403, detail="Only faculty can record attendance")

    record = models.Attendance(
        student_id=payload.student_id,
        subject=payload.subject,
        total_classes=payload.total_classes,
        attended_classes=payload.attended_classes,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@app.get("/students/me/attendance", response_model=list[schemas.AttendanceOut])
def my_attendance(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return db.query(models.Attendance).filter(models.Attendance.student_id == student.id).all()


# ---------- Faculty: Academic Records ----------

@app.post("/academic-records", response_model=schemas.AcademicRecordOut, status_code=201)
def add_academic_record(
    payload: schemas.AcademicRecordCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "FACULTY":
        raise HTTPException(status_code=403, detail="Only faculty can add academic records")

    record = models.AcademicRecord(
        student_id=payload.student_id,
        semester=payload.semester,
        sgpa=payload.sgpa,
        backlogs=payload.backlogs,
    )
    db.add(record)

    # Keep the student's summary CGPA/backlogs in sync (used by the Eligibility Engine)
    student = db.query(models.Student).filter(models.Student.id == payload.student_id).first()
    if student:
        student.cgpa = payload.sgpa
        student.backlogs = payload.backlogs

    db.commit()
    db.refresh(record)
    return record


# ---------- Announcements ----------

@app.post("/announcements", response_model=schemas.AnnouncementOut, status_code=201)
def create_announcement(
    payload: schemas.AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role not in ["FACULTY", "PLACEMENT_OFFICER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized to post announcements")

    announcement = models.Announcement(author_id=current_user.id, title=payload.title, body=payload.body)
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    return announcement


@app.get("/announcements", response_model=list[schemas.AnnouncementOut])
def list_announcements(db: Session = Depends(get_db)):
    return db.query(models.Announcement).order_by(models.Announcement.created_at.desc()).all()


# ---------- Resume Upload ----------

import os
import shutil

UPLOAD_DIR = "uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.post("/students/me/resume")
def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "STUDENT":
        raise HTTPException(status_code=403, detail="Only students can upload a resume")

    student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    file_path = f"{UPLOAD_DIR}/{student.id}.pdf"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    student.resume_path = file_path
    db.commit()

    return {"message": "Resume uploaded successfully", "path": file_path}