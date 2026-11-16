# CareerLens — Application Discovery Report (Phase 1)

**Assessment Date:** 2026-11-16  
**Scope:** Full-stack discovery of CareerLens React/Vite frontend, Django REST Framework backend, PostgreSQL schema, JWT authentication, role-based access control, and seed/demo data.

---

## 1. Architecture & Runtime Overview

CareerLens is a decoupled full-stack job recruitment and AI career-readiness platform:

| Layer | Technology | Entry Point / Location | Local Runtime |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 19 + Vite 8 + React Router 7 + Axios | `frontend/src/main.jsx`, `frontend/src/routes/AppRoutes.jsx` | `http://localhost:5173` (`npm run dev`) |
| **Backend API** | Django 5.2 + Django REST Framework + SimpleJWT | `backend/config/urls.py`, `backend/config/settings.py` | `http://127.0.0.1:8000` (`manage.py runserver`) |
| **Database** | PostgreSQL (`DB_NAME=careerlens_db` locally; Neon via `DATABASE_URL` in prod) | `backend/config/settings.py` | `127.0.0.1:5432` |
| **Auth** | JWT Bearer (`access` 7d, `refresh` 30d with rotation) | `backend/apps/accounts/views.py`, `frontend/src/context/AuthContext.jsx` | `/api/auth/login/`, `/api/auth/me/`, `/api/auth/login/refresh/` |
| **Launcher** | Windows Batch | `scripts/dev.bat` (`--bot` optional) | Starts Django + Vite |
| **E2E Suite** | Playwright Test (`@playwright/test ^1.65.1`, CommonJS/ESM JS) | `playwright.config.js`, `tests/` | Chromium (`workers: 1`) |

### Key Environment & Feature Flags
- `frontend/.env`: `VITE_API_URL=http://127.0.0.1:8000/api`, `VITE_ENABLE_DEMO_MODE=true`
- `backend/.env`: `DEBUG=True`, `ENABLE_DEMO_MODE=True`, local PostgreSQL `careerlens_db`
- Demo accounts seeded via `manage.py seed_demo_data` (24 published jobs, 9 companies, 5+ candidates, 1 admin).

---

## 2. Frontend Route Inventory (`frontend/src/routes/AppRoutes.jsx`)

### Public Routes (`MainLayout`)
| Path | Component | Notes |
| :--- | :--- | :--- |
| `/` | `Home` | Landing page with platform stats, job highlights, Telegram bot showcase, theme/language toggle |
| `/auth`, `/login`, `/register` | `AuthPage` | Dual login/registration UI with Tether evading submit button + Quick Demo Login pills when `VITE_ENABLE_DEMO_MODE=true` |
| `/forgot-password` | `ForgotPassword` | Password reset request |
| `/reset-password`, `/reset-password/:uid/:token` | `ResetPassword` | Password reset confirmation |
| `/jobs/:id` | `PublicJobRedirect` | Redirects to `/candidate/jobs/:id` (triggers login redirect if unauthenticated) |
| `/404`, `*` | `NotFound` | 404 fallback |

### Candidate Routes (`ProtectedRoute role="candidate"` + `CandidateLayout`)
- `/candidate` — `CandidateDashboard`
- `/candidate/career-roadmap` — `CandidateCareerRoadmap`
- `/candidate/best-fit-jobs` — `CandidateBestFitJobs`
- `/candidate/jobs` — `CandidateJobs`
- `/candidate/jobs/:id` — `CandidateJobDetails`
- `/candidate/applications` — `CandidateApplications`
- `/candidate/applications/:id` — `CandidateApplicationDetails`
- `/candidate/saved-jobs` — `CandidateSavedJobs`
- `/candidate/interviews` — `CandidatePlaceholder` *(placeholder page)*
- `/candidate/messages` — `CandidateMessages`
- `/candidate/profile` — `CandidateProfile`
- `/candidate/resume` — `CandidateResume`
- `/candidate/cv-studio` — `CandidateCVStudio`
- `/candidate/cv-versions` — `CandidateCVVersions`
- `/candidate/notifications` — `AdminNotifications` *(shared notifications view)*
- `/candidate/settings` — `CandidatePlaceholder` *(placeholder page)*

### Company Routes (`ProtectedRoute role="company"` + `CompanyLayout`)
- `/company` — `CompanyDashboard`
- `/company/jobs` — `CompanyJobs`
- `/company/jobs/create` — `CompanyCreateJob`
- `/company/jobs/:id/edit` — `CompanyEditJob`
- `/company/applicants` — `CompanyApplicants`
- `/company/applicants/:id` — `CompanyApplicantDetails`
- `/company/candidate-ranking` — Redirects to `/company/applicants`
- `/company/interviews` — `CompanyInterviews`
- `/company/messages` — `CandidateMessages` *(shared messaging view)*
- `/company/profile` — `CompanyProfile`
- `/company/talent-pool` — `CandidatePlaceholder` *(placeholder page)*
- `/company/reports` — `CandidatePlaceholder` *(placeholder page)*
- `/company/notifications` — `AdminNotifications` *(shared notifications view)*
- `/company/settings` — `CandidatePlaceholder` *(placeholder page)*

