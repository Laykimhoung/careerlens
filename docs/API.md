# CareerLens REST API & Integration Specification

This document provides complete reference documentation for the **CareerLens REST API**, including authentication workflows, candidate and company portals, ATS lifecycle transitions, Google Gemini AI endpoints, and the Telegram Bot Webhook interface.

**Base Production URL:** `https://careerlens-api-fh3x.onrender.com/api/`  
**Local Development URL:** `http://127.0.0.1:8000/api/`

---

## Table of Contents
1. [Authentication & Account Management](#1-authentication--account-management)
2. [Jobs & Skill Taxonomy](#2-jobs--skill-taxonomy)
3. [Applications & ATS Lifecycle](#3-applications--ats-lifecycle)
4. [AI Resume Studio & Versions (Google Gemini BYOK)](#4-ai-resume-studio--versions-google-gemini-byok)
5. [Career Roadmap & Recommendations](#5-career-roadmap--recommendations)
6. [Direct Messaging & System Notifications](#6-direct-messaging--system-notifications)
7. [Platform Statistics & Administration](#7-platform-statistics--administration)
8. [Telegram Bot Webhook Contract](#8-telegram-bot-webhook-contract)

---

## 1. Authentication & Account Management

### JWT Authentication Endpoints

- **POST** `/api/auth/login/`
  - Body:
    ```json
    { "username": "demo_cand_sreymom", "password": "CareerLens2026!Demo" }
    ```
  - Response (200 OK):
    ```json
    {
      "access": "eyJhbGciOi...",
      "refresh": "eyJhbGciOi...",
      "user": {
        "id": 1,
        "username": "demo_cand_sreymom",
        "email": "sreymom@example.com",
        "role": "CANDIDATE"
      }
    }
    ```

- **POST** `/api/auth/login/refresh/`
  - Body: `{ "refresh": "<refresh_token>" }`
  - Response (200 OK): `{ "access": "<new_access_token>" }`

- **POST** `/api/auth/register/`
  - Body:
    ```json
    {
      "username": "new_student",
      "email": "student@rupp.edu.kh",
      "password": "SecurePassword123!",
      "first_name": "Sokha",
      "last_name": "Kem",
      "role": "CANDIDATE"
    }
    ```
  - Response (201 Created): Automatically initializes a `CandidateProfile` or `CompanyProfile`.

### User Profiles
*(Requires `Authorization: Bearer <access_token>` header)*

- **GET, PATCH** `/api/auth/me/`
  - Description: Inspect or update the authenticated user's core details (`username`, `email`, `first_name`, `last_name`).

- **GET, PATCH** `/api/auth/candidates/{id}/`
  - Fields: `university`, `major`, `graduation_year`, `bio`, `resume_file`, `skills`.
  - Permissions: Read is public; `PATCH` requires profile ownership (`IsOwnerOrReadOnly`).

- **GET, PATCH** `/api/auth/companies/{id}/`
  - Fields: `company_name`, `industry`, `size`, `location`, `website`, `is_verified`.
  - Permissions: Read is public; `PATCH` requires company ownership.

---

## 2. Jobs & Skill Taxonomy

- **GET** `/api/jobs/`
  - Query Parameters:
    - `search` (string): Searches title, company name, skill names, and description.
    - `location` (string): Case-insensitive location match (e.g. `Phnom Penh`, `Remote`).
    - `job_type` (string): Filter by `FULL_TIME`, `PART_TIME`, `INTERNSHIP`, `REMOTE`.
  - Visibility: Candidates and anonymous users see `PUBLISHED` jobs; Companies see their own drafts plus public listings.

- **GET** `/api/jobs/{id}/`
  - Description: Retrieves full job posting details, company profile, and required skills.

- **POST** `/api/jobs/`
  - Permissions: `IsCompanyUser`
  - Body:
    ```json
    {
      "title": "Junior Python / Django Developer",
      "description": "Building scalable REST APIs for university platforms.",
      "location": "Phnom Penh",
      "job_type": "FULL_TIME",
      "salary_min": 600,
      "salary_max": 1200,
      "status": "PUBLISHED",
      "skill_ids": [1, 4, 7]
    }
    ```

- **PATCH, DELETE** `/api/jobs/{id}/`
  - Permissions: `IsJobOwnerOrReadOnly` (only posting company can edit/delete).

- **GET, POST** `/api/saved-jobs/`
  - Permissions: `IsCandidateUser`
  - Description: Candidates bookmark vacancies for later review.

---

## 3. Applications & ATS Lifecycle

- **GET** `/api/applications/`
  - Description: Candidates view applications they submitted. Recruiters view applications for jobs posted by their company.

- **POST** `/api/applications/`
  - Permissions: `IsCandidateUser`
  - Body: `{ "job_id": 12, "cover_letter": "I have 2 years of experience with React 19..." }`

- **PATCH** `/api/applications/{id}/`
  - Permissions: Recruiter who owns the associated job.
  - Body: `{ "status": "INTERVIEW" }`
  - Valid Status Transitions:
    $$\text{APPLIED} \longrightarrow \text{REVIEWING} \longrightarrow \text{INTERVIEW} \longrightarrow \text{OFFERED} \lor \text{REJECTED}$$
  - Note: State changes automatically append a record to `ApplicationStatusHistory`.

- **POST** `/api/interviews/`
  - Body:
    ```json
    {
      "application": 42,
      "scheduled_at": "2026-11-15T14:30:00Z",
      "location": "https://meet.google.com/abc-defg-hij",
      "notes": "Technical coding round: Python algorithms and system design."
    }
    ```

- **POST** `/api/offers/`
  - Body:
    ```json
    {
      "application": 42,
      "salary": "1200.00",
      "currency": "USD",
      "message": "We are thrilled to offer you the Junior Developer position!",
      "expires_at": "2026-11-25T23:59:59Z"
    }
    ```

- **PATCH** `/api/offers/{id}/`
  - Description: Candidates accept or decline an offer (`status: ACCEPTED` or `REJECTED`).

---

## 4. AI Resume Studio & Versions (Google Gemini BYOK)

CareerLens integrates Google Gemini models directly without paywalls via Bring-Your-Own-Key (BYOK).

- **POST** `/api/resumes/upload/`
  - Multipart Form: `file` (.pdf, .docx, .txt), `target_role` (optional).
  - Returns: Extracted skills, experiences, education, and resume ID.

- **POST** `/api/resumes/{id}/analyze/`
  - Body: `{ "gemini_api_key": "AIzaSy..." }`
  - Description: Performs multi-dimensional ATS evaluation (Match Score %, Missing Keywords, Impact Metrics, Strengths & Weaknesses).

- **GET** `/api/resumes/improvement/diagnosis/`
  - Description: Computes a comprehensive gap analysis between candidate's parsed resume and the target IT role.

- **POST** `/api/resumes/improvement/generate/`
  - Body:
    ```json
    {
      "gemini_api_key": "AIzaSy...",
      "model": "gemini-3.5-flash-lite",
      "answers": { "project_experience": "Engineered microservice..." }
    }
    ```
  - Description: Synthesizes high-impact bullet points and generates a new `ResumeVersion`.

- **GET** `/api/resumes/improvement/versions/`
  - Description: Lists candidate's saved CV versions (`v1`, `v2`, etc.).

- **POST** `/api/resumes/improvement/versions/{id}/approve/`
  - Description: Marks a generated version as the active primary resume for one-click job applications.

- **POST** `/api/resumes/improvement/versions/{id}/export-docx/`
  - Description: Generates and streams a downloadable `.docx` file formatted in an ATS-friendly layout.

---

## 5. Career Roadmap & Recommendations

- **GET** `/api/platform-stats/`
  - Permissions: AllowAny (Public).
  - Response (200 OK):
    ```json
    {
      "total_jobs": 24,
      "active_companies": 9,
      "total_candidates": 5,
      "applications_submitted": 38
    }
    ```

- **GET** `/api/recommendations/`
  - Permissions: `IsCandidateUser`
  - Description: Computes best-fit job matches based on overlapping skills between candidate profile and active jobs.

- **GET** `/api/roadmap/`
  - Permissions: `IsCandidateUser`
  - Description: Retrieves the candidate's active learning roadmap with milestone progress bars.

- **POST** `/api/roadmap/generate/`
  - Body: `{ "target_role": "Cloud DevOps Engineer", "timeframe_months": 6 }`
  - Description: Generates step-by-step skill milestones and resources.

- **PATCH** `/api/roadmap/milestones/`
  - Body: `{ "milestone_id": 3, "is_completed": true }`
  - Description: Updates milestone completion status and recalibrates overall completion percentage.

---

## 6. Direct Messaging & System Notifications

- **GET** `/api/messages/`
  - Description: Returns thread list for the authenticated user with unread counts.

- **POST** `/api/messages/`
  - Body: `{ "recipient": 3, "text": "Hello, thank you for inviting me to the interview!" }`

- **POST** `/api/messages/{id}/mark_as_read/`
  - Description: Marks a message as read. Only recipient can perform this.

- **GET** `/api/notifications/`
  - Description: Lists application status alerts, interview invites, and system updates.

- **POST** `/api/notifications/{id}/mark_as_read/`
  - Description: Marks notification as read.

---

## 7. Platform Statistics & Administration

- **GET** `/api/auth/admin/dashboard/`
  - Permissions: `IsAdminUserRole`
  - Query: `?range=7d|30d|90d|all`
  - Description: Aggregates KPIs: user registrations, active listings, application distribution breakdown, and audit logs.

- **GET, POST** `/api/auth/users/`
  - Permissions: `IsAdminUserRole`
  - Description: Administrative user directory; allows staff to view, create, or suspend accounts.

- **GET** `/api/auth/audit-logs/`
  - Description: Detailed security audit records (timestamp, user, action, IP address, object affected).

---

## 8. Telegram Bot Webhook Contract

### Ingestion Endpoint

- **URL:** `POST /api/telegram/webhook/`
- **Security Header:** `X-Telegram-Bot-Api-Secret-Token` (Optional secret token configured via environment).
- **Payload:** Standard Telegram `Update` object.

```json
{
  "update_id": 10000,
  "message": {
    "date": 1441645532,
    "chat": {
      "last_name": "Kimhoung",
      "id": 1111111,
      "first_name": "Lay",
      "username": "Xakuraii"
    },
    "message_id": 1365,
    "from": {
      "last_name": "Kimhoung",
      "id": 1111111,
      "first_name": "Lay",
      "username": "Xakuraii"
    },
    "text": "/jobs"
  }
}
```

### Supported Commands
- `/start` — Initial greeting with persistent keyboard and feature overview.
- `/jobs` — Formatted list of 5 recent published IT vacancies with interactive "Apply" inline buttons.
- `/search <query>` — Keyword search across job titles, tech stack, and locations.
- `/job <id>` — Direct deep-card lookup for a specific vacancy.
- `/help` — Reference list of commands.

### Health Check & Keep-Alive Ping
- **URL:** `GET /api/telegram/webhook/`
- **Purpose:** Health check target utilized by UptimeRobot every 10 minutes.
- **Response (200 OK):**
  ```json
  {
    "status": "ready",
    "bot_configured": true,
    "bot_username": "careerlens_jobs_bot",
    "secret_enforced": true
  }
  ```
