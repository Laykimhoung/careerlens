
# CareerLens — Team Workflow Guide

This document defines each team member's responsibilities, file ownership, collaboration rules, and Git workflow.

**Project:** CareerLens  
**Frontend:** React + Vite  
**Backend:** Django + Django REST Framework  
**Database:** PostgreSQL

---

## 1. Team Members and Responsibilities

### Teammate 1 — Dana
**Branch:** `frontend/dana`  
**Role:** Frontend — Landing Page

Responsible for the public-facing landing page.

Tasks:
- Build the homepage and hero section.
- Build the features section.
- Build the how-it-works section.
- Build statistics, testimonials, and CTA sections.
- Implement the public navbar and footer.
- Make the landing page responsive.
- Ensure the landing page works on desktop, tablet, and mobile.

#### Files owned by Dana

**Pages:**
```text
frontend/src/pages/landing/
└── Home.jsx
```

**Landing components:**
```text
frontend/src/components/landing/
├── Hero.jsx
├── Features.jsx
├── HowItWorks.jsx
├── Statistics.jsx
├── Testimonials.jsx
└── CTASection.jsx
```

**Shared components initially maintained by Dana:**
```text
frontend/src/components/common/
├── Navbar.jsx
└── Footer.jsx
```

**Assets:**
```text
frontend/src/assets/
├── images/
├── icons/
└── logos/
```

Dana may add or organize landing-page assets in these folders.

**Important:** Dana owns the landing page. Do not modify authentication,
candidate, company, or admin pages without coordinating with the relevant member.

---

### Teammate 2 — En
**Branch:** `frontend/en`  
**Role:** Frontend — Authentication + Candidate Dashboard

Responsible for authentication screens and the candidate experience.

#### A. Authentication

Tasks:
- Build login and registration pages.
- Build the forgot-password and reset-password pages.
- Validate user input.
- Connect forms to the authentication API.
- Handle login errors and loading states.
- Store and manage authentication state safely.
- Redirect users according to their roles.
- Protect routes that require authentication.

**Pages:**
```text
frontend/src/pages/auth/
├── Login.jsx
├── Register.jsx
├── ForgotPassword.jsx
└── ResetPassword.jsx
```

**Components:**
```text
frontend/src/components/auth/
├── LoginForm.jsx
├── RegisterForm.jsx
├── ForgotPasswordForm.jsx
└── PasswordField.jsx
```

**Authentication files:**
```text
frontend/src/
├── context/
│   └── AuthContext.jsx
├── hooks/
│   └── useAuth.js
├── services/
│   └── authService.js
└── components/common/
    └── ProtectedRoute.jsx
```

#### B. Candidate Dashboard

Tasks:
- Build the candidate dashboard.
- Build and edit the candidate profile.
- Upload and manage CVs.
- Browse and search jobs.
- Display job details.
- Apply for jobs.
- Track application statuses.
- Display saved jobs.
- Display matching results when the backend API is available.

**Pages:**
```text
frontend/src/pages/candidate/
├── Dashboard.jsx
├── Profile.jsx
├── Resume.jsx
├── Jobs.jsx
├── JobDetails.jsx
├── Applications.jsx
├── ApplicationDetails.jsx
└── SavedJobs.jsx
```

**Components:**
```text
frontend/src/components/candidate/
├── CandidateSidebar.jsx
├── CandidateHeader.jsx
├── ProfileCard.jsx
├── ResumeCard.jsx
├── JobCard.jsx
├── ApplicationCard.jsx
├── SavedJobCard.jsx
├── SkillList.jsx
└── ApplicationStatus.jsx
```

**Candidate API service:**
```text
frontend/src/services/
└── candidateService.js
```

En should also coordinate with Kimhoung on the job, application,
and matching API endpoints needed by the candidate dashboard.

---

### Teammate 3 — Youe
**Branch:** `frontend/youe`  
**Role:** Frontend — Company Dashboard + Admin Dashboard

Responsible for company recruitment workflows and the custom admin interface.

#### A. Company Dashboard