### Admin Routes (`ProtectedRoute role="admin"` + `AdminLayout`)
- `/admin` — `AdminDashboard`
- `/admin/users` — `AdminUsers`
- `/admin/candidates` — `AdminCandidates`
- `/admin/companies` — `AdminCompanies`
- `/admin/verification` — `AdminVerification`
- `/admin/jobs` — `AdminJobs`
- `/admin/applications` — `AdminApplications`
- `/admin/reports` — `AdminReports`
- `/admin/categories` — `AdminCategories`
- `/admin/skills` — `AdminSkills`
- `/admin/audit-logs` — `AdminAuditLogs`
- `/admin/notifications` — `AdminNotifications`
- `/admin/settings` — `AdminSettings`

---

## 3. User Role & Permission Matrix

| Role | Frontend Guard | Backend Permissions | Permitted Core Actions | Restricted / Forbidden |
| :--- | :--- | :--- | :--- | :--- |
| **Anonymous** | Public routes only; private routes redirect to `/login?redirect=...` | `AllowAny` on `/api/health/`, `/api/jobs/` (published only), `/api/categories/`, `/api/skills/`, `/api/platform-stats/`, `/api/auth/login/`, `/api/auth/register/` | Browse landing page, view health check, register (`CANDIDATE` or `COMPANY`), login | Private API endpoints (`401 Unauthorized`), `/api/auth/users/`, `/api/applications/`, `/api/messages/` |
| **Candidate (`CANDIDATE`)** | `/candidate/*` | `IsCandidateUser`, `IsOwnerOrReadOnly` | View published jobs, save jobs, apply to published jobs (unique per candidate+job), view own applications/interviews/offers, edit own profile, upload/analyze resumes, career roadmap, send/read own messages | Create/edit/delete jobs (`403`), access `/api/auth/users/` (`403`), access `/api/auth/admin/dashboard/` (`403`), modify other candidates' profiles (`403`), alter offer salary (`403`) |
| **Company (`COMPANY`)** | `/company/*` | `IsCompanyUser`, `IsCompanyOrAdminUser`, `IsJobOwnerOrReadOnly`, `IsApplicationCompanyOrReadOnly` | Manage own `CompanyProfile`, create/edit/delete own `Job` records, view applications for own jobs, update application status, schedule interviews, issue offers, message applicants | Edit/delete another company's jobs (`403`), submit job applications (`403`), access `/api/auth/users/` (`403`), access `/api/auth/admin/dashboard/` (`403`) |
| **Admin (`ADMIN`)** | `/admin/*` | `IsAdminUserRole` | Full user CRUD (`UserViewSet`), company verification, view/manage all candidates, companies, jobs, applications, categories, skills, audit logs, admin stats | Cannot be self-assigned via `/api/auth/register/` (`400 Bad Request` role escalation block) |

---

## 4. Backend API Endpoint Map

| Prefix / Route | App / File | Key Operations |
| :--- | :--- | :--- |
| `GET /`, `GET /api/health/` | `config/urls.py` | API root metadata; PostgreSQL `SELECT 1` liveness/readiness (`200`/`503`) |
| `/api/auth/login/`, `/api/auth/login/refresh/` | `apps/accounts/urls.py` | JWT token issue & refresh |
| `/api/auth/register/`, `/api/auth/me/` | `apps/accounts/urls.py` | Account registration (blocks `ADMIN`), current user retrieve/patch |
| `/api/auth/forgot-password/`, `/api/auth/reset-password/` | `apps/accounts/urls.py` | Signed token password reset |
| `/api/auth/users/`, `/api/auth/candidates/`, `/api/auth/companies/`, `/api/auth/audit-logs/`, `/api/auth/admin/dashboard/` | `apps/accounts/urls.py` | Admin user management, profiles, audit logs, admin analytics |
| `/api/jobs/`, `/api/categories/`, `/api/skills/`, `/api/saved-jobs/`, `/api/platform-stats/`, `/api/recommendations/`, `/api/roadmap/*` | `apps/jobs/urls.py` | Job CRUD, search/location filtering, bookmarks, recommendations, roadmap |
| `/api/applications/`, `/api/application-history/`, `/api/interviews/`, `/api/offers/`, `/api/application-notes/` | `apps/applications/urls.py` | Full ATS pipeline |
| `/api/messages/`, `/api/notifications/` | `apps/messaging/urls.py` | Direct candidate-company messaging & in-app notifications |
| `/api/resumes/*` | `apps/resumes/urls.py` | Resume upload, parsing, Gemini CV Studio & DOCX export |
| `/api/telegram/webhook/` | `apps/telegram_bot/urls.py` | Telegram webhook (`POST`) & readiness (`GET`) |

---

## 5. Core End-to-End Workflows

1. **Authentication & Session Lifecycle:** Sign in via username/email -> receive JWT `access`/`refresh` -> `GET /api/auth/me/` -> persist compact user in `localStorage` -> refresh persistence & silent JWT refresh on `401` -> logout clears storage.
2. **Job Lifecycle (Company):** Company creates job -> validates required fields -> publishes/edits job -> visible in Candidate search -> deleted safely (for test-created jobs).
3. **Application Lifecycle (Candidate ↔ Company):** Candidate searches/opens job -> submits application (duplicate blocked) -> Company reviews applicant & updates status (`APPLIED` -> `REVIEWING` / `SHORTLISTED` / `INTERVIEW`) -> Candidate sees updated status.
4. **Messaging Lifecycle:** Candidate and Company exchange messages scoped to valid conversations; recipients cannot tamper with message text (`403`).
5. **Admin Governance:** Admin views dashboard stats, manages users/companies/jobs/categories/skills, and enforces verification status.
