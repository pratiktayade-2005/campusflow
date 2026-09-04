from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app import models, schemas

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[schemas.NotificationOut])
def list_notifications(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Notification).filter(models.Notification.user_id == user.id).order_by(
        models.Notification.created_at.desc()
    ).limit(50).all()


@router.put("/{notification_id}/read", response_model=schemas.NotificationOut)
def mark_read(notification_id: str, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = db.query(models.Notification).filter(
        models.Notification.id == notification_id, models.Notification.user_id == user.id
    ).first()
    if not n:
        raise HTTPException(404, "Notification not found")
    n.is_read = True
    db.commit()
    db.refresh(n)
    return n


@router.put("/read-all")
def mark_all_read(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(models.Notification).filter(
        models.Notification.user_id == user.id, models.Notification.is_read == False  # noqa: E712
    ).update({"is_read": True})
    db.commit()
    return {"ok": True}