Tasks:
- Build the company dashboard.
- Display company statistics.
- Manage company profiles.
- Create, edit, and manage job postings.
- View applicants for posted jobs.
- Display applicant details.
- Manage application statuses.
- Manage interviews if included in the project scope.

**Pages:**
```text
frontend/src/pages/company/
├── Dashboard.jsx
├── Profile.jsx
├── Jobs.jsx
├── CreateJob.jsx
├── EditJob.jsx
├── Applicants.jsx
├── ApplicantDetails.jsx
└── Interviews.jsx
```

**Components:**
```text
frontend/src/components/company/
├── CompanySidebar.jsx
├── CompanyHeader.jsx
├── CompanyProfileCard.jsx
├── JobCard.jsx
├── JobForm.jsx
├── ApplicantCard.jsx
├── ApplicantTable.jsx
├── ApplicationStatus.jsx
└── InterviewCard.jsx
```

**Company API services:**
```text
frontend/src/services/
├── companyService.js
├── jobService.js
├── applicationService.js
└── interviewService.js
```

#### B. Admin Dashboard

Tasks:
- Build the admin dashboard.
- Display platform statistics.
- Manage users.
- Manage companies and candidates.
- View and manage job postings.
- Review company verification requests.
- Display reports when supported by the backend.

**Pages:**
```text
frontend/src/pages/admin/
├── Dashboard.jsx
├── Users.jsx
├── Companies.jsx
├── Candidates.jsx
├── Jobs.jsx
└── Verification.jsx
```

**Components:**
```text
frontend/src/components/admin/
├── AdminSidebar.jsx
├── AdminHeader.jsx
├── UserTable.jsx
├── CompanyTable.jsx
├── CandidateTable.jsx
├── JobTable.jsx
├── VerificationCard.jsx
└── StatisticsCard.jsx
```

**Admin API service:**
```text
frontend/src/services/
└── adminService.js
```

Youe must use the admin API and permission rules provided by Kimhoung.
The frontend alone must never be treated as the security boundary.

---

### Teammate 4 — Kimhoung
**Branch:** `backend/kimhoung`  
**Role:** Backend Developer + Team Lead

Responsible for Django, PostgreSQL, API development, and backend integration.

Tasks:
- Design and maintain database models.
- Implement Django migrations.
- Develop authentication and authorization.
- Implement REST API endpoints.
- Validate incoming data.
- Implement role-based permissions.
- Handle file uploads and CV storage.
- Implement job and application workflows.
- Implement candidate-job matching.
- Implement admin APIs and reporting.
- Maintain API documentation.
- Coordinate API contracts with all frontend members.
- Review integration issues between React and Django.

**Main ownership:**
```text
backend/
├── config/
├── apps/
├── manage.py
├── requirements.txt
├── .env.example
└── ...
```

**Documentation:**
```text
docs/
├── API.md
├── DATABASE.md
└── TEAM_WORKFLOW.md
```

Kimhoung coordinates changes to API contracts and database structures.
Frontend members must not modify backend models or migrations without
coordinating with Kimhoung.

---

## 2. Frontend Folder Ownership Summary

| Folder or file | Owner |
|---|---|
| `pages/landing/` | Dana |
| `components/landing/` | Dana |
| `components/common/Navbar.jsx` | Dana |
| `components/common/Footer.jsx` | Dana |
| `pages/auth/` | En |
| `components/auth/` | En |
| `pages/candidate/` | En |
| `components/candidate/` | En |
| `context/AuthContext.jsx` | En |
| `hooks/useAuth.js` | En |
| `services/authService.js` | En |
| `pages/company/` | Youe |
| `components/company/` | Youe |
| `pages/admin/` | Youe |
| `components/admin/` | Youe |
| `services/companyService.js` | Youe |
| `services/jobService.js` | Youe |
| `services/applicationService.js` | Youe |
| `services/interviewService.js` | Youe |
| `services/adminService.js` | Youe |
---
##  Backend Folder Ownership Summary
| Folder or file | Owner |
|---|---|
| `backend/` | Kimhoung |

### Shared files — coordinate before editing

The following files affect multiple parts of the application.

