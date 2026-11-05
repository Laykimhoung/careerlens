# CareerLens — Team Workflow Guide

This document defines each team member's responsibilities, file ownership, collaboration rules, and Git workflow.

**Project:** CareerLens  
**Frontend:** React 19 + Vite 8  
**Backend:** Django 5.2 + Django REST Framework + Gunicorn  
**Database:** PostgreSQL (Neon Serverless)  
**DevOps:** Vercel (Frontend CDN) + Render (Backend Web Service) + UptimeRobot (24/7 Keep-Alive)  
**Telegram Bot:** `@careerlens_jobs_bot` (pyTelegramBotAPI)

---

## 1. Team Members and Core Responsibilities

The CareerLens development team consists of **4 members**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   Lay Kimhoung (Team Leader)                           │
│  Backend REST API • PostgreSQL Database • Telegram Bot • DevOps/Deploy  │
│                   & Supporting Frontend Architecture                   │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
       ┌─────────────────────────┐      ┌─────────────────────────┐
       │        Eiv Youe         │      │        Sokun En         │
       │   Frontend Engineer     │      │   Frontend Engineer     │
       │  All Dashboards & ATS   │      │ Landing Page & Auth Flow│
       │(Candidate/Company/Admin)│      │  (Home, Login, Register)│
       └─────────────────────────┘      └─────────────────────────┘
```

---

### Member 1 (Team Leader) — Lay Kimhoung
* **Branch:** `backend/kimhoung`
* **Role:** Team Lead, Full-Stack Architect, Backend Developer & DevOps Engineer

**Core Responsibilities:**
1. **Backend REST API Architecture:**
   * Design, implement, and maintain Django 5.2 apps: `accounts`, `jobs`, `applications`, `messaging`, `telegram_bot`, `resumes`.
   * Secure JWT authentication (`SimpleJWT`), role-based permissions (`IsCandidateUser`, `IsCompanyUser`, `IsAdminUserRole`), and model-level audit logging.
   * Multi-worker, multi-threaded Gunicorn production server configuration (`--workers 2 --threads 4 --worker-class gthread`).
2. **Database Engineering & Migrations:**
   * Schema design, indexing, foreign keys, and transaction rollbacks for PostgreSQL / Neon.
   * Universal seed management commands (`seed_demo_data`, `clear_demo_data`).
3. **Telegram Bot Integration (`@careerlens_jobs_bot`):**
   * Webhook ingestion endpoint (`/api/telegram/webhook/`), polling fallback daemon, natural language keyword matching, safe HTML entity sanitizer, and persistent mobile reply keyboard.
4. **DevOps & Production Deployment:**
   * CI/CD deployment pipelines on **Render** (Backend), **Vercel** (Frontend), and **Neon** (Database).
   * **UptimeRobot Keep-Alive configuration** to prevent Render free-tier cold-start sleeps.
   * Reverse proxy SSL header termination, CORS policies, and security headers.
5. **Supporting Frontend Architecture:**
   * Client-side routing with `safeLazy` code splitting and `<Suspense>`.
   * Protected route guards (`ProtectedRoute.jsx`) with post-auth deep-link preservation (`?redirect=...`).
   * BYOK Google Gemini API universal validation across models (`gemini-3.5-flash-lite`, `gemini-3.8-flash`).

#### Files Owned / Maintained by Kimhoung:
```text
backend/
├── apps/
│   ├── accounts/
│   ├── jobs/
│   ├── applications/
│   ├── messaging/
│   ├── telegram_bot/
│   └── resumes/
├── config/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── Procfile
├── requirements.txt
└── manage.py

frontend/
├── vercel.json
├── vite.config.js
├── src/routes/AppRoutes.jsx
├── src/components/common/ProtectedRoute.jsx
├── src/services/api.js
└── src/pages/common/NotFound/

