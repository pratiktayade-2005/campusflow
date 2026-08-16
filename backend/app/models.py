import uuid
import enum
from sqlalchemy import Column, String, Boolean, ForeignKey, Integer, Numeric, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base


class RoleEnum(str, enum.Enum):
    STUDENT = "STUDENT"
    FACULTY = "FACULTY"
    PLACEMENT_OFFICER = "PLACEMENT_OFFICER"
    RECRUITER = "RECRUITER"
    ADMIN = "ADMIN"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(SQLEnum(RoleEnum, name="role_enum"), nullable=False)
    is_active = Column(Boolean, default=True)


class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    roll_number = Column(String, unique=True, nullable=False)
    branch = Column(String, nullable=False)
    graduation_year = Column(Integer, nullable=False)
    cgpa = Column(Numeric(3, 2), default=0)
    backlogs = Column(Integer, default=0)
    resume_path = Column(String, nullable=True)


class Company(Base):
    __tablename__ = "companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    website = Column(String, nullable=True)
    location = Column(String, nullable=True)
    status = Column(String, default="PENDING")  # PENDING, APPROVED, REJECTED


class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    title = Column(String, nullable=False)
    package_lpa = Column(Numeric(6, 2), nullable=True)
    location = Column(String, nullable=True)
    min_cgpa = Column(Numeric(3, 2), default=0)
    max_backlogs = Column(Integer, default=0)
    allowed_branches = Column(String, nullable=True)  # comma-separated for now, e.g. "CSE,IT,ECE"
    status = Column(String, default="DRAFT")  # DRAFT, PUBLISHED, CLOSED


class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False)
    status = Column(String, default="APPLIED")  # APPLIED, SHORTLISTED, REJECTED, SELECTED
    applied_at = Column(DateTime(timezone=True), server_default=func.now())




class Interview(Base):
    __tablename__ = "interviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    mode = Column(String, default="Online")  # Online / Offline
    status = Column(String, default="SCHEDULED")  # SCHEDULED, COMPLETED, CANCELLED


class Offer(Base):
    __tablename__ = "offers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), unique=True, nullable=False)
    package_lpa = Column(Numeric(6, 2), nullable=False)
    role = Column(String, nullable=False)
    status = Column(String, default="OFFERED")  # OFFERED, ACCEPTED, DECLINED
    issued_at = Column(DateTime(timezone=True), server_default=func.now())


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    body = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())