```text
frontend/src/
├── App.jsx
├── main.jsx
├── index.css
├── routes/AppRoutes.jsx
├── services/api.js
├── hooks/useFetch.js
├── hooks/useForm.js
├── utils/constants.js
├── utils/validators.js
├── utils/formatters.js
├── utils/storage.js
├── layouts/MainLayout.jsx
├── layouts/CandidateLayout.jsx
├── layouts/CompanyLayout.jsx
└── layouts/AdminLayout.jsx
```

Rules:
- Do not independently restructure shared files.
- Discuss changes with affected teammates first.
- En maintains the authentication and route-protection integration.
- Kimhoung coordinates API conventions and backend contracts.
- The relevant dashboard owner maintains their dashboard layout.
- All members must communicate before changing shared styles or dependencies.

**Important:** Folder ownership is a collaboration rule, not a technical restriction.
Coordinate any change that affects another member's work.

---

## 3. Frontend Development Rules

### Rule 1 — Work inside your assigned folders

Create and modify files in your assigned areas first.

Do not rename or delete another member's files without discussing it.

### Rule 2 — Keep components reusable

Use the existing common components when appropriate:

```text
components/common/
├── Button.jsx
├── Input.jsx
├── Modal.jsx
├── Loading.jsx
├── ErrorMessage.jsx
└── EmptyState.jsx
```

If you need a new shared component, discuss it before creating a duplicate.

### Rule 3 — Use the correct layout

```text
MainLayout.jsx       → Public pages
CandidateLayout.jsx  → Candidate pages
CompanyLayout.jsx    → Company pages
AdminLayout.jsx     → Admin pages
```

Do not duplicate entire layouts inside every page.

### Rule 4 — Do not put everything in App.jsx

`App.jsx` should remain small. Application routes belong in:

```text
frontend/src/routes/AppRoutes.jsx
```

Coordinate route changes with En before editing this file.

### Rule 5 — Separate UI from API logic

Pages and components should focus on presentation and user interaction.
API requests should go through the relevant service.

For example:

```text
Jobs.jsx
    ↓
jobService.js
    ↓
services/api.js
    ↓
Django REST API
    ↓
PostgreSQL
```

Do not connect React directly to PostgreSQL.

### Rule 6 — Use mock data only when necessary

While waiting for the backend API, you may use temporary mock data
to build and test the UI.

Keep mock data easy to replace. Do not present mock data as real
database data.

### Rule 7 — Handle loading, errors, and empty results

Every API-driven page should consider:
- Loading state
- API error state
- Empty state
- Successful response
- Unauthorized or forbidden response, when applicable

---

## 4. Backend and API Coordination

Kimhoung is responsible for defining API endpoints and request/response
formats in `docs/API.md`.

Before integrating an API, agree on:

1. Endpoint URL and HTTP method.
2. Required request fields.
3. Response structure.
4. Authentication requirements.
5. Permission requirements.
6. Error response format.

Example API contract:

```http
GET /api/jobs/
```

Example response:

```json
{
  "results": [
    {
      "id": 1,
      "title": "Junior React Developer",
      "company_name": "ABC Tech"
    }
  ]
}
```

This is an example only. Use the actual response documented by Kimhoung.

If an endpoint is not ready, use temporary mock data and continue building
the UI. Do not invent a permanent API format independently.

### API service responsibilities

| Service | Frontend owner |
|---|---|
| `api.js` | En maintains the shared client; coordinate changes |
| `authService.js` | En |
| `candidateService.js` | En |
| `companyService.js` | Youe |
| `jobService.js` | Youe maintains; coordinate with En |
| `applicationService.js` | Youe maintains; coordinate with En |
| `interviewService.js` | Youe |
| `adminService.js` | Youe |

En and Youe must coordinate when they both use jobs or applications.
Avoid creating duplicate API clients.

---

## 5. Git Branch Workflow

### Branches

```text
main
└── develop
    ├── frontend/dana
    ├── frontend/en
    ├── frontend/youe
    └── backend/kimhoung
```

