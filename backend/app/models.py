import uuid
import enum
from sqlalchemy import (
    Column, String, Boolean, ForeignKey, Integer, Numeric, DateTime,
    Enum as SQLEnum, Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


def uuid_col():
    return Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


class RoleEnum(str, enum.Enum):
    STUDENT = "STUDENT"
    FACULTY = "FACULTY"
    PLACEMENT_OFFICER = "PLACEMENT_OFFICER"
    RECRUITER = "RECRUITER"


class User(Base):
    __tablename__ = "users"

    id = uuid_col()
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(SQLEnum(RoleEnum, name="role_enum"), nullable=False)
    is_active = Column(Boolean, default=True)
    photo_path = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="user", uselist=False)
    faculty = relationship("Faculty", back_populates="user", uselist=False)
    companies = relationship("Company", back_populates="owner")


class Student(Base):
    __tablename__ = "students"

    id = uuid_col()
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    roll_number = Column(String, unique=True, nullable=False)
    branch = Column(String, nullable=False)
    graduation_year = Column(Integer, nullable=False)
    cgpa = Column(Numeric(3, 2), default=0)
    backlogs = Column(Integer, default=0)
    phone = Column(String, nullable=True)
    skills = Column(String, nullable=True)  # comma separated
    resume_path = Column(String, nullable=True)

    user = relationship("User", back_populates="student")
    applications = relationship("Application", back_populates="student")


class Faculty(Base):
    __tablename__ = "faculty"

    id = uuid_col()
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    department = Column(String, nullable=True)

    user = relationship("User", back_populates="faculty")


class Company(Base):
    __tablename__ = "companies"

    id = uuid_col()
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    website = Column(String, nullable=True)
    location = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    logo_path = Column(String, nullable=True)
    status = Column(String, default="APPROVED")  # PENDING, APPROVED, REJECTED
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="companies")
    jobs = relationship("Job", back_populates="company")


class Job(Base):
    __tablename__ = "jobs"

    id = uuid_col()
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    job_type = Column(String, default="Full-time")  # Full-time, Internship
    package_lpa = Column(Numeric(6, 2), nullable=True)
    location = Column(String, nullable=True)
    min_cgpa = Column(Numeric(3, 2), default=0)
    max_backlogs = Column(Integer, default=0)
    allowed_branches = Column(String, nullable=True)  # comma separated, empty = all
    openings = Column(Integer, default=1)
    deadline = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, default="OPEN")  # OPEN, CLOSED
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("Company", back_populates="jobs")
    applications = relationship("Application", back_populates="job")
    assessment = relationship("Assessment", back_populates="job", uselist=False)


class Application(Base):
    __tablename__ = "applications"

    id = uuid_col()
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False)
    status = Column(String, default="APPLIED")
    # APPLIED, UNDER_REVIEW, SHORTLISTED, INTERVIEWING, OFFERED, REJECTED, WITHDRAWN
    applied_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="applications")
    job = relationship("Job", back_populates="applications")
    interviews = relationship("Interview", back_populates="application")
    offer = relationship("Offer", back_populates="application", uselist=False)


class Interview(Base):
    __tablename__ = "interviews"

    id = uuid_col()
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    mode = Column(String, default="Online")
    round_number = Column(Integer, default=1)
    round_name = Column(String, default="Technical")
    status = Column(String, default="SCHEDULED")  # SCHEDULED, COMPLETED, CANCELLED
    feedback = Column(Text, nullable=True)
    result = Column(String, nullable=True)  # PASS, FAIL, PENDING

    application = relationship("Application", back_populates="interviews")


class Offer(Base):
    __tablename__ = "offers"

    id = uuid_col()
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), unique=True, nullable=False)
    package_lpa = Column(Numeric(6, 2), nullable=False)
    role = Column(String, nullable=False)
    status = Column(String, default="OFFERED")  # OFFERED, ACCEPTED, DECLINED
    issued_at = Column(DateTime(timezone=True), server_default=func.now())
    joining_date = Column(DateTime(timezone=True), nullable=True)

    application = relationship("Application", back_populates="offer")


class Assessment(Base):
    __tablename__ = "assessments"

    id = uuid_col()
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), unique=True, nullable=False)
    title = Column(String, nullable=False)
    duration_minutes = Column(Integer, default=30)
    passing_score = Column(Integer, default=50)

    job = relationship("Job", back_populates="assessment")
    questions = relationship("AssessmentQuestion", back_populates="assessment")


class AssessmentQuestion(Base):
    __tablename__ = "assessment_questions"

    id = uuid_col()
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessments.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    option_a = Column(String, nullable=False)
    option_b = Column(String, nullable=False)
    option_c = Column(String, nullable=False)
    option_d = Column(String, nullable=False)
    correct_option = Column(String, nullable=False)
    marks = Column(Integer, default=1)

    assessment = relationship("Assessment", back_populates="questions")


class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id = uuid_col()
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), unique=True, nullable=False)
    score = Column(Integer, default=0)
    total_marks = Column(Integer, default=0)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())


class Announcement(Base):
    __tablename__ = "announcements"

    id = uuid_col()
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    audience = Column(String, default="ALL")  # ALL, STUDENT, FACULTY, RECRUITER
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Notification(Base):
    __tablename__ = "notifications"

    id = uuid_col()
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    body = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
