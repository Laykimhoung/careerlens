# CareerLens — Detailed Project Folder Structure

This document is the central, comprehensive reference for the entire CareerLens repository structure, outlining both frontend and backend architectures, component hierarchies, and exact folder responsibilities.

---

## 1. Frontend Structure (`frontend/`)

The frontend is a React application built with Vite. It follows a feature-based, deeply nested folder structure to ensure maximum scalability and maintainability across different dashboards (Candidate, Company, Admin) and public pages.

```text
frontend/
├── public/                # Static assets served directly at the root path (e.g., favicon.ico, robots.txt)
├── src/
│   ├── assets/            # Global static visual assets
│   │   ├── images/        # Raster image files (PNGs, JPGs, WebP) used across the site
│   │   ├── icons/         # Icon files (SVGs, icon sprites)
│   │   └── logos/         # Company and brand logos (e.g., CareerLens logo)
│   │
│   ├── components/        # Reusable UI components, strictly organized by domain
│   │   ├── common/        # Shared agnostic components used everywhere (Buttons, Inputs, Modals, Navbar, Footer)
│   │   ├── landing/       # Components unique to the public landing page (Hero, Features, Testimonials)
│   │   ├── auth/          # Authentication related components (LoginForm, RegisterForm)
│   │   ├── candidate/     # Candidate dashboard exclusive components (JobCard, ResumeUploader, CandidateSidebar)
│   │   ├── company/       # Company dashboard exclusive components (ApplicantBoard, JobForm, CompanyHeader)
│   │   └── admin/         # Admin dashboard exclusive components (UserTable, StatisticsCard, AdminSidebar)
│   │
│   ├── layouts/           # Page wrapper components for consistent UI shells and navigation
│   │   ├── MainLayout/    # Default layout for public pages (renders Navbar + Content + Footer)
│   │   ├── AuthLayout/    # Minimal layout tailored for authentication pages
│   │   ├── CandidateLayout/ # Structural shell containing Candidate Sidebar, Header, and main content area
│   │   ├── CompanyLayout/ # Structural shell containing Company Sidebar, Header, and main content area
│   │   └── AdminLayout/   # Structural shell containing Admin Sidebar, Header, and main content area
│   │
│   ├── pages/             # Route-level screens, organized by domain. Each page has its own folder.
│   │   ├── landing/       # Public landing pages
│   │   │   └── Home/      # Home.jsx (Main landing screen)
│   │   ├── auth/          # Authentication flows
│   │   │   ├── Login/     # Login.jsx (User login screen)
│   │   │   ├── Register/  # Register.jsx (User registration screen)
│   │   │   └── ...
│   │   ├── candidate/     # Candidate specific pages
│   │   │   ├── Dashboard/ # Dashboard.jsx & Dashboard.css
│   │   │   ├── Profile/   # Profile.jsx & Profile.css
│   │   │   └── Jobs/      # Jobs list and search interface
│   │   ├── company/       # Company specific pages
│   │   │   ├── Dashboard/ # Company stats and overview
│   │   │   ├── Jobs/      # Job management (listing, CreateJob, EditJob)
│   │   │   └── Applicants/# Applicant management and Kanban boards
│   │   └── admin/         # Admin specific pages
│   │       ├── Users/     # User management and moderation tables
│   │       ├── Companies/ # Company verification and management
│   │       └── Stats/     # Platform-wide statistics and reporting
│   │
│   ├── context/           # Global React Context providers (React Context API)
│   │   ├── ThemeContext.jsx    # Manages Light/Dark mode state and persists to localStorage
│   │   ├── LanguageContext.jsx # Manages i18n (English/Khmer) translation state
│   │   └── AuthContext.jsx     # Manages user session, JWT tokens, and login status
│   │
│   ├── hooks/             # Custom reusable React hooks (Separation of logic from UI)
│   │   ├── useAuth.js     # Consumes AuthContext safely
│   │   ├── useTheme.js    # Consumes ThemeContext safely
│   │   ├── useLanguage.js # Consumes LanguageContext safely
│   │   └── useFetch.js    # Reusable data fetching hook
│   │
│   ├── locales/           # Language dictionaries for internationalization (i18n)
│   │   ├── en.js          # English translations (JSON object)
│   │   └── km.js          # Khmer translations (JSON object)
│   │
│   ├── routes/            # Route configuration and definitions
│   │   └── AppRoutes.jsx  # The central React Router DOM configuration mapping URLs to Pages & Layouts
│   │
│   ├── services/          # API communication logic and external service integrations
│   │   ├── api.js         # Axios instance with interceptors for attaching JWT tokens
│   │   ├── authService.js # Login, register, token refresh API calls
│   │   ├── candidateService.js # API calls for candidate data
│   │   ├── companyService.js   # API calls for company data
│   │   └── adminService.js     # API calls for admin data
│   │
│   ├── styles/            # Global CSS foundation and design system
│   │   ├── reset.css      # CSS Reset (box-sizing, margins, baseline elements)
│   │   ├── root.css       # CSS Variables (Colors, Rem units, spacing, shadows, light/dark themes)
│   │   ├── global.css     # Global base styles (body font, background, links)
│   │   └── responsive.css # Global responsive utility classes
│   │
│   └── utils/             # Helper functions, formatters, and constants
│       ├── formatters.js  # Date, currency, string manipulation helpers
│       ├── validators.js  # Form validation logic
│       └── constants.js   # Application-wide constants (e.g., API endpoints, pagination limits)
│
├── .env                   # Local environment variables (API URLs, Vite config) - NEVER COMMITTED
├── .env.example           # Example environment variables required to run the frontend
├── package.json           # Frontend dependencies (React, React Router, Axios) and npm scripts
└── vite.config.js         # Vite configuration (Port settings, aliases, proxy configurations)
```

