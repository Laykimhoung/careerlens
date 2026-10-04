# CareerLens — Frontend Architecture

This document describes the structure, conventions, and component relationships of the CareerLens React frontend. It is intended for all frontend team members.

---

## 1. Technology Stack

| Tool | Purpose |
|---|---|
| React 19 | Component-based UI library |
| Vite 8 | Development server and production bundler |
| React Router DOM 7 | Client-side routing |
| Axios | HTTP client for API requests |
| Tailwind CSS 4 | Utility-first CSS (available but used lightly) |
| Custom CSS files | Primary styling method (per-component `.css` files) |

---

## 2. Directory Structure

```
frontend/
├── public/              # Static assets served directly
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/
│   │   └── css/         # Shared CSS files loaded by layouts
│   │       ├── admin.css
│   │       └── company.css
│   ├── components/
│   │   ├── admin/       # Admin-only UI components
│   │   ├── company/     # Company-only UI components
│   │   ├── candidate/   # Candidate-only UI components
│   │   ├── common/      # Shared components (ProtectedRoute, Loading, etc.)
│   │   └── landing/     # Public landing page components
│   ├── context/
│   │   └── AuthContext.jsx   # Global auth state provider
│   ├── hooks/
│   │   ├── useAuth.js        # Consumes AuthContext
│   │   ├── useFetch.js       # Generic data-fetching hook
│   │   └── useForm.js        # Form state management hook
│   ├── layouts/
│   │   ├── MainLayout.jsx    # Public pages (landing, auth)
│   │   ├── CandidateLayout.jsx
│   │   ├── CompanyLayout.jsx
│   │   └── AdminLayout.jsx
│   ├── pages/
│   │   ├── admin/       # Admin dashboard pages
│   │   ├── company/     # Company dashboard pages
│   │   ├── candidate/   # Candidate dashboard pages
│   │   ├── auth/        # Login, register, password reset
│   │   └── landing/     # Public home page
│   ├── routes/
│   │   └── AppRoutes.jsx     # All route definitions
│   ├── services/
│   │   ├── api.js            # Axios instance with JWT interceptors
│   │   ├── authService.js    # Authentication API calls
│   │   ├── adminService.js   # Admin API calls
│   │   ├── companyService.js # Company API calls
│   │   ├── jobService.js     # Job API calls
│   │   ├── applicationService.js
│   │   ├── interviewService.js
│   │   ├── candidateService.js
│   │   └── member3DemoStore.js  # Local demo data (localStorage)
│   ├── utils/
│   │   ├── storage.js        # localStorage helpers (token, user)
│   │   ├── constants.js      # Shared constants
│   │   ├── formatters.js     # Date and text formatting utilities
│   │   └── validators.js     # Shared validation functions
│   ├── App.jsx               # Root component (wraps AuthProvider + AppRoutes)
│   ├── main.jsx              # React DOM entry point
│   └── index.css             # Global CSS reset and base styles
├── index.html
├── package.json
└── vite.config.js
```

---

## 3. Application Entry Point Flow

```
index.html
  └── main.jsx            (mounts React into #root)
        └── App.jsx       (wraps everything in AuthProvider)
              └── AppRoutes.jsx  (BrowserRouter + all Route definitions)
                    ├── MainLayout      → / /login /register /forgot-password /reset-password
                    ├── CandidateLayout → /candidate/* (protected, role: candidate)
                    ├── CompanyLayout   → /company/*   (no ProtectedRoute currently)
                    └── AdminLayout     → /admin/*      (no ProtectedRoute currently)
```

> **Note:** As of the current codebase, only the `/candidate` route uses `ProtectedRoute`. The `/company` and `/admin` routes do not have `ProtectedRoute` applied. Role-based access for these routes requires backend enforcement.

---

## 4. Authentication and State

- `AuthContext.jsx` holds `user`, `setUser`, and `logout` in React context.
- `useAuth.js` is the custom hook that reads from `AuthContext`. Components call `useAuth()` instead of `useContext(AuthContext)` directly.
- `storage.js` provides localStorage helpers: `setToken`, `getToken`, `removeToken`, `setUser`, `getUser`, `removeUser`.
- `api.js` attaches the JWT token to every outgoing request via an Axios request interceptor. On a 401 response, it clears the session and redirects to `/login`.

---

## 5. Layouts

| Layout | Route prefix | Purpose |
|---|---|---|
| `MainLayout` | `/` | Public pages: landing, login, register |
| `CandidateLayout` | `/candidate` | Candidate sidebar + header + content |
| `CompanyLayout` | `/company` | Company sidebar + header + content |
| `AdminLayout` | `/admin` | Admin sidebar + content |

Layouts use the React Router `<Outlet />` element to render the matched child page inside the layout shell.

