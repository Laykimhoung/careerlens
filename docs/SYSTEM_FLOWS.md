# CareerLens — System Flows & End-to-End Execution Paths

> **Document Type:** End-to-End Runtime Execution & Sequence Specification  
> **Target Audience:** Full-Stack Engineers, System Integrators, QA Engineers, Security Engineers  
> **Status:** Code-Backed & Traced Across Client and Server Implementations  
> **Last Updated:** 2026-11-14  

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
    participant Cache as Django Cache (Rate Limiter)
    participant SecMW as ProductionSecurityMiddleware
    participant WhiteNoise as WhiteNoise Engine

    Host->>Gunicorn: Exec gthread command (Procfile)
    Gunicorn->>Django: Load config.wsgi:application
    Django->>Django: Parse .env via python-dotenv
    Django->>DB: Initialize dj_database_url pool (ssl_require=True, conn_max_age=600)
    DB-->>Django: SSL Connection Verified (PostgreSQL 16)
    Django->>Cache: Verify cache alias for sliding window throttles
    Django->>SecMW: Initialize ProductionSecurityMiddleware (Payload & Rate Limits)
    Django->>WhiteNoise: Mount CompressedManifestStaticFilesStorage
    Django-->>Gunicorn: WSGI Application Ready
    Gunicorn-->>Host: Listening on 0.0.0.0:$PORT (8 Worker Threads)
```

1. **Environment Ingestion:** `backend/config/settings.py` loads environment variables using `python-dotenv`.
2. **Database Health Verification:** `dj_database_url` parses `DATABASE_URL` with SSL mode enforced (`sslmode=require`) and connection pooling (`conn_max_age=600`, `conn_health_checks=True`).
3. **Edge Security Middleware Mounting:** Custom `ProductionSecurityMiddleware` mounts before application views, establishing early payload size gates and sliding window rate limiting buckets in Django cache.
4. **Static Engine Mounting:** WhiteNoise compresses and caches admin and API assets from `staticfiles/` into memory.
5. **Gunicorn Multi-Threading:** Spawns 2 processes each managing 4 concurrent worker threads (`gthread`), providing 8 parallel request executors with strict header and request line size limits.

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
    participant ThemeContext as ThemeProvider
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
    React->>Storage: Inspect theme ('light' | 'dark')
    Storage-->>ThemeContext: Hydrate theme state & prepare View Transitions API
    React->>Router: Evaluate current URL path
    Router->>Router: Dynamically import matched chunk via safeLazy()
    Router-->>Browser: Render role-specific layout & page
```

---

## 2. Critical End-to-End Workflows

### Flow 1: Authentication & Silent Token Refresh Queue

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

    %% Step 2: Authenticated Request
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
    Note over API: Verifies candidate is ONLY patching status.<br>Prevents tampering with salary or message terms.
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
    participant Cache as Django Cache (tg_sq:hash)
    participant DB as Neon PostgreSQL
    participant Browser as Candidate Mobile Browser

    User->>Telegram: Send "/jobs", "/remote", "/internships", or "/search React"
    Telegram->>Render: HTTPS POST /api/telegram/webhook/ (Headers: X-Telegram-Bot-Api-Secret-Token)
    Render->>Render: Check payload length <= 1MB (MAX_WEBHOOK_BODY_BYTES)
    Render->>Render: Verify secret token with hmac.compare_digest
    Render->>Bot: Parse update into telebot.types.Update
    Bot->>Cache: Store/resolve short MD5 key for search queries (callback_data <= 64B)
    Bot->>DB: Query get_public_jobs_page(search, filter_key, page)
    DB-->>Bot: Return paginated Job slice & counts
    Bot->>Bot: Format HTML single-message directory with filter pills & job buttons
    Bot->>Telegram: sendMessage (or edit_message_text on filter/page/back callback)
    Telegram-->>User: Display interactive single-message job directory

    %% User clicks a numbered job button
    User->>Telegram: Tap job button or [🚀 Apply Now]
    Bot->>Telegram: edit_message_text with detailed HTML view (verified badge, blockquote, company & Apply URL)
    User->>Browser: Click [🚀 Apply Now]
    Browser->>Browser: Open https://careerlens-2k26.vercel.app/candidate/jobs/42
    Browser->>Browser: ProtectedRoute checks auth -> Preserves redirect URL
```

---

### Flow 6: Continuous UptimeRobot Keep-Alive Execution

```mermaid
sequenceDiagram
    autonumber
    participant Uptime as UptimeRobot Cloud Engine
    participant Render as Render Container (/api/telegram/webhook/)
    participant Django as Django Webhook View

    loop Every 10 Minutes
        Uptime->>Render: HTTP GET /api/telegram/webhook/
        Render->>Django: Route request to TelegramWebhookView.get()
        Note over Django: Reads environment flags.<br>No database queries executed.<br>Masks secret configuration when DEBUG=False.<br>Response time < 50ms.
        Django-->>Render: 200 OK {"service": "CareerLens Telegram Bot Webhook", "status": "ready"}
        Render-->>Uptime: 200 OK
        Note over Render: Inactivity timer (15 min) reset.<br>Container stays perpetually warm.
    end
