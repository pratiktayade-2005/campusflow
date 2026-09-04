from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import os
import uuid

from app.database import get_db
from app.deps import get_current_user, require_roles
from app.config import UPLOAD_DIR
from app import models, schemas

router = APIRouter(prefix="/companies", tags=["companies"])

ALLOWED_IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp"}


@router.get("", response_model=list[schemas.CompanyOut])
def list_companies(db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    return db.query(models.Company).order_by(models.Company.name).all()


@router.get("/mine", response_model=schemas.CompanyOut)
def my_company(user: models.User = Depends(require_roles("RECRUITER")), db: Session = Depends(get_db)):
    company = db.query(models.Company).filter(models.Company.owner_id == user.id).first()
    if not company:
        raise HTTPException(404, "No company profile found for this recruiter")
    return company


@router.put("/mine", response_model=schemas.CompanyOut)
def update_my_company(
    payload: schemas.CompanyCreate,
    user: models.User = Depends(require_roles("RECRUITER")),
    db: Session = Depends(get_db),
):
    company = db.query(models.Company).filter(models.Company.owner_id == user.id).first()
    if not company:
        raise HTTPException(404, "No company profile found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(company, field, value)
    db.commit()
    db.refresh(company)
    return company


@router.put("/{company_id}/status", response_model=schemas.CompanyOut)
def set_company_status(
    company_id: str,
    payload: schemas.StatusUpdate,
    _: models.User = Depends(require_roles("PLACEMENT_OFFICER")),
    db: Session = Depends(get_db),
):
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(404, "Company not found")
    if payload.status not in {"PENDING", "APPROVED", "REJECTED"}:
        raise HTTPException(400, "Invalid status")
    company.status = payload.status
    db.commit()
    db.refresh(company)
    return company


@router.post("/mine/logo", response_model=schemas.CompanyOut)
def upload_company_logo(
    file: UploadFile = File(...),
    user: models.User = Depends(require_roles("RECRUITER")),
    db: Session = Depends(get_db),
):
    company = db.query(models.Company).filter(models.Company.owner_id == user.id).first()
    if not company:
        raise HTTPException(404, "No company profile found")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_IMAGE_EXT:
        raise HTTPException(400, "Only JPG, PNG, or WEBP images are allowed")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename = f"company_{company.id}_{uuid.uuid4().hex[:8]}{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        f.write(file.file.read())

    company.logo_path = filename
    db.commit()
    db.refresh(company)
    return company
