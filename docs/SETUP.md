# CareerLens — Project Setup Guide

This guide explains how to clone CareerLens, set up the backend and frontend, create your Git branch, configure environment variables, run the project locally, and follow the team's Git workflow.

---

## 1. Project Stack

| Technology            | Purpose                           |
| --------------------- | --------------------------------- |
| Git + GitHub          | Version control and collaboration |
| Python 3.12           | Django backend                    |
| Django 5.2            | Backend framework                 |
| Django REST Framework | REST API                          |
| PostgreSQL            | Database                          |
| React                 | Frontend                          |
| Vite                  | Frontend development server       |
| Node.js LTS           | React runtime and tooling         |
| npm                   | Frontend package management       |
| VS Code               | Recommended editor                |

---

# 2. Prerequisites

Install the following before starting:

* Git
* Python 3.12
* Node.js LTS
* npm
* PostgreSQL
* VS Code

Verify your installation:

```bash
git --version
python --version
node --version
npm --version
psql --version
```

On Windows, if `python` does not work:

```bash
py -3.12 --version
```

CareerLens currently uses **Python 3.12**.

---

# 3. Clone the Repository

Open a terminal in the folder where you want to store the project.

Replace the URL with the actual CareerLens GitHub repository:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
```

The project should contain:

```text
CareerLens/
├── backend/
├── frontend/
├── docs/
├── .gitignore
└── README.md
```

---

# 4. Set Up the `develop` Branch

The team's Git structure is:

```text
main
└── develop
    ├── frontend/dana
    ├── frontend/en
    ├── frontend/youe
    └── backend/kimhoung
```

* `main` = stable version
* `develop` = integration branch
* Personal branches = individual development

After cloning, your local repository may **not have a local `develop` branch yet**.

First download the latest remote branch information:

```bash
git fetch origin
```

Check the available remote branches:

```bash
git branch -r
```

You should see:

```text
origin/main
origin/develop
```

Create a local `develop` branch that tracks the remote branch:

```bash
git switch -c develop origin/develop
```

If your Git version does not support `git switch`, use:

```bash
git checkout -b develop origin/develop
```

Verify:

```bash
git branch
```

You should now see:

```text
* develop
  main
```

Update it before creating your personal branch:

```bash
git pull origin develop
```

### Important

Do **not** create a new `develop` branch yourself with:

```bash
git switch -c develop
```

That can create a local branch from the wrong starting point.

Use:

```bash
git switch -c develop origin/develop
```

because `origin/develop` is the team's actual remote integration branch.

---

# 5. Create Your Personal Branch

Each team member has a permanent development branch.

| Member   | Branch             |
| -------- | ------------------ |
| Dana     | `frontend/dana`    |
| En       | `frontend/en`      |
| Youe     | `frontend/youe`    |
| Kimhoung | `backend/kimhoung` |

Make sure you are currently on `develop`:

```bash
git branch --show-current
```

It should show:

```text
develop
```

Then create your personal branch from `origin/develop`.

### Dana

```bash
git switch -c frontend/dana origin/develop
```

### En

```bash
git switch -c frontend/en origin/develop
```

### Youe

```bash
git switch -c frontend/youe origin/develop
```

### Kimhoung

```bash
git switch -c backend/kimhoung origin/develop
```

Then push your branch to GitHub:

```bash
git push -u origin your-branch-name
```

For example:

```bash
git push -u origin frontend/dana
```

After the first push, you can simply use:

```bash
git push
```

### Important

Create your personal branch **only once**.

After that, always continue working on the same branch.

---

# 6. If Your Personal Branch Already Exists on GitHub

If your branch has already been created and pushed to GitHub, do not create it again.

First:

```bash
git fetch origin
```

Then:

```bash
git switch --track origin/frontend/dana
```

Replace `frontend/dana` with your own branch.

For example:

```bash
git switch --track origin/frontend/en
```

If the local branch already exists:

```bash
git switch frontend/dana
```

---

# 7. Backend Setup — Django

The backend is located inside:

```text
backend/
```

All team members may need the backend running locally for frontend integration and testing.

Open a terminal in the project root.

## Step 1 — Enter the backend

```bash
cd backend
```

## Step 2 — Create the virtual environment

Windows:

```bash
py -3.12 -m venv .venv
```

## Step 3 — Activate the virtual environment

### Command Prompt

```bat
.venv\Scripts\activate.bat
```

### PowerShell

```powershell
.\.venv\Scripts\Activate.ps1
```

After activation, your terminal should show something similar to:

```text
(.venv)
```

---

# 8. Install Backend Dependencies

Make sure the virtual environment is activated.

Then:

```bash
python -m pip install --upgrade pip
```

Install the project's dependencies:

```bash
pip install -r requirements.txt
```

Do not install packages manually if they are already listed in `requirements.txt`.

---

# 9. Configure Backend Environment Variables

Check that this file exists:

```text
backend/.env.example
```

Create your local `.env` file.

### Windows Command Prompt

```bat
copy .env.example .env
```

### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

Your structure should become:

```text
backend/
├── .env
├── .env.example
├── manage.py
└── ...
```

The `.env` file is local and must **never be committed to Git**.

---

# 10. Generate the Django Secret Key

Each developer can generate their own local Django secret key.

From the `backend/` directory:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Copy the generated value into:

```text
backend/.env
```

For example:

```env
SECRET_KEY=your-generated-secret-key
DEBUG=True

