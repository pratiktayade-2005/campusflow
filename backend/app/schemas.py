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