- `main`: Stable project version.
- `develop`: Shared integration branch.
- `frontend/dana`: Dana's work.
- `frontend/en`: En's work.
- `frontend/youe`: Youe's work.
- `backend/kimhoung`: Kimhoung's work.

Each member should normally work on their own branch.

### Step 1 — Switch to your branch

```bash
git switch frontend/your-name
```

Replace `your-name` with your assigned branch name.

### Step 2 — Synchronize with develop

Before starting work:

```bash
git pull origin develop
```

Resolve any conflicts before continuing.

### Step 3 — Check your changes

```bash
git status
git diff
```

Test the affected pages or backend functionality.

### Step 4 — Commit your work

```bash
git add .
git commit -m "feat: add candidate profile page"
```

Use a commit message that describes your actual changes.

Examples:

```text
feat: build landing page
feat: add authentication forms
feat: build candidate dashboard
feat: add company job management
feat: implement job API
fix: handle login validation errors
style: improve responsive dashboard layout
```

### Step 5 — Push your branch

```bash
git push -u origin frontend/your-name
```

For later pushes:

```bash
git push
```

### Step 6 — Integrate into develop

When your work is ready:

1. Ensure your changes are committed and pushed.
2. Open a pull request targeting `develop`, or follow the integration
   method agreed upon by the team.
3. Resolve conflicts and test the integrated application.
4. Merge only when the changes are ready.

Only Kimhoung should approve and merge changes from `develop` into `main`.

### Step 7 — Update your branch after integration

```bash
git fetch origin
git merge origin/develop
```

Repeat this regularly to reduce large merge conflicts.

**Never force-push to shared branches or rewrite another member's work.**

---

## 6. Preventing Git Conflicts

Before editing a shared file:

1. Check whether another member is editing it.
2. Tell the relevant member what you need to change.
3. Agree on who will make the change.
4. Pull or merge the latest `develop` changes.
5. Test your work before pushing.

Avoid having multiple people edit these files independently:

```text
App.jsx
routes/AppRoutes.jsx
index.css
services/api.js
package.json
```

If you need a new dependency, discuss it with the team first.

Do not commit generated folders or environment secrets.

---

## 7. Environment Setup

### Frontend

From the project root:

```bash
cd frontend
npm install
npm run dev
```

Use the local URL printed by Vite.

### Backend

From the project root, activate your virtual environment,
then run the Django development server from `backend/`:

```bash
cd backend
python manage.py migrate
python manage.py runserver
```

Install backend dependencies first if setting up for the first time.

### Environment variables

Use `.env.example` to document required variables.

Each developer should create their own local `.env` file when needed.

**Never commit `.env`, passwords, secret keys, database credentials,
or real user data to Git.**

---

## 8. Definition of Done

A task is complete when:

- The assigned page or feature works.
- The UI is responsive where appropriate.
- Loading, error, and empty states are handled where needed.
- API integration follows the agreed contract, or temporary mock data
  is clearly identified.
- No unrelated files were changed unnecessarily.
- The application runs without new console errors.
- Changes are committed and pushed to the correct branch.
- The team has been informed of any dependencies or unfinished work.

---

## 9. Communication Rules

When asking for help, include:

1. What you are implementing.
2. The file you are working on.
3. What you expected to happen.
4. What actually happened.
5. The error message or screenshot, if applicable.

Notify the team before:
- Changing shared components.
- Changing routes or authentication behavior.
- Adding or updating dependencies.
- Changing API contracts.
- Changing database models or migrations.
- Renaming or deleting shared files.

---

## 10. Final Team Agreement

- Dana owns the landing page.
- En owns authentication and the candidate dashboard.
- Youe owns the company and admin dashboards.
- Kimhoung owns the Django backend, database, API contracts, and backend
  integration.
- Everyone follows the agreed file ownership and Git workflow.
- Shared files are changed through coordination, not independently.
- `develop` is the integration branch.
- `main` remains the stable version.
- Communicate blockers early instead of waiting until the deadline.

**Goal:** Work independently in your assigned areas while keeping
CareerLens consistent, maintainable, and easy to integrate.