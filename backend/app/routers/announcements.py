from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, require_roles
from app import models, schemas

router = APIRouter(prefix="/announcements", tags=["announcements"])


@router.get("", response_model=list[schemas.AnnouncementDetail])
def list_announcements(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(models.Announcement).order_by(models.Announcement.created_at.desc())
    out = []
    for a in q.all():
        audiences = {x.strip() for x in a.audience.split(",") if x.strip()}
        if a.author_id != user.id and "ALL" not in audiences and user.role.value not in audiences:
            continue
        out.append(schemas.AnnouncementDetail(
            id=a.id, author_id=a.author_id, title=a.title, body=a.body, audience=a.audience,
            created_at=a.created_at, author_name=db.get(models.User, a.author_id).full_name,
        ))
    return out


@router.post("", response_model=schemas.AnnouncementOut, status_code=201)
def create_announcement(
    payload: schemas.AnnouncementCreate,
    user: models.User = Depends(require_roles("PLACEMENT_OFFICER", "FACULTY")),
    db: Session = Depends(get_db),
):
    audiences = payload.audiences or ["ALL"]
    audience_str = ",".join(sorted(set(audiences)))
    announcement = models.Announcement(author_id=user.id, title=payload.title, body=payload.body, audience=audience_str)
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    return announcement


@router.delete("/{announcement_id}", status_code=204)
def delete_announcement(
    announcement_id: str,
    user: models.User = Depends(require_roles("PLACEMENT_OFFICER", "FACULTY")),
    db: Session = Depends(get_db),
):
    a = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    if not a:
        raise HTTPException(404, "Announcement not found")
    if a.author_id != user.id:
        raise HTTPException(403, "You can only delete your own announcements")
    db.delete(a)
    db.commit()
