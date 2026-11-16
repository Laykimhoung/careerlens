// @ts-check
const { expect } = require('@playwright/test');

const API_BASE = process.env.E2E_API_URL || 'http://127.0.0.1:8000/api';
const DEMO_PASSWORD = process.env.E2E_DEMO_PASSWORD || 'CareerLens2026!Demo';

const DEMO_ACCOUNTS = {
  candidate: 'demo_cand_sreymom',
  company: 'demo_comp_mekong',
  companyAlt: 'demo_comp_wing',
  admin: 'demo_admin',
};

const _sessionCache = new Map();

/**
 * Authenticates via backend API (caching per username within the worker to respect auth_login 10/min rate limit).
 */
async function loginViaApi(request, username, password = DEMO_PASSWORD) {
  const cacheKey = `${username}:${password}`;
  if (_sessionCache.has(cacheKey)) {
    return _sessionCache.get(cacheKey);
  }
  const loginRes = await request.post(`${API_BASE}/auth/login/`, {
    data: { username, password },
  });
  expect(loginRes.ok(), `API login failed for ${username}: ${loginRes.status()}`).toBeTruthy();
  const tokens = await loginRes.json();

  const meRes = await request.get(`${API_BASE}/auth/me/`, {
    headers: { Authorization: `Bearer ${tokens.access}` },
  });
  expect(meRes.ok(), `GET /auth/me/ failed for ${username}: ${meRes.status()}`).toBeTruthy();
  const user = await meRes.json();

  const session = {
    access: tokens.access,
    refresh: tokens.refresh,
    user,
  };
  _sessionCache.set(cacheKey, session);
  return session;
}

/**
 * Seeds JWT tokens & compact user into browser localStorage before navigation
 * so authenticated role suites start cleanly without repeating UI login steps.
 */
async function authenticatePage(page, request, roleKey) {
  const username = DEMO_ACCOUNTS[roleKey] || roleKey;
  const session = await loginViaApi(request, username);
  const roleLower = String(session.user.role || 'CANDIDATE').toLowerCase();
  const fullName =
    [session.user.first_name, session.user.last_name].filter(Boolean).join(' ') ||
    session.user.username;

  const compactUser = {
    id: session.user.id,
    username: session.user.username,
    email: session.user.email,
    first_name: session.user.first_name || '',
    last_name: session.user.last_name || '',
    full_name: fullName,
    name: fullName,
    role: roleLower,
    rawRole: String(session.user.role || 'CANDIDATE').toUpperCase(),
    is_active: session.user.is_active ?? true,
    date_joined: session.user.date_joined || null,
  };

  await page.addInitScript(
    ({ access, refresh, user }) => {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));
    },
    { access: session.access, refresh: session.refresh, user: compactUser }
  );

  return session;
}

/**
 * Logs in through the real /login UI form.
 */
async function loginViaUi(page, username, password = DEMO_PASSWORD) {
  await page.goto('/login');
  await page.getByPlaceholder('Enter email or username').fill(username);
  await page.getByPlaceholder('Enter your password').fill(password);
  const submitBtn = page.locator('button[type="submit"]');
  await expect(submitBtn).toBeEnabled();
  await submitBtn.click();
}

/**
 * Attaches console, uncaught pageerror, and HTTP >= 500 network diagnostics.
 */
function attachDiagnostics(page) {
  const diag = {
    consoleErrors: [],
    pageErrors: [],
    serverErrors: [],
    failedRequests: [],
  };

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      diag.consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    diag.pageErrors.push(err.message || String(err));
  });

  page.on('response', (res) => {
    if (res.status() >= 500) {
      diag.serverErrors.push(`${res.status()} ${res.url()}`);
    }
  });

  page.on('requestfailed', (req) => {
    const errText = req.failure()?.errorText || '';
    if (!errText.includes('ERR_ABORTED')) {
      diag.failedRequests.push(`${req.method()} ${req.url()} (${errText})`);
    }
  });

  return diag;
}

function assertNoFatalErrors(diag, { allowConsoleErrors = false } = {}) {
  expect(diag.pageErrors, `Uncaught page errors: ${diag.pageErrors.join(' | ')}`).toEqual([]);
  expect(diag.serverErrors, `HTTP 5xx errors: ${diag.serverErrors.join(' | ')}`).toEqual([]);
  if (!allowConsoleErrors) {
    expect(diag.consoleErrors, `Console errors: ${diag.consoleErrors.join(' | ')}`).toEqual([]);
  }
}

module.exports = {
  API_BASE,
  DEMO_PASSWORD,
  DEMO_ACCOUNTS,
  loginViaApi,
  authenticatePage,
  loginViaUi,
  attachDiagnostics,
  assertNoFatalErrors,
};