scripts/
└── build.sh
docs/
└── (All architectural specifications & deployment guides)
```

---

### Member 2 — Eiv Youe
* **Branch:** `frontend/youe`
* **Role:** Frontend Engineer — Dashboards, ATS & Workspaces

**Core Responsibilities:**
1. **Candidate Dashboard & Workspaces:**
   * Candidate Dashboard metrics and recent application tracking.
   * AI Career Toolkit: CV Studio, CV Versions, and Gemini BYOK integration.
   * Interactive Career Roadmap with milestones and skill development paths.
   * Best-Fit Job recommendations, active job filtering, and application submission modal.
   * Saved Jobs and Recruiter Direct Messaging (`/candidate/messages`).
2. **Company Recruitment Workspace:**
   * Company Dashboard analytics (active listings, candidate views, total hires).
   * Job Posting Engine: `CreateJob.jsx` and `EditJob.jsx` with rich compensation and skill tags.
   * Applicant Tracking System (ATS): Multi-stage review (`APPLIED` $\to$ `REVIEWING` $\to$ `INTERVIEW` $\to$ `OFFERED` $\to$ `REJECTED`).
   * Candidate Ranking & Interview Scheduling modal.
3. **Admin Management Portal:**
   * Platform Analytics Dashboard (KPIs, revenue metrics, user distribution).
   * User Administration (`Users.jsx`, `Candidates.jsx`, `Companies.jsx`).
   * Company Verification approval queue.
   * Audit Logs and Platform Settings.

#### Files Owned / Maintained by Youe:
```text
frontend/src/pages/
├── candidate/
│   ├── Dashboard/
│   ├── Profile/
│   ├── Resume/
│   ├── CVStudio/
│   ├── CVVersions/
│   ├── CareerRoadmap/
│   ├── BestFitJobs/
│   ├── Jobs/
│   ├── JobDetails/
│   ├── Applications/
│   ├── ApplicationDetails/
│   ├── SavedJobs/
│   └── Messages/
├── company/
│   ├── Dashboard/
│   ├── Profile/
│   ├── Jobs/
│   ├── CreateJob/
│   ├── EditJob/
│   ├── Applicants/
│   ├── ApplicantDetails/
│   └── Interviews/
└── admin/
    ├── Dashboard/
    ├── Users/
    ├── Candidates/
    ├── Companies/
    ├── Verification/
    ├── Jobs/
    ├── Applications/
    ├── Reports/
    ├── Categories/
    ├── Skills/
    └── AuditLogs/

frontend/src/components/
├── candidate/
├── company/
└── admin/
```

---

### Member 3 — Sokun En
* **Branch:** `frontend/en`
* **Role:** Frontend Engineer — Landing Page & Authentication

**Core Responsibilities:**
1. **Public Landing Page Experience:**
   * Responsive Landing Page (`Home.jsx` & `Home.css`) with Light/Dark mode theming.
   * Hero section with dynamic typography, call-to-action buttons, and quick-access Telegram bot pill.
   * Platform statistics counter synchronized with live backend metrics (`/api/platform-stats/`).
   * Features showcase, How It Works timeline, Recruitment Pipeline, and Team Orbit section.
   * **Instant Telegram Job Search Showcase Section (`#telegram-bot`)** with realistic chat mockup.
   * Capsule dock navigation bar with scroll-spy active section highlighting.
2. **Authentication Ecosystem:**
   * Sci-fi cybernetic authentication interface (`AuthPage.jsx` & `AuthPage.css`).
   * Dual-mode Sign In / Sign Up with dynamic role toggling (`CANDIDATE` vs. `COMPANY`).
   * Candidate skills onboarding chip selector during registration.
   * Contextual redirect preservation for users coming from Telegram deep links.
   * Forgot Password & Reset Password multi-step token verification.
   * Role Switcher dropdown and theme/language internationalization controls.

#### Files Owned / Maintained by En:
```text
frontend/src/pages/
├── landing/
│   └── Home/
│       ├── Home.jsx
│       └── Home.css
└── auth/
    ├── AuthPage/
    │   ├── AuthPage.jsx
    │   └── AuthPage.css
    ├── ForgotPassword/
    │   ├── ForgotPassword.jsx
    │   └── ForgotPassword.css
    └── ResetPassword/
        ├── ResetPassword.jsx
        └── ResetPassword.css

frontend/src/components/
├── landing/
├── auth/
└── ui/
    ├── Radar.jsx
    ├── OrbitImages.jsx
    └── SideRays.jsx

frontend/src/context/
├── ThemeContext.jsx
└── LanguageContext.jsx
```

---

## 2. Git Branching Strategy & Workflow

* **Main Branch (`main`):** Production-ready code. Deploys directly to Vercel and Render.
* **Developer Working Branches:**
  * `backend/kimhoung` (Kimhoung)
  * `frontend/youe` (Youe)
  * `frontend/en` (En)

### Collaboration Rules:
1. Always pull latest `main` before starting work:
   ```bash
   git checkout <your-branch>
   git pull origin main
   ```
2. Never commit secrets, `.env` files, or API keys.
3. Test production builds locally before opening PRs:
   * Backend: `python manage.py test apps --noinput`
   * Frontend: `npm --prefix frontend run build`
4. Kimhoung reviews and coordinates cross-layer merges into `main`.
