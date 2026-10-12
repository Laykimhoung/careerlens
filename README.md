# CareerLens — University Recruitment & Applicant Tracking System (ATS)

CareerLens is a modern, full-stack recruitment platform designed to bridge university students, graduates, and tech employers. Built with **Django REST Framework** on the backend and **React + Vite** on the frontend, CareerLens streamlines the recruitment journey from job discovery and application tracking to technical interviews, job offers, and real-time candidate-recruiter messaging.

---

## Table of Contents

- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Prerequisites](#prerequisites)
- [Quick Start Guide](#quick-start-guide)
  - [Step 1: Clone the Repository](#step-1-clone-the-repository)
  - [Step 2: Database Setup (PostgreSQL)](#step-2-database-setup-postgresql)
  - [Step 3: Backend Installation & Setup](#step-3-backend-installation--setup)
  - [Step 4: Frontend Installation & Setup](#step-4-frontend-installation--setup)
- [Demo Accounts & Ready-to-Test Dataset](#demo-accounts--ready-to-test-dataset)
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

### Step 1: Clone the Repository

Open your terminal or command prompt and clone the project:

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

### Step 3: Backend Installation & Setup

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
   Populate the database with a pre-configured, realistic dataset (24 IT jobs across 9 Cambodian and tech companies, 5 candidates, applications, and messages):
   ```bash
   python manage.py seed_demo_data
   ```

7. **Start the Django Development Server**:
   ```bash
   python manage.py runserver
   ```
   The backend API is now running at: **`http://127.0.0.1:8000/`**
   API base endpoint: **`http://127.0.0.1:8000/api/`**

---

### Step 4: Frontend Installation & Setup

1. **Open a new terminal window** (keep the backend server running) and navigate to the frontend directory:
   ```bash
   cd CareerLens/frontend
   ```

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

Open **`http://localhost:5173/`** in your browser to explore CareerLens!

---

## Demo Accounts & Ready-to-Test Dataset

When you run `python manage.py seed_demo_data`, the platform generates predefined demo accounts ready for immediate testing.

- **Universal Demo Password:** `CareerLens2026!Demo`

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
| Username | Role | Permissions |
| :--- | :--- | :--- |
| `demo_admin` | `ADMIN` | Superuser/Staff access for Django Admin (`http://127.0.0.1:8000/admin/`) and audit verification |

---

## Django Management Commands

CareerLens includes custom, production-safe management commands designed to simplify testing and presentation.

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