DB_NAME=careerlens_db
DB_USER=postgres
DB_PASSWORD=your-postgresql-password
DB_HOST=localhost
DB_PORT=5432
```

Do **not** copy the example value above as your actual secret key.

If `python` does not work, use:

```bash
py -3.12 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Security rules

Never commit:

```text
.env
```

Never put secrets in:

```text
README.md
docs/
.env.example
GitHub
frontend/
```

The `.env.example` file should contain placeholders only.

---

# 11. Create the Local PostgreSQL Database

Make sure PostgreSQL is installed and running.

Create a local database using pgAdmin or `psql`.

Example:

```sql
CREATE DATABASE careerlens_db;
```

Then configure your local credentials in:

```text
backend/.env
```

Example:

```env
DB_NAME=careerlens_db
DB_USER=postgres
DB_PASSWORD=your-local-password
DB_HOST=localhost
DB_PORT=5432
```

Each developer should normally use their **own local PostgreSQL database**.

Do not commit database files or database passwords.

---

# 12. Apply Django Migrations

From:

```text
backend/
```

run:

```bash
python manage.py migrate
```

This creates the database tables from the migration files committed to the repository.

Check migration status if needed:

```bash
python manage.py showmigrations
```

Do not delete migration files to solve normal migration problems.

---

# 13. Start Django

Run:

```bash
python manage.py runserver
```

Django will normally run at:

```text
http://127.0.0.1:8000/
```

Keep this terminal running.

---

# 14. Frontend Setup — React + Vite

Open a **second terminal**.

From the project root:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Do not delete:

```text
package-lock.json
```

The lockfile keeps dependency versions consistent between team members.

---

# 15. Configure Frontend Environment Variables

Check:

```text
frontend/.env.example
```

Create your local environment file.

### Command Prompt

```bat
copy .env.example .env
```

### PowerShell

```powershell
Copy-Item .env.example .env
```

Your frontend should contain:

```text
frontend/
├── .env
├── .env.example
├── package.json
└── ...
```

Set the API URL according to the frontend API configuration.

For example:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

The exact variable name must match the project's `src/services/api.js`.

### Important

Only frontend-safe values should use `VITE_` environment variables.

Never put:

```text
Django SECRET_KEY
PostgreSQL password
API private keys
JWT secrets
```

inside frontend environment variables.

Vite variables can be exposed to browser code.

---

# 16. Start React

From:

```text
frontend/
```

run:

```bash
npm run dev
```

Vite will normally provide a URL similar to:

```text
http://localhost:5173/
```

Keep this terminal running.

---

# 17. Run the Full Application

You normally need two terminals.

### Terminal 1 — Django

```bash
cd backend
.venv\Scripts\activate
python manage.py runserver
```

### Terminal 2 — React

```bash
cd frontend
npm run dev
```

Application flow:

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

The frontend communicates with Django through HTTP APIs.

The frontend should **never connect directly to PostgreSQL**.

---

# 18. Daily Git Workflow

Before starting work:

```bash
git branch --show-current
git status
```

Make sure you are on your own branch.

For example:

```text
frontend/dana
```

## Step 1 — Get the latest `develop`

Before updating your branch, save or commit your current work.

Then:

```bash
git fetch origin
git merge origin/develop
```

This brings the latest integration changes from `develop` into your personal branch.

If there are conflicts, resolve them before continuing.

---

## Step 2 — Work on Your Assigned Files

Follow:

```text
docs/TEAM_WORKFLOW.md
```

Only modify files assigned to you unless you coordinate with the owner first.

Avoid unnecessary changes to shared files such as:

```text
App.jsx
routes/AppRoutes.jsx
index.css
services/api.js
package.json
```

---

# 19. Review Your Changes

Before committing:

```bash
git status
```

Review the actual changes:

```bash
git diff
```

Make sure you did not accidentally modify another teammate's files.

---

# 20. Commit Your Changes

Stage your changes:

```bash
git add .
```

Commit:

```bash
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

---

# 21. Push Your Branch

After committing:

```bash
git push
```

For the first push of a new branch:

```bash
git push -u origin your-branch-name
```

Example:

```bash
git push -u origin frontend/dana
```

After that:

```bash
git push
```

---

# 22. Integrating Changes into `develop`

Team development follows:

```text
personal branch
      |
      v
   develop
      |
      v
     main
