# CareerLens — Theme & Multilingual Architecture (Light/Dark Mode & EN/KH)

## Overview

CareerLens incorporates a centralized, accessible, persistent **Theme (Light/Dark Mode)** and **Multilingual (English/Khmer)** system across all three user roles:
- **Admin**
- **Candidate**
- **Company**

---

## 1. Typography & Mandatory Khmer Font: Kantumruy Pro

As specified in the project requirements, **Kantumruy Pro** is the primary font for all Khmer-language (`km`) content across the entire platform.

### Font Setup
- **Google Fonts link** configured in [index.html](file:///d:/AU-CLASS/Year%20III/Careerlens_Project/careerlens/frontend/index.html) and [global.css](file:///d:/AU-CLASS/Year%20III/Careerlens_Project/careerlens/frontend/src/styles/global.css) with weights 400, 500, 600, and 700.
- Fallback CSS variables configured in [root.css](file:///d:/AU-CLASS/Year%20III/Careerlens_Project/careerlens/frontend/src/styles/root.css):
  ```css
  :root {
    --font-family-en: "Inter", "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
    --font-family-kh: "Kantumruy Pro", system-ui, sans-serif;
    --font-primary: var(--font-family-en);
    --font-body: var(--font-family-en);
    --font-khmer: var(--font-family-kh);
  }

  html[lang="km"],
  :root:lang(km),
  [lang="km"] {
    --font-primary: var(--font-family-kh);
    --font-body: var(--font-family-kh);
  }

  html[lang="km"] body,
  [lang="km"] body {
    font-family: var(--font-family-kh);
    line-height: 1.6;
  }

  html[lang="km"] button,
  html[lang="km"] input,
  html[lang="km"] select,
  html[lang="km"] textarea,
  html[lang="km"] optgroup {
    font-family: var(--font-family-kh);
  }
  ```

---

## 2. Global Light & Dark Mode

### Mechanism
- Managed by [`ThemeProvider`](file:///d:/AU-CLASS/Year%20III/Careerlens_Project/careerlens/frontend/src/context/ThemeContext.jsx).
- Sets `data-theme="light"` or `data-theme="dark"` attribute on `<html>`.
- Persisted to `localStorage` under `'theme'`.
- Restored immediately on page load to prevent theme flashing.

### Design Tokens
Colors are dynamically controlled through CSS custom properties in [root.css](file:///d:/AU-CLASS/Year%20III/Careerlens_Project/careerlens/frontend/src/styles/root.css):
- `--color-primary`: `#638ECB` (CareerLens blue) in light mode, `#3b82f6` in dark mode.
- `--color-surface`: `#ffffff` in light mode, `#1e293b` in dark mode.
- `--color-background` / `--color-bg-primary`: `#f8fafc` in light mode, `#0f172a` in dark mode.
- `--color-text-primary`: `#0f172a` in light mode, `#f8fafc` in dark mode.
- `--color-border`: `#e2e8f0` in light mode, `#334155` in dark mode.
- `--color-sidebar-bg`: `#1b2b44` in light mode, `#0f172a` in dark mode.

---

## 3. English & Khmer Multilingual System

### Mechanism
- Co-powered by **`i18next` + `react-i18next`** and the centralized [`LanguageProvider`](file:///d:/AU-CLASS/Year%20III/Careerlens_Project/careerlens/frontend/src/context/LanguageContext.jsx).
- Automatically updates `document.documentElement.lang` to `en` or `km`.
- Persisted in `localStorage` under `'cl_language'` (and `'language'`).
- Translates immediately across all routes without requiring a full page reload.

### Organized Translation Resources
Domain-specific translation JSON files located in `src/locales/`:
```text
src/locales/
├── en/
│   ├── common.json
│   ├── auth.json
│   ├── admin.json
│   ├── candidate.json
│   ├── company.json
│   └── validation.json
└── km/
    ├── common.json
    ├── auth.json
    ├── admin.json
    ├── candidate.json
    ├── company.json
    └── validation.json
```
Bundled and flattened via [en.js](file:///d:/AU-CLASS/Year%20III/Careerlens_Project/careerlens/frontend/src/locales/en.js) and [km.js](file:///d:/AU-CLASS/Year%20III/Careerlens_Project/careerlens/frontend/src/locales/km.js) for flexible dot-notation resolution (`t("nav.dashboard")`, `t("admin.title")`, `t("common.save")`).

---

## 4. Shared Toggle Component: ThemeLanguageToggle

A universal toggle component [`ThemeLanguageToggle`](file:///d:/AU-CLASS/Year%20III/Careerlens_Project/careerlens/frontend/src/components/common/ThemeLanguageToggle.jsx) has been created and integrated into top headers:
1. **Candidate Header** ([CandidateHeader.jsx](file:///d:/AU-CLASS/Year%20III/Careerlens_Project/careerlens/frontend/src/components/candidate/CandidateHeader.jsx))
2. **Company Header** ([CompanyHeader.jsx](file:///d:/AU-CLASS/Year%20III/Careerlens_Project/careerlens/frontend/src/components/company/CompanyHeader.jsx))
3. **Admin Header** ([AdminLayout.jsx](file:///d:/AU-CLASS/Year%20III/Careerlens_Project/careerlens/frontend/src/layouts/AdminLayout/AdminLayout.jsx))
4. **Authentication Pages** ([AuthLayout.jsx](file:///d:/AU-CLASS/Year%20III/Careerlens_Project/careerlens/frontend/src/components/auth/AuthLayout.jsx))
5. **Landing / Home Page** ([Home.jsx](file:///d:/AU-CLASS/Year%20III/Careerlens_Project/careerlens/frontend/src/pages/landing/Home/Home.jsx))
