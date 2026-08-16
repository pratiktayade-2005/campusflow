import uuid
from pydantic import BaseModel,EmailStr
from decimal import Decimal
from datetime import datetime
from app.models import RoleEnum

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: RoleEnum

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class StudentCreate(BaseModel):
    roll_number: str
    branch: str
    graduation_year: int
    cgpa: Decimal = 0
    backlogs: int = 0


class StudentOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    roll_number: str
    branch: str
    graduation_year: int
    cgpa: Decimal
    backlogs: int
    resume_path: str | None

    class Config:
        from_attributes = True

class CompanyCreate(BaseModel):
    name: str
    description: str | None = None
    website: str | None = None
    location: str | None = None


class CompanyOut(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    website: str | None
    location: str | None
    status: str

    class Config:
        from_attributes = True


class JobCreate(BaseModel):
    company_id: uuid.UUID
    title: str
    package_lpa: Decimal | None = None
    location: str | None = None
    min_cgpa: Decimal = 0
    max_backlogs: int = 0
    allowed_branches: str | None = None  # e.g. "CSE,IT,ECE"


class JobOut(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    title: str
    package_lpa: Decimal | None
    location: str | None
    min_cgpa: Decimal
    max_backlogs: int
    allowed_branches: str | None
    status: str

    class Config:
        from_attributes = True

class ApplicationCreate(BaseModel):
    job_id: uuid.UUID

class ApplicationOut(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    job_id: uuid.UUID
    status: str
    applied_at: datetime

    class Config:
        from_attributes = True

class InterviewCreate(BaseModel):
    application_id: uuid.UUID
    scheduled_at: datetime
    mode: str = "Online"


class InterviewOut(BaseModel):
    id: uuid.UUID
    application_id: uuid.UUID
    scheduled_at: datetime
    mode: str
    status: str

    class Config:
        from_attributes = True


class OfferCreate(BaseModel):
    application_id: uuid.UUID
    package_lpa: Decimal
    role: str


class OfferOut(BaseModel):
    id: uuid.UUID
    application_id: uuid.UUID
    package_lpa: Decimal
    role: str
    status: str
    issued_at: datetime

    class Config:
        from_attributes = True


class NotificationOut(BaseModel):
    id: uuid.UUID
    title: str
    body: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AssessmentQuestionCreate(BaseModel):
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    marks: int = 1


class AssessmentCreate(BaseModel):
    job_id: uuid.UUID
    title: str
    duration_minutes: int
    passing_score: int
    questions: list[AssessmentQuestionCreate]


class AssessmentQuestionOut(BaseModel):
    id: uuid.UUID
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    marks: int
    # Note: correct_option intentionally excluded — students shouldn't see the answer key

    class Config:
        from_attributes = True


class AssessmentOut(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    title: str
    duration_minutes: int
    passing_score: int
    questions: list[AssessmentQuestionOut]

    class Config:
        from_attributes = True


class SubmitAnswer(BaseModel):
    question_id: uuid.UUID
    selected_option: str


class SubmitAssessment(BaseModel):
    application_id: uuid.UUID
    answers: list[SubmitAnswer]


class AssessmentResult(BaseModel):
    score: int
    total_marks: int
    passed: bool



class AttendanceCreate(BaseModel):
    student_id: uuid.UUID
    subject: str
    total_classes: int
    attended_classes: int


class AttendanceOut(BaseModel):
    id: uuid.UUID
    subject: str
    total_classes: int
    attended_classes: int

    class Config:
        from_attributes = True


class AcademicRecordCreate(BaseModel):
    student_id: uuid.UUID
    semester: int
    sgpa: Decimal
    backlogs: int = 0


class AcademicRecordOut(BaseModel):
    id: uuid.UUID
    semester: int
    sgpa: Decimal
    backlogs: int

    class Config:
        from_attributes = True


class AnnouncementCreate(BaseModel):
    title: str
    body: str


class AnnouncementOut(BaseModel):
    id: uuid.UUID
    title: str
    body: str
    created_at: datetime

    class Config:
        from_attributes = True