```

Personal branches:

```text
frontend/dana
frontend/en
frontend/youe
backend/kimhoung
```

merge into:

```text
develop
```

After integration, the combined application should be tested.

`main` is the stable branch.

Only Kimhoung should approve and merge:

```text
develop → main
```

---

# 23. Database and Migration Rules

Kimhoung manages Django model changes and migrations.

When a model changes:

```bash
python manage.py makemigrations
python manage.py migrate
```

The migration files must be committed together with the model changes.

For example:

```text
backend/apps/jobs/models.py
backend/apps/jobs/migrations/0002_....py
```

Both changes should be committed.

Other team members should update their local database by running:

```bash
cd backend
python manage.py migrate
```

Do not independently create migrations unless Kimhoung asks you to.

Do not:

```text
delete migration files
delete the database
manually modify tables
```

to solve an ordinary migration problem.

If a migration error occurs, send the complete terminal error to Kimhoung.

---

# 24. Common Problems

## `ModuleNotFoundError`

Make sure the virtual environment is activated:

```bash
.venv\Scripts\activate
```

Then:

```bash
python -m pip install -r requirements.txt
```

---

## `python` is not recognized

Try:

```bash
py -3.12 --version
```

If Python is installed correctly, you can use:

```bash
py -3.12 -m venv .venv
```

---

## `npm` or `node` is not recognized

Install Node.js LTS, reopen your terminal, then verify:

```bash
node --version
npm --version
```

---

## PostgreSQL connection error

Check:

```text
DB_NAME
DB_USER
DB_PASSWORD
DB_HOST
DB_PORT
```

in:

```text
backend/.env
```

Also make sure PostgreSQL is running.

---

## CORS error

Check that Django allows the actual Vite development origin.

For example:

```text
http://localhost:5173
```

Do not disable CORS security indiscriminately.

---

## Missing database tables

From:

```text
backend/
```

run:

```bash
python manage.py showmigrations
python manage.py migrate
```

If the error remains, send the complete error to Kimhoung.

---

## Git says `develop` does not exist locally

This is normal after a fresh clone.

Run:

```bash
git fetch origin
git switch -c develop origin/develop
```

Or, on older Git:

```bash
git fetch origin
git checkout -b develop origin/develop
```

Then:

```bash
git pull origin develop
```

---

## Git says your personal branch already exists

Do not create it again.

Check:

```bash
git branch
```

Then switch to it:

```bash
git switch frontend/dana
```

Replace the branch name with your own.

---

## Git merge conflict

Check:

```bash
git status
```

Resolve the conflicted files carefully.

Then:

```bash
git add .
git commit
```

Test the application after resolving the conflict.

Do not use:

```bash
git reset --hard
```

or force-push as a shortcut.

If you are unsure, ask the owner of the conflicted file before resolving it.

---

# 25. Files That Must Not Be Committed

Never commit:

```text
.env
.venv/
node_modules/
__pycache__/
*.pyc
local databases
database credentials
Django secret keys
private API keys
```

These should already be covered by `.gitignore`.

Before pushing, always check:

```bash
git status
```

---

# 26. Before Pushing Your Work

Check:

* [ ] I am on my assigned branch.
* [ ] I pulled/merged the latest `develop` changes when necessary.
* [ ] I changed only files I own or changes agreed with the team.
* [ ] The application runs locally.
* [ ] My changes have been tested.
* [ ] I did not commit `.env`.
* [ ] I did not commit passwords or secret keys.
* [ ] I did not commit `node_modules/`.
* [ ] I did not commit `.venv/`.
* [ ] I did not delete migration files.
* [ ] I reviewed `git diff`.
* [ ] I committed my changes.
* [ ] I pushed my branch.

---

# 27. Final Git Rules

Remember these rules:

```text
main
  ↓
Stable production/submission branch

develop
  ↓
Team integration branch

frontend/dana
frontend/en
frontend/youe
backend/kimhoung
  ↓
Individual development branches
```

### Team rules

1. Always work on your own branch.
2. Never develop directly on `main`.
3. Never develop directly on `develop`.
4. Keep your branch updated with `develop`.
5. Do not force-push shared branches.
6. Coordinate before changing shared frontend files.
7. Do not commit `.env` or secrets.
8. Do not delete migrations to solve errors.
9. Test your changes before pushing.
10. Ask before making destructive Git or database changes.

---

# 28. Important Documentation

For team responsibilities and file ownership:

```text
docs/TEAM_WORKFLOW.md
```

For API endpoints and request/response formats:

```text
docs/API.md
```

For the overall project information:

```text
README.md
```

Follow these documents together to keep the CareerLens codebase organized and prevent unnecessary conflicts.
