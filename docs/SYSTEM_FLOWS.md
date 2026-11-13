# CareerLens — System Flows & End-to-End Execution Paths

> **Document Type:** End-to-End Runtime Execution & Sequence Specification  
> **Target Audience:** Full-Stack Engineers, System Integrators, QA Engineers  
> **Status:** Code-Backed & Traced Across Client and Server Implementations  
> **Last Updated:** 2026-11-11  

---

## 1. Application Initialization & Bootstrapping

### 1. Backend Initialization Lifecycle

```mermaid
sequenceDiagram
    autonumber
    participant Host as Render Container
    participant Gunicorn as Gunicorn (2w x 4t)
    participant Django as Django 5.2 Settings
    participant DB as Neon PostgreSQL 16
    participant WhiteNoise as WhiteNoise Engine

    Host->>Gunicorn: Exec gthread command (Procfile)
    Gunicorn->>Django: Load config.wsgi:application
    Django->>Django: Parse .env via python-dotenv
    Django->>DB: Initialize dj_database_url connection pool (ssl_require=True)
    DB-->>Django: SSL Connection Verified (PostgreSQL 16)
    Django->>WhiteNoise: Mount CompressedManifestStaticFilesStorage
    Django-->>Gunicorn: WSGI Application Ready
    Gunicorn-->>Host: Listening on 0.0.0.0:$PORT (8 Worker Threads)
```

1. **Environment Ingestion:** `backend/config/settings.py` loads environment variables using `python-dotenv`.
2. **Database Health Verification:** `dj_database_url` parses `DATABASE_URL` with SSL mode enforced (`sslmode=require`) and connection pooling (`conn_max_age=600`, `conn_health_checks=True`).
3. **Static Engine Mounting:** WhiteNoise compresses and caches admin and API assets from `staticfiles/` into memory.
4. **Gunicorn Multi-Threading:** Spawns 2 processes each managing 4 concurrent worker threads (`gthread`), providing 8 parallel request executors within the container.

---

### 2. Frontend Initialization & Context Hydration

```mermaid
sequenceDiagram
    autonumber
    participant Browser as Browser Client
    participant Vercel as Vercel Edge CDN
    participant React as React 19 Engine
    participant Storage as localStorage
    participant AuthContext as AuthProvider
    participant Router as AppRoutes (safeLazy)

    Browser->>Vercel: GET / (index.html)
    Vercel-->>Browser: Return HTML shell + 40.7 kB initial JS chunk
    Browser->>React: Mount main.jsx -> App.jsx
    React->>Storage: Inspect tokens (cl_token, cl_user)
    alt Valid Token in Storage
        Storage-->>AuthContext: Populate user & token state
    else Corrupt / Demo Token Detected
        Storage-->>AuthContext: Clear storage & reset to null
    end
    React->>Router: Evaluate current URL path
    Router->>Router: Dynamically import matched chunk via safeLazy()
    Router-->>Browser: Render role-specific layout & page
```

---

## 2. Critical End-to-End Workflows

### Flow 1: Authentication & Silent Token Refresh Queue

The authentication architecture ensures stateless JWT security while eliminating sudden session dropouts:

```mermaid
sequenceDiagram
    autonumber
    participant Client as Axios Client (api.js)
    participant AuthStore as localStorage
    participant API as Django REST API (/api/auth/)
    participant DB as Neon PostgreSQL

    %% Step 1: User Login
    Note over Client,DB: 1. User Login Flow
    Client->>API: POST /api/auth/login/ {username, password}
    API->>DB: Query User & verify PBKDF2 hash
    DB-->>API: User authenticated (Role: CANDIDATE)
    API-->>Client: 200 OK {access: "eyJ...", refresh: "eyJ...", user: {...}}
    Client->>AuthStore: Save tokens & normalized user profile

    %% Step 2: Request Interception
    Note over Client,API: 2. Authenticated Request
    Client->>API: GET /api/jobs/ (Header: Bearer eyJ... [Access])
    API-->>Client: 200 OK (Job List Response)

    %% Step 3: Access Token Expiration & Silent Refresh Queue
    Note over Client,DB: 3. Silent Refresh Queue Flow (Access Token Expired)
    Client->>API: GET /api/applications/ (Expired Access Token)
    API-->>Client: 401 Unauthorized (Token is invalid or expired)
    
    activate Client
    Note over Client: Axios Interceptor catches 401.<br>Sets isRefreshing = true.<br>Enqueues pending requests in failedQueue.
    Client->>API: POST /api/auth/login/refresh/ {refresh: "eyJ... [Refresh]"}
    API->>API: Verify Refresh Token signature
    API-->>Client: 200 OK {access: "eyJ... [New Access Token]"}
    Client->>AuthStore: Update cl_token with new access token
    Note over Client: processQueue() resolves all queued requests.<br>isRefreshing = false.
    Client->>API: Replay GET /api/applications/ (Header: Bearer [New Access])
    deactivate Client
    API-->>Client: 200 OK (Applications Response)
```

