
# CareerLens — Project Setup Guide

This guide explains how to clone CareerLens, configure the local development environment, run the frontend and backend, and work on your own Git branch.

## 1. Prerequisites

Install these tools before starting:

| Tool | Purpose |
|---|---|
| Git | Clone the repository and manage branches |
| Python 3.12 | Run the Django backend |
| Node.js LTS | Run the React frontend |
| npm | Install frontend dependencies |
| PostgreSQL | Store application data |
| VS Code | Recommended code editor |

Verify your installations in the terminal:

```bash
git --version
python --version
node --version
npm --version
psql --version
```

If `python` does not work on Windows, try:

```bash
py -3.12 --version
```

Use Python 3.12 for this project unless the team agrees to change
the supported Python version.

---

## 2. Clone the Repository

Open a terminal in the folder where you want to store CareerLens.

Replace the example URL with the actual GitHub repository URL.

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
```

For example, the folder structure should contain:

```text
CareerLens/
├── backend/
├── frontend/
├── docs/
├── .gitignore
└── README.md
```

If GitHub prompts you to authenticate, follow its authentication
instructions. Do not share your GitHub password or access token
with other team members.

### Get the latest integration branch

```bash
git switch develop
git pull origin develop
```

Always start by synchronizing with `develop` before creating your
working branch.

---

## 3. Create or Switch to Your Own Branch

Each team member must work on their assigned branch.

| Member | Branch |
|---|---|
| Dana | `frontend/dana` |
| En | `frontend/en` |
| Youe | `frontend/youe` |
| Kimhoung | `backend/kimhoung` |

---

## Create Your own local branch

### Dana
git switch -c frontend/dana origin/develop

### En
git switch -c frontend/en origin/develop

### Youe
git switch -c frontend/youe origin/develop

### Kimhoung
git switch -c backend/kimhoung origin/develop
### If your branch already exists on GitHub

For example, Dana can run:

```bash
git fetch origin
git switch --track origin/frontend/dana
```

If the local branch already exists, use:

```bash
git switch frontend/dana
```

Replace the branch name with your own.

### If your branch does not exist yet

First make sure you are on the latest `develop` branch:

```bash
git switch develop
git pull origin develop
git switch -c frontend/dana
git push -u origin frontend/dana
```

Replace `frontend/dana` with your assigned branch.

**Important:** Create your branch only once. After that, continue
using the same branch for your work.

---

## 4. Set Up the Backend (Django)

All team members may need the backend running locally to test
frontend integration.

Open a terminal in the project root.

### Step 1 — Enter the backend directory

```bash
cd backend
```

### Step 2 — Create a virtual environment

On Windows:

```bash
py -3.12 -m venv .venv
```

### Step 3 — Activate the virtual environment

For Windows Command Prompt:

```bat
.venv\Scripts\activate.bat
```

For Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, use Command Prompt or follow your
local Python environment instructions.

### Step 4 — Install dependencies

```bash
pip install -r requirements.txt
```

Do not install dependencies one by one if they are already listed
in `requirements.txt`.

### Step 5 — Configure environment variables

Check whether this file exists:

```text
backend/.env.example
```

Create your local environment file by copying the example.

Windows Command Prompt:

```bat
copy .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Fill in the required local settings, such as Django's secret key,
debug mode, and PostgreSQL connection details.

```
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```
Never commit your `.env` file.

### Step 6 — Create your local PostgreSQL database

Make sure PostgreSQL is installed and running.

Create a database for CareerLens using pgAdmin or the PostgreSQL
command-line tools.

For example, in `psql`:

```sql
CREATE DATABASE careerlens_db;
```

Configure the database name, username, password, host, and port
according to your local PostgreSQL installation.

The database name above is an example. Use the actual settings
expected by the project's Django configuration.

Each developer should use their own local database unless the team
has explicitly configured a shared development database.

### Step 7 — Apply existing migrations

From the `backend/` directory:

```bash
python manage.py migrate
```

This creates or updates database tables using the migration files
included in the repository.

Do not delete migration files or recreate the database to solve
ordinary migration problems.

### Step 8 — Start Django

```bash
python manage.py runserver
```

By default, Django runs at:

http://127.0.0.1:8000/

Keep this terminal open while testing the application.

---

## 5. Set Up the Frontend (React + Vite)

Open a second terminal in the project root.

### Step 1 — Enter the frontend directory

```bash
cd frontend
```

### Step 2 — Install dependencies

```bash
npm install
```

This installs the packages declared in `package.json` and uses
`package-lock.json` to keep dependency versions consistent.

Do not delete `package-lock.json` or replace it with a different
lockfile.

### Step 3 — Configure frontend environment variables

Check:

```text
frontend/.env.example
```

Copy it to `.env`:

Windows Command Prompt:

