# CareerLens — Playwright QA Test Results (Phase 6 & 9)

**Execution Date:** 2026-11-16  
**Runner:** Playwright Test (`chromium`, `workers: 1`, `retries: 0`)  
**Total Duration:** 2.7 minutes  
**HTML Report:** `playwright-report/index.html` (`npx playwright show-report`)

---

## Execution Summary (Post-Fix Regression Run)

| Metric | Count |
| :--- | :---: |
| **Total Tests** | 25 |
| **Passed** | 25 |
| **Failed** | 0 |
| **Skipped** | 0 |
| **Blocked** | 0 |

> Initial QA discovery run (`22 passed, 3 failed`) identified `BUG-01`, `BUG-02`, and `BUG-03`. After applying approved fixes and rebuilding (`vite build`), the full 25-test regression suite passed (`25 passed in 2.7m`, exit code `0`).

---

## Suite-by-Suite Breakdown

### 1. Public Landing & Health (`tests/e2e/public/landing-and-health.spec.js`) — **4/4 Passed**
- `GET /api/health/` returns HTTP `200` with `{"status":"ok","service":"CareerLens API","database":"connected"}`.
- `POST /api/health/` is rejected cleanly (`403` CSRF / `405`).
- Landing page `/` loads with zero broken images, zero console errors, and zero HTTP 5xx responses.
- Unknown routes render the 404 Not Found page without crashing.

### 2. Auth, Session Persistence & Storage Quota (`tests/e2e/auth/login-and-session.spec.js`) — **6/6 Passed**
- Invalid credentials display `.tether-error` and keep user on `/login`.
- Empty submission is blocked by required input constraints.
- Candidate login (`demo_cand_sreymom`) redirects to `/candidate`, persists compact `"user"` in `localStorage` (`< 600` chars, no `avatar`, no `jobs`), survives page reload, and clears all auth keys on Logout.
- Company Quick Demo login pill fills credentials, logs into `/company`, and survives page reload.
- Admin login (`demo_admin`) logs into `/admin` and survives page reload.
- Silent JWT refresh recovers session cleanly on reload when `access_token` is expired/corrupted while `refresh_token` is valid.

### 3. Registration & Role Escalation (`tests/e2e/auth/registration.spec.js`) — **2/2 Passed**
- Backend blocks `ADMIN` role self-assignment on `POST /api/auth/register/` (`400 Bad Request`).
- Candidate UI registration on `/register` creates account, signs in to `/candidate`, rejects duplicate email (`400`), and cleans up test user via Admin API.

### 4. Role-Based Access Control (`tests/e2e/auth/authorization.spec.js`) — **4/4 Passed**
- Unauthenticated access to `/candidate/jobs` and `/admin` redirects to `/login?redirect=...`.
- Unauthenticated API requests to `/auth/me/`, `/auth/users/`, `/auth/admin/dashboard/`, `/applications/`, `/messages/` return `401`.
- Candidate is redirected away from `/company` & `/admin`, and receives `403` on admin/job-creation endpoints.
- Company is redirected away from `/admin`, and receives `403` when attempting to `PATCH`/`DELETE` another company's published job.

### 5. Candidate Workflows (`tests/e2e/candidate/workflows.spec.js`) — **3/3 Passed**
- **Passed:** Candidate Dashboard loads stats/links cleanly.
- **Passed:** Candidate Jobs search, filter, and `/candidate/jobs/:id` match backend API data.
- **Passed:** All 10 secondary routes (including `/candidate/cv-studio`) load and settle with zero console errors and zero 5xx responses (`BUG-03` fixed).

### 6. Company Workflows (`tests/e2e/company/workflows.spec.js`) — **2/2 Passed**
- **Passed:** Company secondary pages (`/company`, `/company/profile`, `/company/jobs`, `/company/applicants`, `/company/interviews`, `/company/messages`, `/company/notifications`) load cleanly.
- **Passed:** Company job lifecycle (`/company/jobs/create` -> `/company/jobs` -> `/company/jobs/:id/edit` with pre-filled values verified -> update & delete cleanup) succeeds (`BUG-01` fixed).

### 7. Admin Workflows (`tests/e2e/admin/workflows.spec.js`) — **1/1 Passed**
- All 13 admin routes (`/admin`, `users`, `candidates`, `companies`, `verification`, `jobs`, `applications`, `reports`, `categories`, `skills`, `audit-logs`, `notifications`, `settings`) load with zero console errors and zero 5xx responses.

### 8. End-to-End Application & Messaging Lifecycle (`tests/e2e/e2e-lifecycle.spec.js`) — **1/1 Passed**
- Company creates published test job -> Candidate discovers & applies in UI -> Duplicate application blocked (`400`) -> Company inspects applicant & shortlists -> Candidate sees `Shortlisted` status in `/candidate/applications` -> Empty message rejected (`400`) -> Test job cleaned up.

### 9. Responsive & Placeholder Audit (`tests/e2e/shared/navigation-and-responsive.spec.js`) — **2/2 Passed**
- **Passed:** Placeholder routes render non-empty fallback views.
- **Passed:** Landing (`/`), Login (`/login`), Desktop Candidate Jobs (`1440x900`), and Mobile Candidate Jobs (`390x844`) all have `<= 4px` horizontal overflow (`BUG-02` fixed).
