# CareerLens — Classroom Demo Readiness Assessment (Phase 9)

**Assessment Date:** 2026-11-16  
**Overall Readiness:** **CONDITIONAL GO (Ready for Demo if Job Editing is avoided OR `BUG-01` is fixed first)**

---

## 1. Critical Blockers
- **None (0 Critical bugs).** Backend, PostgreSQL (`/api/health/`), authentication, RBAC security, landing page, candidate job search/apply, and admin dashboards all work reliably.

## 2. High-Priority Issues
- **`BUG-01` (High): Company Edit Job (`/company/jobs/:id/edit`) is broken.** Opening the edit page clears existing fields (`Location`, `Description`, `Salary`, `Skills`, dropdowns) and blocks saving. **Fix this before demonstrating Company Job Editing.**

## 3. Verified Working Demo Workflows
- **Public & Health:** Landing page (`/`), 404 handling, and `GET /api/health/` (`200` + PostgreSQL `SELECT 1`).
- **Authentication & Storage:** Candidate, Company, and Admin login (including Quick Demo pills), session persistence on refresh, compact `localStorage` persistence (no quota errors), silent JWT refresh, registration, and logout.
- **Security / RBAC:** Cross-role route guards, `ADMIN` registration escalation block (`400`), `401` anonymous API protection, and cross-company resource isolation (`403`).
- **Candidate Flow:** Dashboard, job search/details, submitting applications, duplicate application prevention, and viewing updated application statuses.
- **Company Flow:** Creating new jobs (`/company/jobs/create`), viewing applicant details, and updating application statuses (`SHORTLISTED`).
- **Admin Flow:** All 13 admin pages load cleanly with live data.

## 4. Remaining Risks & Recommendations Before Classroom Demo
1. **Must-Fix Before Demo (`BUG-01`):** Forward `defaultValue` in `Input.jsx`, `Textarea.jsx`, and `Select.jsx`, and fix `salary_min`/`salary_max` mapping in `JobForm.jsx` so Company Job Editing works.
2. **Recommended Polish (`BUG-02`, `BUG-03`):** Fix `111px` mobile overflow on `/candidate/jobs` (`Jobs.css`) if demonstrating on mobile, and add unique `key` in `CVStudio.jsx` to silence React's console error.
3. **Demo Script Hygiene (`OBS-01`):** Avoid clicking placeholder sidebar links (`/candidate/interviews`, `/candidate/settings`, `/company/talent-pool`, `/company/reports`, `/company/settings`) during the live walkthrough.
4. **Cold-Start Protection:** Ensure Render + Neon + UptimeRobot (`/api/health/`) are active 15–30 minutes before the presentation.
