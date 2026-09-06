import uuid
from decimal import Decimal
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr, ConfigDict

from app.models import RoleEnum


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: RoleEnum
    # role-specific optional fields
    roll_number: Optional[str] = None
    branch: Optional[str] = None
    graduation_year: Optional[int] = None
    department: Optional[str] = None
    company_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    photo_path: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class StudentUpdate(BaseModel):
    branch: Optional[str] = None
    graduation_year: Optional[int] = None
    cgpa: Optional[Decimal] = None
    backlogs: Optional[int] = None
    phone: Optional[str] = None
    skills: Optional[str] = None


class StudentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    roll_number: str
    branch: str
    graduation_year: int
    cgpa: Decimal
    backlogs: int
    phone: Optional[str] = None
    skills: Optional[str] = None
    resume_path: Optional[str] = None


class StudentWithUser(StudentOut):
    full_name: str
    email: str


class CompanyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None


class CompanyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    owner_id: Optional[uuid.UUID] = None
    name: str
    description: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None
    logo_path: Optional[str] = None
    status: str


class JobCreate(BaseModel):
    title: str
    description: Optional[str] = None
    job_type: str = "Full-time"
    package_lpa: Optional[Decimal] = None
    location: Optional[str] = None
    min_cgpa: Decimal = Decimal("0")
    max_backlogs: int = 0
    allowed_branches: Optional[str] = None
    openings: int = 1
    deadline: Optional[datetime] = None


class JobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    company_id: uuid.UUID
    title: str
    description: Optional[str] = None
    job_type: str
    package_lpa: Optional[Decimal] = None
    location: Optional[str] = None
    min_cgpa: Decimal
    max_backlogs: int
    allowed_branches: Optional[str] = None
    openings: int
    deadline: Optional[datetime] = None
    status: str
    created_at: datetime


class JobWithCompany(JobOut):
    company_name: str
    company_logo_path: Optional[str] = None
    applicant_count: int = 0
    eligible: Optional[bool] = None
    already_applied: Optional[bool] = None


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    student_id: uuid.UUID
    job_id: uuid.UUID
    status: str
    applied_at: datetime


class ApplicationDetail(ApplicationOut):
    job_title: str
    company_name: str
    package_lpa: Optional[Decimal] = None


class ApplicantOut(BaseModel):
    application_id: uuid.UUID
    student_id: uuid.UUID
    full_name: str
    email: str
    roll_number: str
    branch: str
    cgpa: Decimal
    backlogs: int
    resume_path: Optional[str] = None
    status: str
    applied_at: datetime


class StatusUpdate(BaseModel):
    status: str


class InterviewCreate(BaseModel):
    application_id: uuid.UUID
    scheduled_at: datetime
    mode: str = "Online"
    round_number: int = 1
    round_name: str = "Technical"


class InterviewUpdate(BaseModel):
    status: Optional[str] = None
    feedback: Optional[str] = None
    result: Optional[str] = None
    scheduled_at: Optional[datetime] = None


class InterviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    application_id: uuid.UUID
    scheduled_at: datetime
    mode: str
    round_number: int
    round_name: str
    status: str
    feedback: Optional[str] = None
    result: Optional[str] = None


class InterviewDetail(InterviewOut):
    job_title: str
    company_name: str
    student_name: Optional[str] = None


class OfferCreate(BaseModel):
    application_id: uuid.UUID
    package_lpa: Decimal
    role: str
    joining_date: Optional[datetime] = None


class OfferOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    application_id: uuid.UUID
    package_lpa: Decimal
    role: str
    status: str
    issued_at: datetime
    joining_date: Optional[datetime] = None


class OfferDetail(OfferOut):
    job_title: str
    company_name: str
    student_name: Optional[str] = None


class OfferRespond(BaseModel):
    accept: bool


class AnnouncementCreate(BaseModel):
    title: str
    body: str
    audiences: List[str] = ["ALL"]  # any combination of ALL/STUDENT/FACULTY/RECRUITER


class AnnouncementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    author_id: uuid.UUID
    title: str
    body: str
    audience: str 


class AnnouncementDetail(AnnouncementOut):
    author_name: str


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    body: str
    is_read: bool
    created_at: datetime


class OfficerStats(BaseModel):
    total_students: int
    total_companies: int
    total_jobs: int
    open_jobs: int
    total_applications: int
    total_offers: int
    students_placed: int
    placement_rate: float
    avg_package: float
    max_package: float
    branch_wise: list
    monthly_offers: list
    top_companies: list


class RecruiterStats(BaseModel):
    total_jobs: int
    open_jobs: int
    total_applicants: int
    shortlisted: int
    interviews_scheduled: int
    offers_made: int
    funnel: list
