# CareerLens — University Recruitment & Applicant Tracking System (ATS)

CareerLens is a modern, full-stack recruitment platform designed to bridge university students, graduates, and tech employers. Built with **Django REST Framework** on the backend and **React + Vite** on the frontend, CareerLens streamlines the recruitment journey from job discovery and application tracking to technical interviews, job offers, and real-time candidate-recruiter messaging.

---

## Table of Contents

- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Prerequisites](#prerequisites)
- [Quick Start Guide](#quick-start-guide)
  - [Terminal Navigation Guide (Backend vs. Frontend)](#terminal-navigation-guide-backend-vs-frontend)
  - [Step 1: Clone the Repository](#step-1-clone-the-repository)
  - [Step 2: Database Setup (PostgreSQL)](#step-2-database-setup-postgresql)
  - [Step 3: Backend Setup (Terminal 1 — cd backend)](#step-3-backend-setup-terminal-1--cd-backend)
  - [Step 4: Frontend Setup (Terminal 2 — cd frontend)](#step-4-frontend-setup-terminal-2--cd-frontend)
- [Demo Accounts & Ready-to-Test Dataset](#demo-accounts--ready-to-test-dataset)
  - [How to Run and Load the Demo Data](#how-to-run-and-load-the-demo-data)
  - [Candidate Accounts](#1-candidate-accounts)
  - [Company Recruiter Accounts](#2-company-recruiter-accounts)
  - [Administrator Account](#3-administrator-account)
- [Django Management Commands](#django-management-commands)
- [Running Automated Tests](#running-automated-tests)
- [Troubleshooting & Common Issues](#troubleshooting--common-issues)
- [Documentation & Deep Dives](#documentation--deep-dives)

---

## Key Features

- **Role-Based Authentication & Permissions**: Secure stateless JWT authentication supporting dedicated roles: `CANDIDATE`, `COMPANY`, and `ADMIN`.
- **Company & Candidate Profiles**: University educational records, resumes, portfolios, and company verification workflows.
- **IT Job Board**: Rich catalogue across 5 domains (Software Development, Data & AI, Cybersecurity & Networking, Cloud & QA, and other specialized IT roles).
- **End-to-End Application Workflow**: Track candidates through statuses: `APPLIED` $\to$ `REVIEWING` $\to$ `INTERVIEW` $\to$ `OFFERED` $\to$ `REJECTED`.
- **Interviews & Offers**: Schedule technical interviews with meeting links and issue compensation offers with accept/decline responses.
- **Direct Messaging & Notifications**: Bi-directional communication channel between recruiters and applicants with real-time notifications.
- **Auditing & Safe Demo Seeding**: Built-in idempotent demo dataset seeding (`seed_demo_data`) and non-destructive reverse-dependency cleanup (`clear_demo_data`).

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend API** | Python 3.12, Django 5.2, Django REST Framework (DRF), SimpleJWT |
| **Database** | PostgreSQL 14+, Psycopg 3 |
| **Frontend UI** | React 19, Vite, Tailwind CSS v4, Axios, React Router v7 |
| **Security & Auditing** | CORS Headers, Model-Level Audit Logging, Transaction Rollback Guards |

---

## Project Architecture

```text
CareerLens/
├── backend/                  # Django REST API
│   ├── apps/
│   │   ├── accounts/         # Users, CandidateProfile, CompanyProfile, AuditLog
│   │   │   └── management/   # Custom commands (seed_demo_data, clear_demo_data)
│   │   ├── jobs/             # Jobs, Skills, JobSkills, SavedJobs
│   │   ├── applications/     # Applications, Status History, Interviews, Offers, Notes
│   │   └── messaging/        # Direct Messages and Notifications
│   ├── config/               # Django project settings, ASGI/WSGI, routing
│   ├── media/                # User-uploaded files (resumes, media)
│   ├── requirements.txt      # Python backend dependencies
│   ├── .env.example          # Backend environment configuration template
│   └── manage.py
├── frontend/                 # React + Vite application
│   ├── src/                  # Components, pages, router, API client
│   ├── package.json          # Node dependencies and scripts
│   ├── vite.config.js        # Vite bundler configuration
│   └── .env.example          # Frontend environment template
├── docs/                     # Detailed architectural specifications
└── README.md                 # Root documentation and setup guide
```

---

## Prerequisites

Before starting, ensure you have the following installed on your operating system:

1. **Git**: [Download Git](https://git-scm.com/)
2. **Python** (version 3.10 to 3.12+): [Download Python](https://www.python.org/downloads/)
3. **Node.js** (version 18.x or 20.x+) & **npm**: [Download Node.js](https://nodejs.org/)
4. **PostgreSQL** (version 14 or higher): [Download PostgreSQL](https://www.postgresql.org/download/) or run via Docker.

---

## Quick Start Guide

### Terminal Navigation Guide (Backend vs. Frontend)

> [!IMPORTANT]
> **Understanding Full-Stack Terminals (Must Read Before Running Commands)**:
> CareerLens consists of **two independent applications** that communicate over HTTP and must run at the same time:
> 1. **Backend (Django REST API)** $\longrightarrow$ Located in `backend/`
> 2. **Frontend (React + Vite UI)** $\longrightarrow$ Located in `frontend/`
>
> You will need **two separate terminal windows** open side-by-side:
>
> | Task / Command | Which Directory to `cd` into? | Which Terminal? | Example Commands |
> | :--- | :--- | :--- | :--- |
> | **Python / Django / Database** | `cd backend` | **Terminal 1** (Backend) | `python manage.py migrate`<br>`python manage.py seed_demo_data`<br>`python manage.py runserver` |
> | **Node / React / Vite UI** | `cd frontend` | **Terminal 2** (Frontend) | `npm install`<br>`npm run dev` |
>
> ⚠️ **Common Beginner Pitfalls**:
> - If you run `python manage.py ...` inside `frontend/` or the root folder, you will get: `can't open file 'manage.py': [Errno 2] No such file or directory`. Always `cd backend` first!
> - If you run `npm run dev` inside `backend/`, you will get: `npm ERR! code ENOENT package.json not found`. Always `cd frontend` first!

---

### Step 1: Clone the Repository

Open your terminal or command prompt:

```bash
git clone https://github.com/Laykimhoung/careerlens.git
cd CareerLens
```

---

### Step 2: Database Setup (PostgreSQL)

Make sure your PostgreSQL service is running. Create a dedicated database for CareerLens:

#### Option A: Using `psql` (Command Line)
```sql
CREATE DATABASE careerlens_db;
```

#### Option B: Using pgAdmin GUI
1. Open pgAdmin.
2. Right-click on **Databases** $\to$ **Create** $\to$ **Database...**
3. Enter database name: `careerlens_db` and click **Save**.

---

### Step 3: Backend Setup (Terminal 1 — cd backend)

> [!NOTE]
> Keep this terminal window dedicated to running the backend API and database commands.

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create a Python virtual environment**:
   - **Windows**:
     ```bash
     python -m venv .venv
     .venv\Scripts\activate
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install Python dependencies**:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Copy the example environment file to create your active `.env`:
   - **Windows (PowerShell)**:
     ```powershell
     Copy-Item .env.example .env
     ```
   - **macOS / Linux**:
     ```bash
     cp .env.example .env
     ```

   Open `backend/.env` in your text editor and fill in your PostgreSQL credentials:
   ```env
   SECRET_KEY=generate-any-secret-key-string-here
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1

   DB_NAME=careerlens_db
   DB_USER=postgres
   DB_PASSWORD=your_actual_postgres_password
   DB_HOST=127.0.0.1
   DB_PORT=5432

   # Optional: customize demo user passwords (defaults to: CareerLens2026!Demo)
   DEMO_USER_PASSWORD=CareerLens2026!Demo
   ```

5. **Apply Database Migrations**:
   ```bash
   python manage.py migrate
   ```

6. **Seed Realistic Demo Data**:
   Populate the database with a pre-configured, realistic dataset (24 IT jobs across 9 Cambodian and tech companies, 5 candidates, applications, interviews, offers, and direct messages):
   ```bash
   python manage.py seed_demo_data
   ```
   *Expected Terminal Output:*
   ```text
   === CareerLens Demo Data Seeding ===
   Environment: Safe demo seeding (Idempotent & non-destructive)

   [SUCCESS] Demo seeding completed successfully!
   ---------------------------------------------------------
   Total Newly Created Records  : 231
   Total Already Present Records: 3
   ---------------------------------------------------------
   Tracked Demo Jobs Count: 24 (Target: 24)
   Tracked Demo Companies : 9 (Target: 9)
   Tracked Demo Candidates: 5 (Target: 5)
   ```
   > [!TIP]
   > **Idempotent (Safe to run anytime):** Running this command repeatedly will **never duplicate** jobs or accounts. It safely reports existing demo records as `Already Present`.

7. **(Optional) Create Your Own Administrator Account**:
   If you want to create your own personal superuser with custom credentials instead of (or in addition to) the pre-seeded demo admin:
   ```bash
   python manage.py createsuperuser
   ```
   Follow the prompts to enter your username, email, and password. This gives you full administrative access to the Django Admin panel at `http://127.0.0.1:8000/admin/`.

8. **Start the Django Development Server**:
   ```bash
   python manage.py runserver
   ```
   The backend API is now running at: **`http://127.0.0.1:8000/`**
   API base endpoint: **`http://127.0.0.1:8000/api/`**

---

### Step 4: Frontend Setup (Terminal 2 — cd frontend)

> [!NOTE]
> **Do not stop Terminal 1!** Leave your backend server running (`python manage.py runserver`). Open a **NEW second terminal window** for these frontend commands.

1. **Open a new terminal window** and navigate to the `frontend/` directory:
   - **From project root (`CareerLens`)**:
     ```bash
     cd frontend
     ```
   - *(Or if your terminal is currently inside `backend/`, navigate back up first: `cd ../frontend`)*

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Configure Frontend Environment**:
   Copy the example environment file:
   - **Windows (PowerShell)**:
     ```powershell
     Copy-Item .env.example .env
     ```
   - **macOS / Linux**:
     ```bash
     cp .env.example .env
     ```

   Verify `frontend/.env` contains:
   ```env
   VITE_API_URL=http://127.0.0.1:8000/api
   ```

4. **Start the Vite Development Server**:
   ```bash
   npm run dev
   ```

   The frontend is now running at: **`http://localhost:5173/`**

---

### 🎉 You're Ready to Explore!

With both terminals running simultaneously, here is what each URL provides:

| What You Want to Explore | URL to Visit in Browser | Which Server Handles It? | Description |
| :--- | :--- | :--- | :--- |
| **Main Web Application (UI)** | [http://localhost:5173/](http://localhost:5173/) | **Terminal 2 (`frontend`)**: `npm run dev` | Interactive React app: browse jobs, apply, manage applicants, chat |
| **Backend API Health & Directory** | [http://127.0.0.1:8000/](http://127.0.0.1:8000/) | **Terminal 1 (`backend`)**: `python manage.py runserver` | Clean JSON status confirming API is online with an endpoint directory |
| **Django Admin Dashboard** | [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/) | **Terminal 1 (`backend`)**: `python manage.py runserver` | Administrator panel to manage database records, users, and audit logs |
| **Browse Jobs REST API (JSON)** | [http://127.0.0.1:8000/api/jobs/](http://127.0.0.1:8000/api/jobs/) | **Terminal 1 (`backend`)**: `python manage.py runserver` | Direct JSON feed of the 24 IT jobs |
| **Authentication API** | [http://127.0.0.1:8000/api/auth/login/](http://127.0.0.1:8000/api/auth/login/) | **Terminal 1 (`backend`)**: `python manage.py runserver` | JWT token authentication endpoints |

> [!TIP]
> **API Health Root (`http://127.0.0.1:8000/`)**:
> Visiting `http://127.0.0.1:8000/` returns an instant HTTP 200 OK JSON response displaying the API status and links to all available endpoints, confirming your backend is operational!

---

## Demo Accounts & Ready-to-Test Dataset

When you run `python manage.py seed_demo_data` inside the `backend/` directory, the platform generates predefined demo accounts ready for immediate testing.

- **Universal Demo Password:** `CareerLens2026!Demo`

### How to Run and Load the Demo Data

If you haven't loaded the demo data yet, or if you want to re-seed it:

1. Open **Terminal 1** and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Activate your virtual environment:
   - **Windows**: `.venv\Scripts\activate`
   - **macOS / Linux**: `source .venv/bin/activate`
3. Run the seed command:
   ```bash
   python manage.py seed_demo_data
   ```
4. Ensure both dev servers are running:
   - **Terminal 1 (`backend`)**: `python manage.py runserver`
   - **Terminal 2 (`frontend`)**: `npm run dev`
5. Visit **`http://localhost:5173/`** in your browser and log in with any demo account below!

### 1. Candidate Accounts
Use these accounts to test job browsing, application submissions, interview schedules, and offer reviews:

| Username | Candidate Name | Education / Major | Pre-loaded Features |
| :--- | :--- | :--- | :--- |
| `demo_cand_sreymom` | **Sreymom Meas** | RUPP — Computer Science | Scheduled interview & accepted job offer from Mekong Digital Labs |
| `demo_cand_vireak` | **Vireak Chan** | CADT — Software Engineering | Scheduled interview with Wing Bank |
| `demo_cand_dara` | **Dara Sok** | ITC — Data Science & AI | Active offer ($1,400 USD) from Angkor AI Technologies |
| `demo_cand_bopha` | **Bopha Keo** | Paragon — Cybersecurity | Interview scheduled with Cellcard; 1 under review |
| `demo_cand_piseth` | **Piseth Lim** | NUM — Information Technology | Active applications for IT Intern and Software Tester |

### 2. Company Recruiter Accounts
Use these accounts to view candidate applications, schedule interviews, and post new jobs:

| Username | Company | Category | Roles Posted |
| :--- | :--- | :--- | :--- |
| `demo_comp_mekong` | **Mekong Digital Labs** | Fictional Tech Studio | Frontend Dev, Full-Stack Dev, Junior Web Dev, UI/UX Designer |
| `demo_comp_smart` | **Smart Axiata** | Real (*Simulated Vacancies*) | Network Engineer, System Administrator |
| `demo_comp_cellcard` | **Cellcard** | Real (*Simulated Vacancies*) | Cybersecurity Analyst, IT Support Engineer |
| `demo_comp_aba` | **ABA Bank** | Real (*Simulated Vacancies*) | Mobile App Developer, Security Engineer |
| `demo_comp_wing` | **Wing Bank** | Real (*Simulated Vacancies*) | Backend Developer, DevOps Engineer |
| `demo_comp_1byte` | **1Byte** | Real (*Simulated Vacancies*) | Cloud Engineer, Database Administrator |
| `demo_comp_khmercloud`| **KhmerCloud Solutions** | Fictional Cloud Firm | Software Engineer, QA Engineer, Software Tester |
| `demo_comp_angkor` | **Angkor AI Technologies** | Fictional AI Lab | Data Analyst, Data Engineer, ML Engineer, AI Engineer |
| `demo_comp_ppcyber` | **Phnom Penh CyberSec** | Fictional Security Firm | BI Analyst, Technical Support Specialist, IT Intern |

### 3. Administrator Account
| Username | Role | Permissions | Default Password |
| :--- | :--- | :--- | :--- |
| `demo_admin` | `ADMIN` (`is_staff=True`) | Superuser/Staff access for Django Admin and audit verification | `CareerLens2026!Demo` |

> [!TIP]
> **Want to create your own personal administrator account?**
> You can register a personal superuser with your own username and password anytime:
> ```bash
> cd backend
> python manage.py createsuperuser
> ```
> Then log into the Django Admin dashboard at **`http://127.0.0.1:8000/admin/`** with your credentials.

---

## Django Management Commands

CareerLens includes custom, production-safe management commands designed to simplify testing and presentation.

> [!IMPORTANT]
> **Directory Reminder**: All management commands below MUST be executed from the **`backend/`** directory with your virtual environment activated:
> ```bash
> cd backend
> .venv\Scripts\activate   # (Windows) or source .venv/bin/activate (macOS/Linux)
> ```

### Seed Demo Data (Idempotent)
Populates the complete 24-job catalogue, accounts, applications, and messages. Safe to execute repeatedly without generating duplicate records.
```bash
python manage.py seed_demo_data
```

### Dry Run Cleanup
Inspect exactly which records are tracked demo data and verify that unrelated records are protected:
```bash
python manage.py clear_demo_data --dry-run
```

### Clear Demo Data (Non-Destructive)
Safely deletes only tracked demo records in reverse-dependency order, preserving all other users, real companies, and database migrations:
```bash
# Interactive confirmation prompt:
python manage.py clear_demo_data

# Automated non-interactive mode:
python manage.py clear_demo_data --no-input
```

### Reset Demo Dataset in One Command
To reset the demo dataset to a fresh initial state at any time:
```bash
python manage.py clear_demo_data --no-input && python manage.py seed_demo_data
```

---

## Running Automated Tests

Run the comprehensive Django unit and integration test suite (covering accounts, authentication, jobs, applications, messaging, and management commands):

```bash
cd backend
python manage.py test apps
```

All 29 test suites should complete with `OK`.

---

## Troubleshooting & Common Issues

### 1. PostgreSQL Connection Error (`OperationalError: connection to server at "127.0.0.1" failed`)
- Ensure PostgreSQL service is active:
  - **Windows**: Open `services.msc`, locate **postgresql-x64-XX**, and click **Start**.
  - **macOS**: `brew services start postgresql`
  - **Linux**: `sudo systemctl start postgresql`
- Verify that `DB_NAME`, `DB_USER`, and `DB_PASSWORD` in `backend/.env` match your local PostgreSQL configuration.

### 2. Windows PowerShell Script Execution Error (`activate.ps1 cannot be loaded`)
If PowerShell prevents virtual environment activation:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.venv\Scripts\activate
```

### 3. CORS Error on Frontend (`Cross-Origin Request Blocked`)
- Ensure the backend Django server is running on port `8000` (`http://127.0.0.1:8000`).
- Ensure the frontend Vite server is running on port `5173` (`http://localhost:5173`).
- Verify that `CORS_ALLOWED_ORIGINS` in `backend/config/settings.py` includes `http://localhost:5173`.

---

## Documentation & Deep Dives

For in-depth architectural and design documentation, explore the [`docs/`](file:///d:/Project/University/Website/CareerLens/docs) directory:
- [**API Specification**](file:///d:/Project/University/Website/CareerLens/docs/API.md): Endpoint inventory, query parameters, payloads, and response formats.
- [**Database Schema**](file:///d:/Project/University/Website/CareerLens/docs/DATABASE.md): Relational diagram, indexing, uniqueness constraints, and field definitions.
- [**Frontend Architecture**](file:///d:/Project/University/Website/CareerLens/docs/FRONTEND_ARCHITECTURE.md): Component hierarchy, route structure, and state management.
- [**Team Workflow & Branching**](file:///d:/Project/University/Website/CareerLens/docs/TEAM_WORKFLOW.md): Git branching conventions and merge procedures.
- [**Advanced Developer Setup**](file:///d:/Project/University/Website/CareerLens/docs/SETUP.md): Advanced deployment and environment configurations.

---

## License & University Context

CareerLens is developed as a University Capstone Project demonstrating modern Web Application Architecture, REST API Design, and Database Engineering. Real company names mentioned in the demo dataset (Smart Axiata, Cellcard, ABA Bank, Wing Bank, 1Byte) are used solely for educational demonstration purposes; all associated job listings are simulated academic content.