### Detailed Frontend Structural Rules

- **`components/` vs `pages/`**: 
  - **Components** are reusable, isolated UI pieces. They receive data via props and should not manage complex routing logic. (Example: `JobCard`, `Button`, `ApplicantTable`).
  - **Pages** represent full route-level screens. They fetch data (using `services/`), manage complex state, and compose multiple components together to form a view. (Example: `JobDetails`, `Dashboard`).
- **Component Colocation**: If a CSS file belongs strictly to a component or a page, it must live in the exact same directory as that component/page (e.g., `src/pages/candidate/Dashboard/Dashboard.css` lives next to `Dashboard.jsx`). Global CSS lives in `styles/`.
- **`layouts/` Architecture**: Shared UI shells that wrap around pages, ensuring consistent navigation and structure. This prevents duplicating headers and sidebars inside every individual page. The `AppRoutes.jsx` nests `<Outlet />` inside these layouts.
- **`styles/root.css` Design System**: We use `rem` for all layout spacing and font sizing (where `1rem = 16px`). Brand colors (CareerLens Blue) are defined here and dynamically swap when the dark mode theme is activated.

---

## 2. Backend Structure (`backend/`)

The backend is built with Django and Django REST Framework. It follows a highly modular, app-based architecture designed for micro-service separation within a monolith.

```text
backend/
├── config/                # Main Django project configuration directory
│   ├── settings.py        # Central Django settings (Database, Apps, Middleware, JWT config)
│   ├── urls.py            # Master URL router (Includes routes from all modular apps)
│   └── wsgi.py / asgi.py  # Web Server Gateway Interface configurations for production deployment
│
├── apps/                  # Directory containing all modular Django applications (Domains)
│   │
│   ├── accounts/          # Domain: User authentication, roles, and profiles
│   │   ├── models.py      # Custom User model, CandidateProfile, CompanyProfile
│   │   ├── serializers.py # JSON translation layers for User and Profile data
│   │   ├── views.py       # API endpoints (Registration, Login, Profile updates)
│   │   └── urls.py        # /api/accounts/... routes
│   │
│   ├── jobs/              # Domain: Job posting and management
│   │   ├── models.py      # Job, Category, Skill models
│   │   ├── serializers.py # Job creation and read serializers
│   │   ├── views.py       # API endpoints (Create Job, List Jobs, Filter Jobs)
│   │   └── urls.py        # /api/jobs/... routes
│   │
│   ├── applications/      # Domain: Job application workflow and tracking
│   │   ├── models.py      # Application tracking model (Status: Pending, Reviewed, Rejected)
│   │   ├── serializers.py # Application submission and review serializers
│   │   ├── views.py       # API endpoints (Apply for job, Update application status)
│   │   └── urls.py        # /api/applications/... routes
│   │
│   └── (other apps...)    # Additional domains like notifications, messaging, etc.
│
├── manage.py              # Django command-line utility (migrations, runserver, createsuperuser)
├── requirements.txt       # Python dependencies (Django, djangorestframework, psycopg2, etc.)
└── .env.example           # Example environment variables (Database credentials, Secret Key)
```

### Detailed Backend Structural Rules

Within each Django app (e.g., `apps/jobs/`), specific files hold distinct responsibilities:

- **`models.py`**: Defines the database schema and entity relationships using Django ORM. This is the single source of truth for the database structure.
- **`serializers.py`**: Converts complex data types (like Django ORM querysets) to and from native Python datatypes that can be easily rendered into JSON for the REST API. Also handles incoming data validation.
- **`views.py`**: Contains the core business logic (often using DRF ViewSets or APIViews). Handles incoming HTTP requests, checks permissions, executes business logic, and returns appropriate API responses.
- **`urls.py`**: Defines the local URL routing for the specific app, mapping URL endpoints to the logic in `views.py`.
- **`admin.py`**: Registers models with the built-in Django admin interface for rapid internal data management and debugging.
- **`apps.py`**: Configuration for the app itself (e.g., defining the app's verbose name and signals).

This architecture strictly ensures that different business domains (accounts, jobs, applications) remain decoupled. For example, `jobs` logic should not directly mutate `accounts` logic without proper structural separation.
