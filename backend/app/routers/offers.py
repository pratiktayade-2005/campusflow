from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_roles
from app import models, schemas

router = APIRouter(prefix="/offers", tags=["offers"])


def notify(db: Session, user_id, title: str, body: str):
    db.add(models.Notification(user_id=user_id, title=title, body=body))


@router.post("", response_model=schemas.OfferOut, status_code=201)
def make_offer(
    payload: schemas.OfferCreate,
    user: models.User = Depends(require_roles("RECRUITER")),
    db: Session = Depends(get_db),
):
    app_row = db.query(models.Application).filter(models.Application.id == payload.application_id).first()
    if not app_row:
        raise HTTPException(404, "Application not found")
    if app_row.job.company.owner_id != user.id:
        raise HTTPException(403, "Not your job posting")
    if app_row.offer:
        raise HTTPException(400, "An offer already exists for this application")

    offer = models.Offer(**payload.model_dump())
    db.add(offer)
    app_row.status = "OFFERED"
    notify(db, app_row.student.user_id, "You got an offer! \U0001F389",
           f"{app_row.job.company.name} has extended an offer for {payload.role}.")
    db.commit()
    db.refresh(offer)
    return offer


@router.get("/mine", response_model=list[schemas.OfferDetail])
def my_offers(user: models.User = Depends(require_roles("STUDENT")), db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.user_id == user.id).first()
    offers = db.query(models.Offer).join(models.Application).filter(
        models.Application.student_id == student.id
    ).order_by(models.Offer.issued_at.desc()).all()
    out = []
    for o in offers:
        out.append(schemas.OfferDetail(
            id=o.id, application_id=o.application_id, package_lpa=o.package_lpa, role=o.role,
            status=o.status, issued_at=o.issued_at, joining_date=o.joining_date,
            job_title=o.application.job.title, company_name=o.application.job.company.name,
        ))
    return out


@router.put("/{offer_id}/respond", response_model=schemas.OfferOut)
def respond_to_offer(
    offer_id: str,
    payload: schemas.OfferRespond,
    user: models.User = Depends(require_roles("STUDENT")),
    db: Session = Depends(get_db),
):
    student = db.query(models.Student).filter(models.Student.user_id == user.id).first()
    offer = db.query(models.Offer).join(models.Application).filter(
        models.Offer.id == offer_id, models.Application.student_id == student.id
    ).first()
    if not offer:
        raise HTTPException(404, "Offer not found")
    offer.status = "ACCEPTED" if payload.accept else "DECLINED"
    offer.application.status = "OFFERED" if payload.accept else "REJECTED"
    db.commit()
    db.refresh(offer)
    return offer


@router.get("", response_model=list[schemas.OfferDetail])
def all_offers(_: models.User = Depends(require_roles("PLACEMENT_OFFICER")), db: Session = Depends(get_db)):
    offers = db.query(models.Offer).order_by(models.Offer.issued_at.desc()).all()
    out = []
    for o in offers:
        out.append(schemas.OfferDetail(
            id=o.id, application_id=o.application_id, package_lpa=o.package_lpa, role=o.role,
            status=o.status, issued_at=o.issued_at, joining_date=o.joining_date,
            job_title=o.application.job.title, company_name=o.application.job.company.name,
            student_name=o.application.student.user.full_name,
        ))
    return out
