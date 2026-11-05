# CareerLens Production Deployment Guide

This guide provides step-by-step instructions for deploying the **CareerLens** platform using production-ready cloud services:
* **Frontend:** [Vercel](https://vercel.com/) (React 19 + Vite 8 SPA with Edge CDN & SPA Rewrites)
* **Backend:** [Render](https://render.com/) (Django 5.2 REST Framework + Multi-Threaded Gunicorn + WhiteNoise)
* **Database:** [Neon](https://neon.tech/) (Serverless Hosted PostgreSQL 16 over SSL)
* **Telegram Bot:** [Telegram Cloud](https://core.telegram.org/bots) (`@careerlens_jobs_bot` Webhook Integration)
* **Keep-Alive Engine:** [UptimeRobot](https://uptimerobot.com/) (10-minute HTTP pinging preventing cold-start container sleep)

---

## 1. Production Architecture & Data Flow

```text
       Browser / Client              Telegram Mobile App              UptimeRobot Cloud
      (Desktop & Mobile)             (Job Seekers / Bot)             (Keep-Alive Monitor)
              │                               │                                │
        HTTPS Requests                   HTTPS Messages                  HTTP GET Ping
              │                               │                         (Every 10 mins)
              ▼                               ▼                                │
   [Vercel Global Edge CDN]       [Telegram Bot API Cloud]                     │
    React 19 + Vite 8 SPA          Webhook Event Publisher                     │
  (your-careerlens.vercel.app)           │                                │
              │                               │ HTTPS POST                     │
              │ REST API (Bearer JWT)         ▼                                │
              └─────────────────────► [Render Web Service] ◄───────────────────┘
                                   Django 5.2 + Gunicorn gthread
                                  (your-careerlens-api.onrender.com)
                                         │                    │
                    PostgreSQL Wire (SSL)│                    │ Gemini REST API
                                         ▼                    ▼
                                [Neon Serverless DB]   [Google Gemini AI]
                                   PostgreSQL 16         (BYOK Multi-Model)
```

---

## 2. Free Tier Specifications & Keep-Alive Economics

| Provider | Component | Free Tier Characteristics | Production Considerations & Solutions |
| :--- | :--- | :--- | :--- |
| **Neon** | PostgreSQL 16 | Auto-suspends after 5 min of inactivity. Instant sub-second cold wake-up (< 1s). 0.5 GiB storage. | Requires SSL encryption (`sslmode=require`). Handled automatically by `dj-database-url`. |
| **Render** | Django Web Service | Free web services **spin down after 15 min of inactivity**. Cold start boot takes ~30–50s. Ephemeral filesystem. | **Solution: UptimeRobot 10-minute HTTP keep-alive ping**. Render grants **750 free hours/month**. A full 31-day month is **744 hours** ($31 \times 24 = 744$). Pinging keeps the server awake 24/7 with zero cold starts without exceeding the monthly allowance! |
| **Vercel** | React Frontend | Global Edge CDN, instant loading, 100 GB monthly bandwidth. No cold starts. | Handles client-side routing; `vercel.json` provides wildcard rewrites to `/index.html` preventing 404s on deep links. |
| **Telegram** | Bot API | Free, unlimited webhook delivery from Telegram servers. | Webhook must be accessible over public HTTPS with valid SSL. Handled via Render HTTPS endpoint. |
| **UptimeRobot** | Keep-Alive Monitor | 50 free HTTP/HTTPS monitors with 5-minute or 10-minute intervals. | Configured to ping `https://your-careerlens-api.onrender.com/api/telegram/webhook/` every 10 minutes. |

---

## 3. High-Concurrency Server Configuration (Gunicorn `gthread`)

On cloud container platforms like Render, the default Gunicorn configuration runs a single synchronous worker with 1 thread. When the React single-page application mounts, it fires multiple parallel API requests simultaneously (e.g. `Promise.all` fetching user profile, platform stats, job recommendations, and unread notifications). A single-threaded worker serializes these requests, causing dashboard widgets to freeze or timeout with `502 Bad Gateway` / `504 Gateway Timeout`.

To resolve this, CareerLens uses the multi-threaded **`gthread`** worker class in `Procfile`:

```bash
gunicorn config.wsgi:application --workers 2 --threads 4 --worker-class gthread --worker-tmp-dir /dev/shm --timeout 120
```

### Why this configuration is optimal:
- **`--workers 2`**: Spawns 2 independent Python worker processes.
- **`--threads 4`**: Spawns 4 concurrent execution threads per worker.
- **Total Concurrent Handlers**: $2 \times 4 = 8$ concurrent HTTP requests processed without blocking.
- **`--worker-tmp-dir /dev/shm`**: Mounts worker heartbeat files in shared memory, preventing disk I/O bottlenecks.
- **`--timeout 120`**: Permits long-running tasks (such as AI resume generation or database migration) up to 120 seconds before timing out.

---

## 4. Step-by-Step Deployment Walkthrough

### Stage 1: Provision Neon Serverless PostgreSQL Database

1. Register or log into [Neon](https://neon.tech/).
2. Click **Create Project**:
   * **Project name:** `careerlens-prod`
   * **PostgreSQL version:** 16
   * **Region:** Select the region closest to your Render service (e.g., `Singapore` or `US East (Ohio)`).
3. In the Neon Console, navigate to **Dashboard** $\to$ **Connection Details**.
4. Set the dropdown to **Connection string** and copy the full URI:
   ```text
   postgresql://your_user:your_password@ep-sample-123456.us-east-2.aws.neon.tech/careerlens_db?sslmode=require
   ```
5. Keep this URI safe; it will be used as `DATABASE_URL` in Render.

---

### Stage 2: Deploy Django Backend on Render

1. Log into [Render](https://render.com/).
2. Click **New +** $\to$ **Web Service**.
3. Connect your GitHub repository: `your-username/careerlens`.
4. Configure the service settings:
   * **Name:** `careerlens-api` (Generates `https://your-careerlens-api.onrender.com`)
   * **Region:** Matching your Neon database region.
   * **Branch:** `backend/kimhoung` (or `main`)
   * **Root Directory:** `backend` *(Critical: points Render into the backend subfolder)*
   * **Runtime:** `Python`
   * **Build Command:**
     ```bash
     pip install -r requirements.txt && python manage.py migrate --no-input && python manage.py collectstatic --no-input
     ```
   * **Start Command:**
     ```bash
     gunicorn config.wsgi:application --workers 2 --threads 4 --worker-class gthread --worker-tmp-dir /dev/shm --timeout 120
     ```
   * **Instance Type:** `Free`

5. In the **Environment Variables** section, configure the following key-value pairs:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `PYTHON_VERSION` | `3.12.10` | Enforces Python 3.12 runtime. |
| `SECRET_KEY` | *(50+ char random string)* | Django cryptographic signing key. |
| `DEBUG` | `False` | Disables debug mode in production. |
| `ALLOWED_HOSTS` | `your-careerlens-api.onrender.com,127.0.0.1,localhost` | Permitted host headers. |
| `DATABASE_URL` | `postgresql://...neon.tech/...?sslmode=require` | Connection string copied from Neon. |
| `CORS_ALLOWED_ORIGINS` | `https://your-careerlens.vercel.app` | Allows your deployed Vercel frontend to make API calls. |
| `CSRF_TRUSTED_ORIGINS` | `https://your-careerlens-api.onrender.com` | Protects Django Admin POST actions over HTTPS. |
| `TELEGRAM_BOT_TOKEN` | `your_bot_token_from_botfather` | BotFather token for `@careerlens_jobs_bot`. |
| `TELEGRAM_WEBHOOK_SECRET` | *(Optional secret string)* | Enforces `X-Telegram-Bot-Api-Secret-Token` validation. |

6. Click **Deploy Web Service**. Render will clone the repository, run the build command, apply migrations, collect static files, and launch Gunicorn.

---

### Stage 3: Apply Migrations & Seed Demo Data

Once the Render service is live:
1. Open the **Shell** tab in the Render dashboard.
2. Verify migrations:
   ```bash
   python manage.py migrate
   ```
3. Seed the 24-job realistic demo dataset:
   ```bash
   python manage.py seed_demo_data
   ```
4. Create an administrator account (if needed):
   ```bash
   python manage.py createsuperuser
   ```

---

### Stage 4: Deploy Frontend on Vercel

1. Log into [Vercel](https://vercel.com/).
2. Click **Add New...** $\to$ **Project**.
3. Import your GitHub repository: `your-username/careerlens`.
4. Configure the project:
   * **Framework Preset:** `Vite`
   * **Root Directory:** Click **Edit** and select `frontend`.
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
5. Under **Environment Variables**, add:
   * **Key:** `VITE_API_URL`
   * **Value:** `https://your-careerlens-api.onrender.com/api`
6. Click **Deploy**. Vercel will bundle the React application and deploy it across its global Edge CDN (e.g., `https://your-careerlens.vercel.app`).

---

### Stage 5: Configure Vercel SPA Wildcard Rewrites (`vercel.json`)

To prevent `404 NOT_FOUND` errors when users refresh deep links (such as `/jobs/123`, `/candidate/profile`, or `/404`), ensure `frontend/vercel.json` contains:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This tells Vercel's edge routing to redirect all dynamic browser routes to React's `index.html`, allowing `react-router-dom` to take over client-side navigation seamlessly.

---

### Stage 6: Register Telegram Bot Webhook

To connect the live Telegram Bot (`@careerlens_jobs_bot`) to the Render backend:

1. Open your terminal (or run from anywhere):
   ```bash
   curl "https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/setWebhook?url=https://your-careerlens-api.onrender.com/api/telegram/webhook/"
   ```
2. **Expected Response:**
   ```json
   {"ok": true, "result": true, "description": "Webhook was set"}
   ```
3. Verify that the webhook is healthy and active:
   ```bash
   curl "https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/getWebhookInfo"
   ```
   *Expected Output:*
   ```json
   {
     "ok": true,
     "result": {
       "url": "https://your-careerlens-api.onrender.com/api/telegram/webhook/",
       "has_custom_certificate": false,
       "pending_update_count": 0
     }
   }
   ```

> [!NOTE]
> The webhook endpoint `/api/telegram/webhook/` supports both **POST** (from Telegram Cloud updates) and **GET** (health check for monitoring tools).

---

### Stage 7: Configure UptimeRobot 24/7 Keep-Alive Monitor

Render's free tier spins down web services after 15 minutes of inactivity, resulting in a 30–50 second cold-start delay on subsequent visits. Setting up an automated keep-alive monitor completely eliminates this issue.

#### Why UptimeRobot?
- **Interval**: 10 minutes (pings before the 15-minute inactivity threshold is reached).
- **Quota Math**: $24 \text{ hours} \times 31 \text{ days} = 744 \text{ hours/month} \le 750 \text{ free hours allowed by Render}$.
- **Result**: 100% continuous uptime with instant API responses for live demos, with zero cost.

#### Configuration Steps:
1. Create a free account at [UptimeRobot](https://uptimerobot.com/).
2. On the dashboard, click **+ Add New Monitor**:
   - **Monitor Type:** `HTTP(s)`
   - **Friendly Name:** `CareerLens Webhook` (or `CareerLens Backend Keep-Alive`)
   - **URL (or IP):** `https://your-careerlens-api.onrender.com/api/telegram/webhook/` (or `https://your-careerlens-api.onrender.com/`)
   - **Monitoring Interval:** `Every 10 minutes`
   - **Monitor Timeout:** `30 seconds`
3. Click **Create Monitor**.
4. Once active, the monitor will show:
   - **Status:** `100% Up`
   - **Interval:** `10 min`
   - **Current status:** `Up` (green badge)

---

## 5. Production Verification Checklist

- [x] **Backend Health Check:** `https://your-careerlens-api.onrender.com/` returns JSON with `"status": "online"`.
- [x] **Frontend Home:** `https://your-careerlens.vercel.app` loads landing page with hero, Telegram showcase, and company logos.
- [x] **Cross-Origin Requests:** Logging in from the Vercel frontend receives JWT tokens from Render without CORS warnings.
- [x] **Deep Linking:** Refreshing `/candidate/dashboard` or navigating to `/jobs/1` preserves routes without Vercel 404 errors.
- [x] **Telegram Bot:** Sending `/jobs` to `@careerlens_jobs_bot` returns active job cards with direct link buttons.
- [x] **24/7 Keep-Alive:** UptimeRobot dashboard shows `100% Up` with active 10-minute heartbeat.

---

## 6. Troubleshooting Common Issues

| Symptom | Root Cause | Proven Fix |
| :--- | :--- | :--- |
| **Vercel returns `404 NOT_FOUND` on refresh** | Missing client-side route rewrite rule. | Add `vercel.json` with `{"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}` to the project root and redeploy. |
| **Telegram `setWebhook` returns `401 Unauthorized`** | Expired or incorrect bot token. | Regenerate token via BotFather, update `TELEGRAM_BOT_TOKEN` in Render, and rerun the `setWebhook` curl command with the new token. |
| **API calls hang or fail with `504 Gateway Timeout`** | Gunicorn running with single sync worker. | Update start command to use `--workers 2 --threads 4 --worker-class gthread` in `Procfile`. |
| **`CORS Network Error` on Vercel** | Vercel domain not permitted in Django CORS origins. | Add `https://your-careerlens.vercel.app` to `CORS_ALLOWED_ORIGINS` in Render environment variables. |
| **Initial request takes 45 seconds** | Render container was asleep due to inactivity. | Activate UptimeRobot 10-minute HTTP keep-alive monitor pointing to `/api/telegram/webhook/`. |
| **Database SSL Error on Neon** | Connection string missing SSL mode parameter. | Append `?sslmode=require` to the Neon `DATABASE_URL`. |
