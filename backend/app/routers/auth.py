from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app import models, schemas
from app.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
    )
    db.add(user)
    db.flush()

    if payload.role == models.RoleEnum.STUDENT:
        if not payload.roll_number or not payload.branch or not payload.graduation_year:
            raise HTTPException(400, "roll_number, branch and graduation_year are required for students")
        existing_roll = db.query(models.Student).filter(models.Student.roll_number == payload.roll_number).first()
        if existing_roll:
            raise HTTPException(400, "Roll number already in use")
        db.add(models.Student(
            user_id=user.id,
            roll_number=payload.roll_number,
            branch=payload.branch,
            graduation_year=payload.graduation_year,
        ))
    elif payload.role == models.RoleEnum.FACULTY:
        db.add(models.Faculty(user_id=user.id, department=payload.department))
    elif payload.role == models.RoleEnum.RECRUITER:
        if not payload.company_name:
            raise HTTPException(400, "company_name is required for recruiters")
        company = db.query(models.Company).filter(models.Company.name == payload.company_name).first()
        if company:
            if company.owner_id is not None:
                raise HTTPException(400, "This company already has an owner account")
            company.owner_id = user.id
        else:
            db.add(models.Company(owner_id=user.id, name=payload.company_name))

    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return schemas.Token(access_token=token, user=schemas.UserOut.model_validate(user))


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return schemas.Token(access_token=token, user=schemas.UserOut.model_validate(user))


@router.get("/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(get_current_user)):
    return user
