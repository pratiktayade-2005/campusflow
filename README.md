# CampusFlow

A campus placement operations platform — students apply to jobs, recruiters manage
hiring pipelines, faculty and placement officers track outcomes. Built with a clean,
minimal stack so it's easy to read, run, and explain in an interview.

**Stack:** React (Vite) · FastAPI · PostgreSQL · SQLAlchemy · Tailwind CSS (utilities) + a small hand-rolled design system (theme.css) for cards/badges/tables

## Project structure

```
campusflow/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app + router registration
│   │   ├── config.py          # env-based settings
│   │   ├── database.py        # SQLAlchemy engine/session
│   │   ├── models.py          # ORM models (Postgres tables)
│   │   ├── schemas.py         # Pydantic request/response models
│   │   ├── security.py        # password hashing + JWT
│   │   ├── deps.py            # auth dependencies (get_current_user, require_roles)
│   │   └── routers/           # one file per resource (auth, jobs, applications, ...)
│   ├── seed.py                 # demo data loader
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api.js               # fetch wrapper + auth header injection
    │   ├── context/AuthContext.jsx
    │   ├── components/          # Layout, ProtectedRoute, shared UI (ui.jsx)
    │   ├── pages/                # one file per screen, dashboards/ per role
    │   └── styles/               # theme.css (design tokens) + global.css
    └── package.json
```

## Roles

- **Student** — browse eligible jobs, apply, track applications, view interviews/offers, manage profile & resume.
- **Recruiter** — manage company profile, post jobs, review applicants, schedule interviews, extend offers.
- **Placement Officer** — approve companies, view platform-wide analytics, students, jobs and offers, post announcements.
- **Faculty** — view department-wise student and placement stats, post announcements.

## 1. Backend setup (FastAPI + PostgreSQL)

### Prerequisites
- Python 3.10+
- PostgreSQL running locally

### Steps

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# create the database (run once)
createdb campusflow                # or use psql / pgAdmin to create it

cp .env.example .env
# edit .env if your Postgres user/password/db name differ:
#   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/campusflow
#   SECRET_KEY=some-long-random-string

# tables are created automatically on first run, then seed demo data:
python seed.py

uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### Demo accounts (password: `password123`)
| Role | Email |
|---|---|
| Placement Officer | officer@campusflow.edu |
| Faculty | faculty@campusflow.edu |
| Student | aisha.khan@student.edu |
| Recruiter | recruiter@techcorp.com |

## 2. Frontend setup (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173` and talks to the API at `http://localhost:8000`
(override with a `.env` containing `VITE_API_URL=http://localhost:8000` if needed).

## How the pieces fit together (for interviews)

- **Auth**: `POST /auth/register` and `/auth/login` return a JWT; the frontend stores it in
  `localStorage` and `api.js` attaches it as `Authorization: Bearer <token>` on every request.
  `deps.py` decodes the token per-request and `require_roles(...)` gates endpoints by role.
- **Eligibility logic**: `routers/jobs.py::is_eligible` checks a student's CGPA, backlog count,
  and branch against a job's requirements — both to show an "eligible" flag in job listings and
  to block ineligible applications server-side.
- **Notifications**: status changes, interview scheduling, and offers write rows to the
  `notifications` table so the bell icon in the topbar has something to show without polling logic
  living in the frontend.
- **Analytics**: `routers/analytics.py` uses SQL aggregation (`GROUP BY`, `func.count/avg`) rather
  than pulling everything into Python, so the officer/recruiter dashboards stay fast as data grows.
- **File uploads**: resumes are stored on disk under `backend/uploads/` and served via FastAPI's
  `StaticFiles` mount at `/uploads/...`; only the filename is stored in Postgres.

## Notes

- `backend/uploads/` is created automatically and is git-ignored.
- All monetary figures are package-per-annum in lakhs (LPA), matching Indian campus hiring conventions — rename freely if you adapt this elsewhere.