---

## 6. Demo Data

The file `src/services/member3DemoStore.js` provides a localStorage-backed demo data store used by Company and Admin pages while the backend API is not yet connected. It exports:

- `getDemoCollection(name)` — read a data collection by name
- `saveDemoCollection(name, value)` — overwrite a collection
- `updateDemoItem(name, id, changes)` — update a single item by id
- `resetDemoStore()` — clear localStorage and restore initial data

Collections: `jobs`, `applicants`, `interviews`, `profile`, `users`, `candidates`, `companies`.

---

## 7. Styling Conventions

- Most components use **local `.css` files** imported alongside the component.
- Shared layout CSS is in `src/assets/css/admin.css` and `src/assets/css/company.css`.
- The **workspace design system** (class names starting with `workspace-`) is the shared visual language for Admin and Company dashboards.
- Tailwind utility classes are available but used selectively (notably in `VerificationCard.jsx`).
- Do not mix Tailwind and custom CSS without a clear reason.

### Workspace design system classes (Admin and Company)

| Class | Purpose |
|---|---|
| `.workspace-page` | Page container |
| `.workspace-heading` | Title + action row |
| `.workspace-stat` | Statistics card |
| `.workspace-panel` | Content panel card |
| `.workspace-card` | Generic bordered card |
| `.workspace-button` | Secondary button |
| `.workspace-button-primary` | Primary (green) button |
| `.workspace-button-danger` | Danger (red) button |
| `.workspace-status` | Status badge |
| `.workspace-status-success` | Green status badge |
| `.workspace-status-warning` | Amber status badge |
| `.workspace-status-danger` | Red status badge |
| `.workspace-table-wrap` | Scrollable table container |
| `.workspace-table` | Standard data table |
| `.workspace-search` | Search input |
| `.workspace-empty` | Empty state message |
| `.demo-label` | "Demo data" warning banner |

---

## 8. Admin Role — Pages and Components

### Pages (`src/pages/admin/`)

| File | Route | Purpose |
|---|---|---|
| `Dashboard.jsx` | `/admin` | Statistics grid, bar chart, audit log |
| `Users.jsx` | `/admin/users` | User table with search, suspend, delete |
| `Companies.jsx` | `/admin/companies` | Company list management |
| `Candidates.jsx` | `/admin/candidates` | Candidate list management |
| `Jobs.jsx` | `/admin/jobs` | Job listing management |
| `Verification.jsx` | `/admin/verification` | Company verification queue |

### Components (`src/components/admin/`)

| File | Purpose |
|---|---|
| `AdminSidebar.jsx` | Fixed left navigation for admin |
| `UserTable.jsx` | Table with search, status badge, action buttons |
| `VerificationCard.jsx` | Card showing a company pending verification |

---

## 9. Company Role — Pages and Components

### Pages (`src/pages/company/`)

| File | Route | Purpose |
|---|---|---|
| `Dashboard.jsx` | `/company` | Stats, recent applicants, open roles |
| `Profile.jsx` | `/company/profile` | Company profile view and edit |
| `Jobs.jsx` | `/company/jobs` | Job postings list |
| `CreateJob.jsx` | `/company/jobs/create` | Create a new job posting |
| `EditJob.jsx` | `/company/jobs/:id/edit` | Edit an existing job posting |
| `Applicants.jsx` | `/company/applicants` | All applicants list |
| `ApplicantDetails.jsx` | `/company/applicants/:id` | Individual applicant detail view |
| `Interviews.jsx` | `/company/interviews` | Upcoming interviews list |

### Components (`src/components/company/`)

| File | Purpose |
|---|---|
| `CompanySidebar.jsx` | Fixed left navigation for company |
| `CompanyHeader.jsx` | Top header bar for company pages |
| `JobCard.jsx` | Single job posting card |
| `JobForm.jsx` | Shared job create/edit form |
| `ApplicantCard.jsx` | Single applicant summary card |

---

## 10. Backend API Integration Points

The backend Django REST API is documented in `docs/API.md`.

The frontend communicates with the backend through `src/services/api.js` (Axios instance). Each role has a dedicated service file.

**Environment variable required:**
```
VITE_API_URL=http://127.0.0.1:8000/api
```

Set this in `frontend/.env`. Never commit the `.env` file.

---

## 11. File Ownership

See `docs/TEAM_WORKFLOW.md` for the full ownership table.

- Admin and Company pages and components: **Youe**
- Auth pages and candidate pages: **En**
- Landing page: **Dana**
- Backend: **Kimhoung**

---

## 12. Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

Other available scripts from `package.json`:

| Script | Purpose |
|---|---|
| `npm run dev` | Start Vite development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

---

*Last updated: 2026-10-02. Maintained by Youe (Admin + Company frontend).*
