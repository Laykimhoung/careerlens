# CareerLens Production Deployment Guide

This guide provides step-by-step instructions for deploying the **CareerLens** platform using free hosting services:
* **Frontend:** [Vercel](https://vercel.com/) (React 19 + Vite SPA)
* **Backend:** [Render](https://render.com/) (Django 5.2 REST Framework + Gunicorn + WhiteNoise)
* **Database:** [Neon](https://neon.tech/) (Serverless Hosted PostgreSQL)

---

## 1. Architecture & Data Flow

```text
       Browser / Client
              │
       HTTPS Requests
              │
      ┌───────┴───────────────────────┐
      │                               │
      ▼                               ▼
[Vercel Global CDN]          [Render Web Service]
 React / Vite Frontend       Django 5.2 REST API
 (careerlens.vercel.app)     (careerlens-api.onrender.com)
      │                               │
      │ REST API (JWT Auth)           │ PostgreSQL over SSL
      └──────────────────────────────►│ (sslmode=require)
                                      ▼
                             [Neon Serverless DB]
                             PostgreSQL Instance
```

---

## 2. Free Tier Specifications & Constraints

Before going live, keep these provider behaviors in mind:

| Provider | Component | Free Tier Characteristics | Production Considerations |
| :--- | :--- | :--- | :--- |
| **Neon** | PostgreSQL | Computes auto-suspend after 5 min of inactivity. Instant cold-start wakeup (< 1s). 0.5 GiB storage included. | Requires secure SSL connections (`sslmode=require`). Handled automatically by `dj-database-url`. |
| **Render** | Django Web Service | Free web services **spin down after 15 min of inactivity**. Cold start boot takes ~30–50s on the first incoming request. Filesystem is **ephemeral**. | Uploaded media (resumes) saved locally will be wiped on restart/redeploy. |
| **Vercel** | React Frontend | Global Edge CDN, instant loading, 100 GB monthly bandwidth. No cold starts. | Handles client-side routing; API requests proxy to Render via `VITE_API_URL`. |

---

## 3. Deployment Walkthrough

### Stage 1: Provision Neon PostgreSQL Database

1. Register or log into [Neon](https://neon.tech/).
2. Click **Create Project**:
   * **Project name:** `careerlens-prod`
   * **PostgreSQL version:** 16 (or latest default)
   * **Region:** Select the region closest to your Render region (e.g., `US East (Ohio)` or `Singapore`).
3. In the Neon Console dashboard, navigate to **Dashboard** -> **Connection Details**.
4. Set the dropdown to **Connection string** (or `ParametersOnly`) and copy the full URI:
   ```text
   postgresql://careerlens_owner:npg_SecretPass123@ep-cool-shadow-a5xyz.us-east-2.aws.neon.tech/careerlens_db?sslmode=require
   ```
5. Keep this URI safe. You will supply it as `DATABASE_URL` in Render.

---

### Stage 2: Deploy Django Backend on Render

1. Log into [Render](https://render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository: `Laykimhoung/careerlens`.
4. Configure the service settings:
   * **Name:** `careerlens-api` (or your choice; will create `https://careerlens-api.onrender.com`)
   * **Region:** Choose the region matching your Neon database.
   * **Branch:** `backend/kimhoung` (or `main` when merged)
   * **Root Directory:** `backend` *(Critical: points Render into the backend subfolder)*
   * **Runtime:** `Python`
   * **Build Command:**
     ```bash
     pip install -r requirements.txt && python manage.py collectstatic --no-input
     ```
   * **Start Command:**
     ```bash
     gunicorn config.wsgi:application
     ```
   * **Instance Type:** `Free`

5. In the **Environment Variables** section, add the following key-value pairs:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `PYTHON_VERSION` | `3.12.10` | Enforces matching Python runtime version. |
| `SECRET_KEY` | *(generate a strong 50+ char random string)* | Django cryptographic signing key. |
| `DEBUG` | `False` | Disables debug mode in production. |
| `ALLOWED_HOSTS` | `careerlens-api.onrender.com` | Permitted host headers (Render appends automatically). |
| `DATABASE_URL` | `postgresql://...neon.tech/...?sslmode=require` | Connection string copied from Neon. |
| `CORS_ALLOWED_ORIGINS` | `https://careerlens.vercel.app` | Allows your deployed Vercel frontend to make API calls. |
| `CSRF_TRUSTED_ORIGINS` | `https://careerlens-api.onrender.com` | Protects Django Admin POST actions over HTTPS. |

6. Click **Deploy Web Service**. Render will clone the repository, run the build command, collect static assets into `staticfiles/`, and start Gunicorn.

---

### Stage 3: Apply Migrations & Create Superuser

Database migrations are decoupled from the build command to ensure safety and prevent unmonitored schema mutations.

1. Once the Render service status is **Live**, open the **Shell** tab in the Render dashboard.
2. Run database migrations:
   ```bash
   python manage.py migrate
   ```
   *Verify that all migrations across `accounts`, `jobs`, `applications`, and `messaging` apply successfully (`OK`).*
3. Create the administrative superuser:
   ```bash
   python manage.py createsuperuser
   ```
   *Follow the interactive prompt to set username, email, and password.*
4. Test the API root and Django Admin in your browser:
   * Root API status: `https://careerlens-api.onrender.com/` (should return JSON `{ "status": "online", ... }`)
   * Admin portal: `https://careerlens-api.onrender.com/admin/`

---

### Stage 4: Deploy Frontend on Vercel

1. Log into [Vercel](https://vercel.com/).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository: `Laykimhoung/careerlens`.
4. Configure the project settings:
   * **Framework Preset:** `Vite`
   * **Root Directory:** Click **Edit** and choose `frontend`.
   * **Build Command:** `npm run build` (default)
   * **Output Directory:** `dist` (default)
5. Under **Environment Variables**, add:
   * **Key:** `VITE_API_URL`
   * **Value:** `https://careerlens-api.onrender.com/api` *(Points directly to the `/api` root)*
6. Click **Deploy**. Vercel will install dependencies, build the production bundle, and provide your live URL (e.g., `https://careerlens.vercel.app`).

---

### Stage 5: Final Cross-Origin Handshake

1. Return to the **Render Dashboard** -> `careerlens-api` -> **Environment**.
2. Verify that `CORS_ALLOWED_ORIGINS` contains your exact Vercel frontend URL:
   ```text
   CORS_ALLOWED_ORIGINS=https://careerlens.vercel.app,https://careerlens-git-*.vercel.app
   ```
3. If updated, save changes to trigger a quick reload.
4. Visit your Vercel URL in the browser, register a test student or recruiter account, and verify that login, job browsing, and application submission communicate with the backend smoothly.

---

## 4. Local Development Scripts

For rapid local testing before deploying, use the automated launchers in `scripts/`:

* **Start both Backend and Frontend locally (PowerShell):**
  ```powershell
  .\scripts\dev.ps1
  ```
* **Verify Production Build locally (Bash):**
  ```bash
  sh scripts/build.sh
  ```

---

## 5. Media Uploads & Storage Architecture Notice

* CareerLens supports resume uploads (`FileField` in candidate profiles and job applications).
* On Render's free tier, local disk storage is **ephemeral**: files uploaded to `backend/media/` will be lost when the container spins down due to inactivity or when a new version deploys.
* **Recommended Next Step for Production Media:**
  * Connect an S3-compatible cloud object store (such as **Cloudinary**, **Supabase Storage**, or **AWS S3**) using `django-storages`.
  * For university presentation and demo purposes, resumes can be tested or uploaded during active sessions.

---

## 6. Troubleshooting Common Issues

| Symptom | Root Cause | Fix |
| :--- | :--- | :--- |
| **CORS Network Error in Browser** | Vercel domain not permitted in Django CORS origins. | Add `https://<your-vercel-domain>` to `CORS_ALLOWED_ORIGINS` in Render environment variables. |
| **`400 Bad Request` on API** | Render domain missing from `ALLOWED_HOSTS`. | Ensure `ALLOWED_HOSTS` includes `.onrender.com` or your specific service domain. |
| **`CSRF verification failed` in Admin** | `CSRF_TRUSTED_ORIGINS` missing the Render domain over HTTPS. | Set `CSRF_TRUSTED_ORIGINS=https://careerlens-api.onrender.com`. |
| **Backend Slow to Respond Initially** | Render free tier cold start (container spin-down after 15m). | Wait 30–50 seconds for container startup; subsequent requests respond instantly. |
| **Database SSL Error on Neon** | Connection string missing `?sslmode=require`. | Append `?sslmode=require` to the Neon `DATABASE_URL`. |
