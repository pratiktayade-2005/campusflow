"""
Populates the database with demo accounts and sample data so you can explore
CampusFlow immediately after setup.

Run with:  python seed.py   (from inside backend/, with venv activated)
"""
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app.database import SessionLocal, engine, Base
from app import models
from app.security import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

PASSWORD = "password123"


def make_user(email, name, role):
    u = db.query(models.User).filter(models.User.email == email).first()
    if u:
        return u
    u = models.User(email=email, full_name=name, role=role, hashed_password=hash_password(PASSWORD))
    db.add(u)
    db.flush()
    return u


print("Seeding CampusFlow demo data...")

officer = make_user("officer@campusflow.edu", "Priya Nair", models.RoleEnum.PLACEMENT_OFFICER)
faculty_user = make_user("faculty@campusflow.edu", "Dr. Arvind Rao", models.RoleEnum.FACULTY)
if not db.query(models.Faculty).filter(models.Faculty.user_id == faculty_user.id).first():
    db.add(models.Faculty(user_id=faculty_user.id, department="Computer Science"))

students_data = [
    ("aisha.khan@student.edu", "Aisha Khan", "CS21001", "Computer Science", 2026, "8.7", 0),
    ("rohan.mehta@student.edu", "Rohan Mehta", "CS21002", "Computer Science", 2026, "7.9", 1),
    ("sneha.patil@student.edu", "Sneha Patil", "EC21014", "Electronics", 2026, "9.1", 0),
    ("karan.verma@student.edu", "Karan Verma", "ME21030", "Mechanical", 2026, "6.8", 2),
    ("diya.iyer@student.edu", "Diya Iyer", "CS21045", "Computer Science", 2026, "8.2", 0),
]
students = []
for email, name, roll, branch, year, cgpa, backlogs in students_data:
    u = make_user(email, name, models.RoleEnum.STUDENT)
    s = db.query(models.Student).filter(models.Student.user_id == u.id).first()
    if not s:
        s = models.Student(
            user_id=u.id, roll_number=roll, branch=branch, graduation_year=year,
            cgpa=Decimal(cgpa), backlogs=backlogs, skills="Python, React, SQL",
        )
        db.add(s)
        db.flush()
    students.append(s)

companies_data = [
    ("recruiter@techcorp.com", "Priyanka Shah", "TechCorp Solutions", "Product-based software company", "Bengaluru", "IT Services"),
    ("hr@financeplus.com", "Vikram Singh", "FinancePlus", "Fintech and digital banking", "Mumbai", "Fintech"),
]
companies = []
for email, name, company_name, desc, loc, industry in companies_data:
    u = make_user(email, name, models.RoleEnum.RECRUITER)
    c = db.query(models.Company).filter(models.Company.name == company_name).first()
    if not c:
        c = models.Company(owner_id=u.id, name=company_name, description=desc, location=loc, industry=industry, status="APPROVED")
        db.add(c)
        db.flush()
    companies.append(c)

db.commit()

jobs_data = [
    (companies[0], "Software Engineer", "Full-time", Decimal("12.5"), "Bengaluru", Decimal("7.0"), 1, "Computer Science,Electronics", 5),
    (companies[0], "Data Analyst Intern", "Internship", Decimal("6.0"), "Remote", Decimal("6.5"), 2, "", 3),
    (companies[1], "Associate Software Developer", "Full-time", Decimal("9.5"), "Mumbai", Decimal("6.0"), 1, "Computer Science,Mechanical", 4),
]
jobs = []
for company, title, jtype, package, loc, min_cgpa, max_backlogs, branches, openings in jobs_data:
    j = db.query(models.Job).filter(models.Job.title == title, models.Job.company_id == company.id).first()
    if not j:
        j = models.Job(
            company_id=company.id, title=title, job_type=jtype, package_lpa=package, location=loc,
            min_cgpa=min_cgpa, max_backlogs=max_backlogs, allowed_branches=branches, openings=openings,
            description=f"Great opportunity to join {company.name} as a {title}.",
            deadline=datetime.now(timezone.utc) + timedelta(days=21),
        )
        db.add(j)
        db.flush()
    jobs.append(j)

db.commit()

# a couple of applications + one offer for demo
if not db.query(models.Application).first():
    app1 = models.Application(student_id=students[0].id, job_id=jobs[0].id, status="SHORTLISTED")
    app2 = models.Application(student_id=students[1].id, job_id=jobs[0].id, status="APPLIED")
    app3 = models.Application(student_id=students[2].id, job_id=jobs[2].id, status="OFFERED")
    db.add_all([app1, app2, app3])
    db.flush()
    db.add(models.Offer(application_id=app3.id, package_lpa=Decimal("9.5"), role="Associate Software Developer", status="ACCEPTED"))
    db.add(models.Interview(application_id=app1.id, scheduled_at=datetime.now(timezone.utc) + timedelta(days=3), round_name="Technical"))

if not db.query(models.Announcement).first():
    db.add(models.Announcement(author_id=officer.id, title="Placement drive kickoff", body="The 2026 placement season officially begins next Monday. Update your profiles!", audience="ALL"))

db.commit()
db.close()

print("Done. Demo login credentials (password: password123):")
print("  Placement Officer : officer@campusflow.edu")
print("  Faculty           : faculty@campusflow.edu")
print("  Student            : aisha.khan@student.edu")
print("  Recruiter          : recruiter@techcorp.com")
