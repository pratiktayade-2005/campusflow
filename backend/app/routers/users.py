import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.config import UPLOAD_DIR
from app import models, schemas

router = APIRouter(prefix="/users", tags=["users"])

ALLOWED_IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp"}


@router.post("/me/photo", response_model=schemas.UserOut)
def upload_my_photo(
    file: UploadFile = File(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_IMAGE_EXT:
        raise HTTPException(400, "Only JPG, PNG, or WEBP images are allowed")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename = f"user_{user.id}_{uuid.uuid4().hex[:8]}{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        f.write(file.file.read())

    user.photo_path = filename
    db.commit()
    db.refresh(user)
    return user