```bat
copy .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Set the API URL to match the variable expected by the existing
frontend API client.

```
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

For example, if `frontend/src/services/api.js` uses
`VITE_API_BASE_URL`, the local setting might be:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

This is an example. Follow the actual variable name and URL
convention in the project.

Vite exposes `VITE_` variables to frontend code. Never put passwords,
Django secret keys, or other private credentials in frontend
environment variables.

### Step 4 — Start React

```bash
npm run dev
```

Open the local URL printed by Vite, commonly:

http://localhost:5173/

Keep this terminal open while developing.

---

## 6. Run Both Applications

You need two terminals running at the same time.

**Terminal 1 — Django**

```bash
cd backend
.venv\Scripts\activate
python manage.py runserver
```

**Terminal 2 — React**

```bash
cd frontend
npm run dev
```

The React application sends API requests to Django, and Django
communicates with PostgreSQL.

```text
Browser
   |
   v
React + Vite
   |
   | HTTP API requests
   v
Django REST Framework
   |
   v
PostgreSQL
```

If the frontend cannot connect to Django, check the API base URL,
Django server status, CORS settings, and browser console.

---

## 7. Daily Git Workflow

Before starting work each day, check your branch:

```bash
git branch --show-current
git status
```

Make sure you are on your own branch.

### Step 1 — Get the latest changes from develop

Commit or safely store your current work first.

```bash
git fetch origin
git merge origin/develop
```

If Git reports conflicts, resolve them before continuing.

### Step 2 — Work on your assigned files

Follow the file ownership rules in:

```text
docs/TEAM_WORKFLOW.md
```

Do not modify another member's files without coordinating first.

### Step 3 — Review your changes

```bash
git status
git diff
```

Run the relevant frontend or backend tests.

### Step 4 — Commit your changes

```bash
git add .
git commit -m "feat: describe your changes"
```

Examples:

```text
feat: build landing page
feat: add login and registration
feat: implement candidate dashboard
feat: add company job management
feat: implement candidate API
fix: handle invalid login credentials
```

### Step 5 — Push your branch

```bash
git push
```

For the first push of a new branch, use:

```bash
git push -u origin your-branch-name
```

### Step 6 — Integrate into develop

Open a pull request targeting `develop`, or follow the integration
method agreed upon by the team.

Test the combined application after integration.

Only Kimhoung should approve and merge changes from `develop`
into `main`.

---

## 8. Database and Migration Rules

Kimhoung manages backend model changes and database migrations.

When Kimhoung changes a model, the workflow is:

```bash
python manage.py makemigrations
python manage.py migrate
```

Commit the changed model and its migration files together.

Other team members should pull the changes and run:

```bash
cd backend
python manage.py migrate
```

Do not run `makemigrations` independently unless Kimhoung asks
you to create or update a migration.

If a migration fails, share the complete error with Kimhoung.
Do not delete migration files or manually modify database tables
to bypass the problem.

---

## 9. Common Problems

### Problem: `ModuleNotFoundError`

Make sure the backend virtual environment is activated and run:

```bash
python -m pip install -r requirements.txt
```

### Problem: `npm` or `node` is not recognized

Install a supported Node.js LTS release, reopen the terminal,
and verify:

```bash
node --version
npm --version
```

### Problem: PostgreSQL connection error

Check that PostgreSQL is running and that the database name,
username, password, host, and port in `backend/.env` are correct.

### Problem: CORS error in the browser

Check that Django's CORS configuration permits the actual local
Vite origin, such as `http://localhost:5173`.

Do not disable CORS protections indiscriminately.

### Problem: Missing database tables

From `backend/`, run:

```bash
python manage.py showmigrations
python manage.py migrate
```

If an error remains, send the output to Kimhoung.

### Problem: Git merge conflict

Check which files conflict:

```bash
git status
```

Resolve the conflict carefully, test the application, and commit
the resolution. Ask the file owner for help if you are unsure.

Do not use `git reset --hard` or force-push as a shortcut.

---

## 10. Before Submitting Your Work

Check the following:

- [ ] I am working on my assigned branch.
- [ ] I changed only files I own or changes agreed upon with the team.
- [ ] My application runs locally.
- [ ] My changes have been tested.
- [ ] I did not commit `.env`, credentials, or local databases.
- [ ] I did not commit `node_modules/` or the Python `.venv/`.
- [ ] I committed and pushed my changes.
- [ ] I informed the team about unfinished work or blockers.

---

## Final Reminder

- `main` is the stable branch.
- `develop` is the integration branch.
- Each member works on their own branch.
- Never commit secrets.
- Never delete migrations to fix an ordinary error.
- Coordinate shared-file changes.
- Ask for help before making destructive Git or database changes.

For detailed file ownership, see `docs/TEAM_WORKFLOW.md`.

For API endpoints and request/response formats, see `docs/API.md`.