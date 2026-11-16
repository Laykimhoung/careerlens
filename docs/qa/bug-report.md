# CareerLens — QA Bug Report (Phase 8 & 9)

**Assessment Date:** 2026-11-16  
**Environment:** Local Vite Frontend (`http://localhost:5173`) + Django REST API (`http://127.0.0.1:8000`) + PostgreSQL (`careerlens_db`)  
**Playwright HTML Report:** `playwright-report/index.html`

---

## Summary by Severity

| Severity | Count | Bug IDs |
| :--- | :---: | :--- |
| **Critical** | 0 | — |
| **High** | 1 | `BUG-01` |
| **Medium** | 2 | `BUG-02`, `BUG-03` |
| **Low / Observation** | 1 | `OBS-01` |

---

## Confirmed Bugs

### `BUG-01` — Company Edit Job Form (`/company/jobs/:id/edit`) Renders Blank Fields and Blocks Saving
- **Severity:** High
- **Affected User Role:** Company
- **Affected Page / Files:** `/company/jobs/:id/edit` (`frontend/src/pages/company/EditJob/EditJob.jsx`, `frontend/src/components/company/JobForm.jsx`, `frontend/src/components/common/Input.jsx`, `frontend/src/components/common/Textarea.jsx`, `frontend/src/components/common/Select.jsx`, `frontend/src/services/jobService.js`)
- **Preconditions:** Logged in as a Company user (`demo_comp_mekong`) with at least one existing job.
- **Reproduction Steps:**
  1. Navigate to `/company/jobs`.
  2. Click **Edit** on any existing job (opening `/company/jobs/<id>/edit`).
  3. Observe the form inputs (`Job Title*`, `Location*`, `Employment Type`, `Workplace Setup`, `Min/Max Salary`, `Posting Status`, `Skills`, `Job Description*`).
  4. Modify the Job Title and click **Save Job Changes**.
- **Expected Result:** All fields should be pre-populated with the existing job's values, and clicking **Save Job Changes** should `PATCH` the job and redirect to `/company/jobs`.
- **Actual Result:** All text inputs (`Location*`, `Job Description*`, `Salary`, `Skills`) are empty and dropdowns reset to default first options (`Full-time`, `On-site`, `Published`). Browser `required` validation blocks submission and keeps the user on `/company/jobs/<id>/edit`.
- **Supporting Evidence:**
  - Playwright test failure: `tests/e2e/company/workflows.spec.js` (`Stage 3 — Company Feature Workflows › Company job lifecycle via UI...`)
  - Trace/Snapshot: `test-results/company-workflows-Stage-3--088c8--visibility-edit-and-delete-chromium/error-context.md`
- **Root Cause:**
  1. `JobForm.jsx` passes `defaultValue={...}` to `<Input>`, `<Select>`, and `<Textarea>`, but `Input.jsx`, `Textarea.jsx`, and `Select.jsx` only destructure `value` and never forward `defaultValue`.
  2. `JobForm.jsx` reads `initialJob.salaryMin` / `initialJob.salaryMax`, whereas `normalizeJobRecord()` in `jobService.js` sets `salary_min` / `salary_max`.
- **Recommended Resolution (Smallest Fix):**
  - Update `Input.jsx`, `Textarea.jsx`, and `Select.jsx` to accept `defaultValue` (passing `defaultValue` when `value === undefined`) and update `JobForm.jsx` to read `initialJob.salary_min ?? initialJob.salaryMin ?? ""` (and `salary_max ?? salaryMax ?? ""`).

---

### `BUG-02` — Mobile Horizontal Overflow (`111px`) on `/candidate/jobs`
- **Severity:** Medium
- **Affected User Role:** Candidate (Mobile viewport `390x844`)
- **Affected Page / Files:** `/candidate/jobs` (`frontend/src/pages/candidate/Jobs/Jobs.css`, `frontend/src/pages/candidate/Jobs/Jobs.jsx`)
- **Preconditions:** Logged in as Candidate at `390x844` viewport.
- **Reproduction Steps:**
  1. Set browser viewport to `390x844`.
  2. Log in as Candidate and navigate to `/candidate/jobs`.
  3. Measure `document.documentElement.scrollWidth - document.documentElement.clientWidth`.
- **Expected Result:** Page fits within `390px` width (`0px` horizontal overflow).
- **Actual Result:** `111px` horizontal overflow (`scrollWidth` exceeds `clientWidth` by `111px`).
- **Supporting Evidence:**
  - Playwright test failure: `tests/e2e/shared/navigation-and-responsive.spec.js`
  - Screenshot & trace: `test-results/shared-navigation-and-resp-e7635-440x900-and-Mobile-390x844--chromium/test-failed-1.png`
- **Root Cause:** Filter row/select controls or job card flex/grid items lack `min-width: 0` / mobile flex-wrap rules in `Jobs.css`.
- **Recommended Resolution:** Add mobile responsive stacking/wrapping and `min-width: 0; max-width: 100%;` on `.cj-page` and filter/card containers under `@media (max-width: 768px)` in `Jobs.css`.

---

### `BUG-03` — React Missing `key` Prop Console Error in `CVStudio`
- **Severity:** Medium
- **Affected User Role:** Candidate
- **Affected Page / Files:** `/candidate/cv-studio` (`frontend/src/pages/candidate/CVStudio/CVStudio.jsx`)
- **Preconditions:** Logged in as Candidate (`demo_cand_sreymom`) with an uploaded/diagnosed resume.
- **Reproduction Steps:**
  1. Log in as Candidate and navigate to `/candidate/cv-studio`.
  2. Open browser DevTools console.
- **Expected Result:** Zero React console errors.
- **Actual Result:** React logs console error: `Each child in a list should have a unique "key" prop. Check the render method of CVStudio.`
- **Supporting Evidence:**
  - Playwright test failure: `tests/e2e/candidate/workflows.spec.js` (`Candidate secondary pages load without runtime errors`)
- **Root Cause:** One of the mapped lists in `CVStudio.jsx` (e.g., `diagnosis.improvement_options` at line 473 where `opt.id` can be undefined/non-unique) renders elements without a guaranteed unique `key`.
- **Recommended Resolution:** Use a guaranteed unique fallback key (e.g., `key={opt.id || opt.label || idx}`).

---

## Observations & Demo Caveats

### `OBS-01` — Unimplemented Placeholder Sidebar Routes & Native `alert()` in Registration
- **Severity:** Low (Classroom Demo Risk)
- **Affected Files:** `frontend/src/routes/AppRoutes.jsx` (lines 122, 125, 146–149), `frontend/src/pages/auth/AuthPage/AuthPage.jsx` (lines 250, 255)
- **Details:**
  - Five sidebar links route to `<CandidatePlaceholder />`: `/candidate/interviews`, `/candidate/settings`, `/company/talent-pool`, `/company/reports`, `/company/settings`. During a live demo, avoid clicking these unless intentionally explaining future roadmap items.
  - Registration validation on `/register` triggers native browser `alert()` when `major` or `terms` are missing instead of inline `.tether-error` messaging.
