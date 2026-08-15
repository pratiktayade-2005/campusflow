import uuid
from pydantic import BaseModel,EmailStr
from decimal import Decimal

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str

class UserLogin(BaseModel):
    emial: EmailStr
    password: str
    full_name: str
    role: str

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