---

### Flow 2: Job Creation, Discovery & Fit Scoring

```mermaid
sequenceDiagram
    autonumber
    participant Recruiter as Recruiter / Company
    participant Candidate as Student / Candidate
    participant API as Django Jobs App (/api/jobs/)
    participant DB as Neon PostgreSQL
    participant Bot as Telegram Bot Engine

    %% Recruiter creates job
    Recruiter->>API: POST /api/jobs/ {title, description, salary_min, salary_max, skills: ["Python", "Django"]}
    API->>DB: Insert Job (status='PUBLISHED') & JobSkill records
    DB-->>API: Job #42 created
    API-->>Recruiter: 201 Created

    %% Candidate browses & searches
    Candidate->>API: GET /api/jobs/?search=Python&location=Phnom+Penh
    API->>DB: filter_jobs(search, location, status='PUBLISHED')
    DB-->>API: Filtered job set
    API-->>Candidate: 200 OK (List of matching jobs)

    %% Best-Fit Recommendations Calculation
    Candidate->>API: GET /api/recommendations/
    API->>DB: Query CandidateSkills vs. Published JobSkills
    Note over API: Computes Jaccard/weighted skill overlap score (%)
    API->>DB: Update CandidateJobMatchCache
    API-->>Candidate: 200 OK (Jobs ranked by match percentage)

    %% Mobile Telegram candidate checks jobs
    Candidate->>Bot: Send Telegram command: /jobs
    Bot->>API: Query get_public_jobs()
    API-->>Bot: Active vacancies
    Bot-->>Candidate: Formatted Rich Job Cards + [Apply on CareerLens] Deep Link
```

---

### Flow 3: Complete ATS Application & Hiring Pipeline

This workflow traces an application through its entire lifecycle from initial submission to formal job offer:

```mermaid
sequenceDiagram
    autonumber
    participant Student as Candidate
    participant API as Applications App
    participant DB as Neon PostgreSQL
    participant Recruiter as Recruiter (Company)
    participant Notif as Notifications Engine

    %% 1. Application Submission
    Student->>API: POST /api/applications/ {job_id: 42, cover_letter: "..."}
    API->>DB: Check uniqueness: Application.objects.filter(candidate, job).exists()
    Note over API,DB: Atomic Transaction:
    API->>DB: Insert Application (status='APPLIED')
    API->>DB: Insert ApplicationStatusHistory (old='', new='APPLIED', note='Submitted')
    API->>DB: Insert AuditLog (action='CREATE')
    API-->>Student: 201 Created

    %% 2. Recruiter Review & Status Update
    Recruiter->>API: PATCH /api/applications/101/ {status: 'REVIEWING'}
    API->>DB: Update Application status to 'REVIEWING'
    API->>DB: Insert ApplicationStatusHistory (old='APPLIED', new='REVIEWING')
    API->>Notif: Create Notification (type='INFO', message='Application under review')
    API-->>Recruiter: 200 OK

    %% 3. Interview Scheduling
    Recruiter->>API: POST /api/interviews/ {application: 101, scheduled_at: "2026-11-20T10:00:00Z", meeting_link: "https://meet.google.com/abc-defg-hij"}
    API->>DB: Insert Interview record
    API->>DB: Update Application status to 'INTERVIEW'
    API->>Notif: Create Notification (type='ALERT', message='Interview scheduled with Google Meet link')
    API-->>Recruiter: 201 Created

    %% 4. Offer Issuance
    Recruiter->>API: POST /api/offers/ {application: 101, salary: 850, currency: "USD", message: "Welcome to the team!"}
    API->>DB: Insert Offer (status='PENDING')
    API->>DB: Update Application status to 'OFFERED'
    API->>Notif: Create Notification (type='SUCCESS', message='Congratulations! You received a job offer.')
    API-->>Recruiter: 201 Created

    %% 5. Candidate Acceptance
    Student->>API: PATCH /api/offers/55/ {status: 'ACCEPTED'}
    API->>DB: Update Offer (status='ACCEPTED', responded_at=now())
    API-->>Student: 200 OK
```

---

### Flow 4: Google Gemini AI — Bring-Your-Own-Key (BYOK) Resume Studio

