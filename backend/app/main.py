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