```

---

### Flow 7: AI Interview Preparation Coach

```mermaid
sequenceDiagram
    autonumber
    participant Candidate as Candidate User
    participant Modal as InterviewPrepModal.jsx
    participant API as Applications App (/interview-prep/)
    participant Gemini as Google Gemini AI (BYOK)
    participant DB as Neon PostgreSQL (InterviewPreparation)

    Candidate->>Modal: Open Interview Preparation for Application #101
    Modal->>API: GET /api/applications/101/interview-prep/
    alt Cached Interview Prep Exists in DB
        API->>DB: Query InterviewPreparation.objects.filter(application_id=101)
        DB-->>API: Return prep_data
        API-->>Modal: 200 OK {prep: {...}, is_ai_generated: true}
    else Not Yet Generated or Forced Refresh (POST)
        API->>DB: Fetch Application, Job requirements, Candidate skills & Resume
        API->>Gemini: POST /models/gemini-3.5-flash-lite:generateContent<br>(Role context + Candidate gaps + STAR framework)
        Gemini-->>API: 200 OK (Structured JSON: checklist, questions, dos_donts)
        API->>DB: Upsert InterviewPreparation(application=101, prep_data=...)
        API-->>Modal: 200 OK {prep: {...}, is_ai_generated: true}
    end
    Modal-->>Candidate: Render interactive tabs: Checklist, Questions with STAR tips, Dos & Don'ts
```

---

### Flow 8: Edge-Level Security & Throttling Guard

```mermaid
sequenceDiagram
    autonumber
    participant Request as Ingress Request
    participant MW as ProductionSecurityMiddleware
    participant Cache as Django Cache (Rate Limits)
    participant DRF as DRF Throttles (ProxySafe)
    participant View as API Viewset / Controller

    Request->>MW: Ingress HTTP Request
    Note over MW: 1. Check Content-Length <= 10MB
    alt Content-Length > 10MB
        MW-->>Request: 413 Payload Too Large
    end

    MW->>MW: Resolve client IP using get_client_ip(hops[-num_proxies])
    MW->>Cache: Check sliding window bucket (rl:scope:ip:bucket)
    alt Bucket Count > Limit (Global 300/m, Admin 10/m, Webhook 120/m)
        MW-->>Request: 429 Too Many Requests (Retry-After header)
    end

    MW->>DRF: Forward request to DRF pipeline
    DRF->>DRF: Evaluate Scoped Throttles (auth_login, ai_generation, upload, messaging)
    alt Scoped Limit Exceeded
        DRF-->>Request: 429 Too Many Requests
    end

    DRF->>View: Dispatch to View / Action
    View->>View: Enforce Object Permissions (offer status, message author)
    View-->>MW: Response Object
    MW->>MW: Inject Permissions-Policy & Cache-Control: no-store (auth)
    MW-->>Request: Final Protected HTTP Response
```

---

### Flow 9: View Transitions Circular Theme Reveal

```mermaid
sequenceDiagram
    autonumber
    participant User as User
    participant Toggle as ThemeLanguageToggle.jsx
    participant Context as ThemeContext.jsx
    participant DOM as Document Object Model

    User->>Toggle: Click Theme Switch Button
    Toggle->>Context: toggleTheme(buttonElementRef)
    Context->>Context: Calculate button center coordinates (x, y)
    Context->>Context: maxRadius = hypot(max(x, w-x), max(y, h-y))
    Context->>Context: Generate radial clipPath: circle(0% at x y) -> circle(maxRadius at x y)
    Context->>DOM: Set root.dataset.magicuiThemeVt = 'active'
    Context->>DOM: document.startViewTransition(flushSync(applyTheme))
    DOM->>DOM: Snapshot old view -> Apply new theme (data-theme='dark')
    Context->>DOM: Animate ::view-transition-new(root) with clipPath over 400ms
    DOM-->>User: Seamless circular theme expansion across entire screen
```

---

## 3. Data Transformations & Processing Invariants

1. **API Response Normalization (`extractResults`):**
   - The frontend utility [extractResults](file:///d:/Project/University/Website/CareerLens/frontend/src/utils/storage.js) handles both paginated DRF responses (`{ results: [...], count: 42 }`) and unpaginated arrays (`[...]`), ensuring UI components always receive flat, safe iterable arrays.
2. **Atomic ATS State Mutations:**
   - Any status transition on `ApplicationViewSet` executes inside `django.db.transaction.atomic()`, guaranteeing that `Application`, `ApplicationStatusHistory`, `Notification`, and `AuditLog` records either all commit or all roll back together.
3. **HTML Sanitization in Telegram Bot:**
   - Rich job descriptions frequently contain markup from web text editors. `clean_html_to_telegram` converts line/block elements (`<br>`, `</p>`, `<li>`) into clean paragraphs and bullet points, strips remaining tags, truncates on word/line boundaries before calling `html.escape()`, and keeps responses within Telegram's 4096-character limit without broken entities.
4. **Proxy Hop IP Resolution:**
   - In `backend/config/throttles.py`, `get_client_ip()` safely resolves client IPs by picking `hops[-num_proxies]` from `X-Forwarded-For` using `DRF_NUM_PROXIES=1` (Render edge), preventing attackers from injecting arbitrary spoofed IPs via leftmost headers.
