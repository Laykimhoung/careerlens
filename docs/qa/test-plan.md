# CareerLens — Comprehensive QA Test Plan (Phase 3)

## 1. Objectives & Database Safety Strategy

- **Goal:** Verify functional workflows, authentication, RBAC authorization, API contracts, form validation, UI/console/network health, and responsive layouts before the classroom demonstration.
- **Database Safety:**
  - Tests run strictly against the local development backend (`http://127.0.0.1:8000`) and local PostgreSQL (`careerlens_db`) — **never** against production Render/Neon.
  - Existing seeded demo accounts (`demo_cand_sreymom`, `demo_comp_mekong`, `demo_admin`) are used read-only or for non-destructive workflows.
  - Any newly created jobs, applications, saved jobs, or registered users are uniquely prefixed with `[QA-E2E]` / `qa_e2e_<timestamp>` and cleaned up via authenticated API calls in `afterAll` / `afterEach` hooks where permitted.
  - Admin-created test users or isolated test records are cleaned up via the Admin API.

---

## 2. Test Suites & Coverage Matrix

| Suite File | Category | Key Scenarios | Priority |
| :--- | :--- | :--- | :--- |
| `tests/e2e/public/landing-and-health.spec.js` | Smoke & Public | Landing page load, `GET /api/health/` (`200` JSON), theme/language toggle, 404 route, zero console/5xx errors | Critical |
| `tests/e2e/auth/login-and-session.spec.js` | Auth | Valid login (Candidate/Company/Admin), Quick Demo Login pills, invalid credentials, empty/malformed submit, refresh persistence, `localStorage` compact `user` (no `avatar`/quota error), silent token refresh, logout | Critical |
| `tests/e2e/auth/registration.spec.js` | Auth | Candidate & Company registration via UI/API, duplicate email/username rejection, admin role escalation blocked (`400`) | High |
| `tests/e2e/auth/authorization.spec.js` | RBAC | Unauthenticated redirect (`?redirect=...`), cross-role UI redirects (Candidate→`/admin`/`/company`, Company→`/admin`), backend API `401`/`403` enforcement on `/api/auth/users/`, `/api/auth/admin/dashboard/`, cross-company job edit/delete | Critical |
| `tests/e2e/candidate/workflows.spec.js` | Candidate | Dashboard render, jobs search/filter/details, saved jobs toggle, profile view/validation, resume/CV studio/roadmap page loads, applications list & detail | High |
| `tests/e2e/company/workflows.spec.js` | Company | Dashboard render, company profile, create job validation & lifecycle (create → edit → verify → delete), applicants list & interviews page | High |
| `tests/e2e/e2e-lifecycle.spec.js` | E2E Journey | Complete job application lifecycle: Company creates test job → Candidate discovers & applies (and duplicate apply is blocked) → Company updates status → Candidate sees updated status → Messaging exchange → Cleanup | Critical |
| `tests/e2e/admin/workflows.spec.js` | Admin | Dashboard stats, Users, Candidates, Companies, Verification, Jobs, Applications, Reports, Categories, Skills, Audit Logs, Notifications, Settings | High |
| `tests/e2e/shared/navigation-and-responsive.spec.js` | UI & Responsive | Placeholder pages audit, desktop (`1440x900`) & mobile (`390x844`) horizontal overflow checks, broken image check, console/network diagnostics | Medium |

---

## 3. Execution Stages

1. **Stage 1:** Smoke & Public (`landing-and-health.spec.js`)
2. **Stage 2:** Authentication & RBAC (`login-and-session.spec.js`, `registration.spec.js`, `authorization.spec.js`)
3. **Stage 3:** Role Workflows (`candidate/workflows.spec.js`, `company/workflows.spec.js`, `admin/workflows.spec.js`)
4. **Stage 4:** End-to-End Business Lifecycle (`e2e-lifecycle.spec.js`)
5. **Stage 5 & 6:** Validation, Error Handling, Console/Network & Responsive UI (`navigation-and-responsive.spec.js`)
