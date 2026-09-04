from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.deps import require_roles
from app import models, schemas

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/officer", response_model=schemas.OfficerStats)
def officer_stats(_: models.User = Depends(require_roles("PLACEMENT_OFFICER")), db: Session = Depends(get_db)):
    total_students = db.query(models.Student).count()
    total_companies = db.query(models.Company).count()
    total_jobs = db.query(models.Job).count()
    open_jobs = db.query(models.Job).filter(models.Job.status == "OPEN").count()
    total_applications = db.query(models.Application).count()

    offers = db.query(models.Offer).filter(models.Offer.status.in_(["OFFERED", "ACCEPTED"])).all()
    total_offers = len(offers)
    placed_student_ids = {o.application.student_id for o in offers if o.status == "ACCEPTED"}
    students_placed = len(placed_student_ids)
    placement_rate = round((students_placed / total_students) * 100, 1) if total_students else 0.0

    packages = [float(o.package_lpa) for o in offers]
    avg_package = round(sum(packages) / len(packages), 2) if packages else 0.0
    max_package = round(max(packages), 2) if packages else 0.0

    branch_rows = db.query(
        models.Student.branch, func.count(models.Student.id)
    ).group_by(models.Student.branch).all()
    branch_wise = [{"branch": b, "count": c} for b, c in branch_rows]

    month_rows = db.query(
        func.to_char(models.Offer.issued_at, 'YYYY-MM'), func.count(models.Offer.id)
    ).group_by(func.to_char(models.Offer.issued_at, 'YYYY-MM')).order_by(
        func.to_char(models.Offer.issued_at, 'YYYY-MM')
    ).all()
    monthly_offers = [{"month": m, "count": c} for m, c in month_rows]

    company_rows = db.query(
        models.Company.name, func.count(models.Offer.id)
    ).join(models.Job, models.Job.company_id == models.Company.id).join(
        models.Application, models.Application.job_id == models.Job.id
    ).join(models.Offer, models.Offer.application_id == models.Application.id).group_by(
        models.Company.name
    ).order_by(func.count(models.Offer.id).desc()).limit(5).all()
    top_companies = [{"company": c, "offers": n} for c, n in company_rows]

    return schemas.OfficerStats(
        total_students=total_students, total_companies=total_companies, total_jobs=total_jobs,
        open_jobs=open_jobs, total_applications=total_applications, total_offers=total_offers,
        students_placed=students_placed, placement_rate=placement_rate, avg_package=avg_package,
        max_package=max_package, branch_wise=branch_wise, monthly_offers=monthly_offers,
        top_companies=top_companies,
    )


@router.get("/recruiter", response_model=schemas.RecruiterStats)
def recruiter_stats(user: models.User = Depends(require_roles("RECRUITER")), db: Session = Depends(get_db)):
    company = db.query(models.Company).filter(models.Company.owner_id == user.id).first()
    if not company:
        return schemas.RecruiterStats(
            total_jobs=0, open_jobs=0, total_applicants=0, shortlisted=0,
            interviews_scheduled=0, offers_made=0, funnel=[],
        )

    job_ids = [j.id for j in db.query(models.Job.id).filter(models.Job.company_id == company.id).all()]
    total_jobs = len(job_ids)
    open_jobs = db.query(models.Job).filter(models.Job.company_id == company.id, models.Job.status == "OPEN").count()

    apps_q = db.query(models.Application).filter(models.Application.job_id.in_(job_ids)) if job_ids else db.query(models.Application).filter(False)
    total_applicants = apps_q.count()
    shortlisted = apps_q.filter(models.Application.status.in_(["SHORTLISTED", "INTERVIEWING", "OFFERED"])).count()
    interviews_scheduled = db.query(models.Interview).join(models.Application).filter(
        models.Application.job_id.in_(job_ids)
    ).count() if job_ids else 0
    offers_made = db.query(models.Offer).join(models.Application).filter(
        models.Application.job_id.in_(job_ids)
    ).count() if job_ids else 0

    funnel = [
        {"stage": "Applied", "count": total_applicants},
        {"stage": "Shortlisted", "count": shortlisted},
        {"stage": "Interviewing", "count": apps_q.filter(models.Application.status == "INTERVIEWING").count()},
        {"stage": "Offered", "count": offers_made},
    ]

    return schemas.RecruiterStats(
        total_jobs=total_jobs, open_jobs=open_jobs, total_applicants=total_applicants,
        shortlisted=shortlisted, interviews_scheduled=interviews_scheduled, offers_made=offers_made,
        funnel=funnel,
    )