```mermaid
sequenceDiagram
    autonumber
    participant Student as Candidate
    participant Client as Frontend (CVStudio.jsx)
    participant API as Django Resumes App
    participant Quota as CandidateUsage (Free Quota)
    participant Gemini as Google Gemini API (v1beta)
    participant DB as Neon PostgreSQL

    Student->>Client: Enter Gemini API Key + Target Role ("Backend Engineer")
    Client->>API: POST /api/auth/gemini-key/ {api_key: "AIzaSy..."}
    API->>Gemini: Probe GET /models?key=AIzaSy... (ListModels)
    alt Key is Invalid
        Gemini-->>API: 400 Bad Request / 403 Forbidden
        API-->>Client: 400 Validation Error ("API key authentication failed")
    else Key is Valid
        Gemini-->>API: 200 OK (Available model list)
        API->>DB: Save key to CandidateProfile.gemini_api_key
        API-->>Client: 200 OK ("Key is valid and active with gemini-3.5-flash-lite")
    end

    %% Diagnosis & Improvement Request
    Student->>Client: Click "Generate AI CV Improvement"
    Client->>API: POST /api/resumes/improvement/generate/ {target_role: "Backend Engineer"}
    API->>Quota: Check improvements_used < improvements_limit (5)
    alt Quota Exceeded
        Quota-->>API: False (Quota reached)
        API-->>Client: 403 Forbidden ("AI improvement limit reached for Free plan")
    else Quota Available
        API->>Gemini: POST /models/gemini-3.5-flash-lite:generateContent (Structured Prompt + JSON Schema)
        Gemini-->>API: 200 OK (Structured JSON with improved bullet points, ATS keywords, summary)
        API->>Quota: Increment improvements_used += 1
        API->>DB: Save ResumeVersion (version_number=2, is_current=False)
        API-->>Client: 201 Created (ResumeVersion payload)
        Client-->>Student: Render live side-by-side diff comparison
    end
```

---

### Flow 5: 24/7 Telegram Recruitment Bot & Deep Linking

```mermaid
sequenceDiagram
    autonumber
    participant User as Mobile Telegram User
    participant Telegram as Telegram Cloud Servers
    participant Render as Render Web Service (/api/telegram/webhook/)
    participant Bot as pyTelegramBotAPI Handlers
    participant DB as Neon PostgreSQL
    participant Browser as Candidate Mobile Browser

    User->>Telegram: Send "/jobs" or "🔍 Search React"
    Telegram->>Render: HTTPS POST /api/telegram/webhook/ (Headers: X-Telegram-Bot-Api-Secret-Token)
    Render->>Render: Verify secret token matches TELEGRAM_WEBHOOK_SECRET
    Render->>Bot: Parse update into telebot.types.Update
    Bot->>DB: Query get_public_jobs(search="React")
    DB-->>Bot: Return active Job records
    Bot->>Bot: Format HTML summary card with salary & deadline
    Bot->>Bot: Attach InlineKeyboardMarkup:<br>[🔎 View Details (callback)] [🚀 Apply on CareerLens (URL)]
    Bot->>Telegram: sendMessage with reply markup
    Telegram-->>User: Display interactive job cards

    %% User clicks Apply button
    User->>Browser: Click [🚀 Apply on CareerLens]
    Browser->>Browser: Open https://careerlens-ivory-ten.vercel.app/candidate/jobs/42
    Browser->>Browser: ProtectedRoute checks auth -> Preserves redirect URL
```

---

### Flow 6: Continuous UptimeRobot Keep-Alive Execution

To guarantee zero latency cold starts on Render's free compute tier:

```mermaid
sequenceDiagram
    autonumber
    participant Uptime as UptimeRobot Cloud Engine
    participant Render as Render Container (/api/telegram/webhook/)
    participant Django as Django Webhook View

    loop Every 10 Minutes
        Uptime->>Render: HTTP GET /api/telegram/webhook/
        Render->>Django: Route request to TelegramWebhookView.get()
        Note over Django: Reads environment flags.<br>No database queries executed.<br>Response time < 50ms.
        Django-->>Render: 200 OK {"service": "CareerLens Telegram Bot Webhook", "status": "ready"}
        Render-->>Uptime: 200 OK
        Note over Render: Inactivity timer (15 min) reset.<br>Container stays perpetually warm.
    end
```

---

## 3. Data Transformations & Processing Invariants

1. **API Response Normalization (`extractResults`):**
   - The frontend utility [extractResults](file:///d:/Project/University/Website/CareerLens/frontend/src/utils/storage.js) handles both paginated DRF responses (`{ results: [...], count: 42 }`) and unpaginated arrays (`[...]`), ensuring UI components always receive flat, safe iterable arrays.
2. **Atomic ATS State Mutations:**
   - Any status transition on `ApplicationViewSet` executes inside `django.db.transaction.atomic()`, guaranteeing that `Application`, `ApplicationStatusHistory`, `Notification`, and `AuditLog` records either all commit or all roll back.
3. **HTML Sanitization in Telegram Bot:**
   - Rich job descriptions frequently contain markup from web text editors. The Telegram bot strips HTML tags via regex (`re.sub(r"<[^>]+>", " ", raw_desc)`), normalizes whitespace, and truncates text exceeding 1800 characters to adhere strictly to Telegram's 4096-character message limit.

