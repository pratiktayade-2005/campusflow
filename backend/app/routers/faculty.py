from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.deps import require_roles
from app import models

router = APIRouter(prefix="/faculty", tags=["faculty"])


@router.get("/department-stats")
def department_stats(
    _: models.User = Depends(require_roles("FACULTY", "PLACEMENT_OFFICER")),
    db: Session = Depends(get_db),
):
    rows = db.query(
        models.Student.branch,
        func.count(models.Student.id),
        func.avg(models.Student.cgpa),
    ).group_by(models.Student.branch).all()

    result = []
    for branch, count, avg_cgpa in rows:
        placed = db.query(models.Offer).join(models.Application).join(models.Student).filter(
            models.Student.branch == branch, models.Offer.status == "ACCEPTED"
        ).count()
        result.append({
            "branch": branch,
            "student_count": count,
            "avg_cgpa": round(float(avg_cgpa or 0), 2),
            "placed": placed,
        })
    return result
