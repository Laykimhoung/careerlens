// @ts-check
const { test, expect } = require('@playwright/test');
const {
  DEMO_ACCOUNTS,
  DEMO_PASSWORD,
  loginViaUi,
  attachDiagnostics,
  assertNoFatalErrors,
} = require('../helpers/auth');

test.describe('Stage 2 — Authentication, Session Persistence & Storage Quota', () => {
  test('Login with invalid credentials displays error message and keeps user on /login', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Enter email or username').fill('nonexistent_user_qa');
    await page.getByPlaceholder('Enter your password').fill('WrongPassword123!');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.tether-error')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('Login form prevents empty submission via required inputs', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.getByPlaceholder('Enter email or username');
    const pwInput = page.getByPlaceholder('Enter your password');
    await expect(emailInput).toHaveAttribute('required', '');
    await expect(pwInput).toHaveAttribute('required', '');

    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('Candidate login, session persistence on refresh, compact localStorage user, and logout', async ({ page }) => {
    const diag = attachDiagnostics(page);
    await loginViaUi(page, DEMO_ACCOUNTS.candidate, DEMO_PASSWORD);

    await expect(page).toHaveURL(/\/candidate$/);
    await expect(page.locator('.candidate-layout')).toBeVisible();

    // Verify localStorage "user" is compact and contains no image/nested bloat
    const storageCheck = await page.evaluate(() => {
      const raw = localStorage.getItem('user');
      const parsed = raw ? JSON.parse(raw) : null;
      return {
        rawLength: raw ? raw.length : 0,
        hasAccess: Boolean(localStorage.getItem('access_token')),
        hasRefresh: Boolean(localStorage.getItem('refresh_token')),
        parsed,
      };
    });

    expect(storageCheck.hasAccess).toBeTruthy();
    expect(storageCheck.hasRefresh).toBeTruthy();
    expect(storageCheck.rawLength).toBeGreaterThan(0);
    expect(storageCheck.rawLength).toBeLessThan(600);
    expect(storageCheck.parsed.role).toBe('candidate');
    expect('avatar' in storageCheck.parsed).toBeFalsy();
    expect('jobs' in storageCheck.parsed).toBeFalsy();

    // Refresh page and confirm session persists
    await page.reload();
    await expect(page).toHaveURL(/\/candidate$/);
    await expect(page.locator('.candidate-layout')).toBeVisible();

    // Logout via header user menu
    await page.locator('.header-user-pill').click();
    await page.getByRole('menu').getByRole('button', { name: /log ?out/i }).click();
    await expect(page).toHaveURL(/\/$/);

    const afterLogout = await page.evaluate(() => ({
      access: localStorage.getItem('access_token'),
      refresh: localStorage.getItem('refresh_token'),
      user: localStorage.getItem('user'),
    }));
    expect(afterLogout).toEqual({ access: null, refresh: null, user: null });

    assertNoFatalErrors(diag);
  });

  test('Company login via Quick Demo pill redirects to /company and persists on refresh', async ({ page }) => {
    const diag = attachDiagnostics(page);
    await page.goto('/login');

    const companyDemoBtn = page.getByRole('button', { name: /company/i });
    await expect(companyDemoBtn).toBeVisible();
    await companyDemoBtn.click();

    // Quick Demo fills credentials; submit the form
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/company$/);
    await expect(page.locator('.company-shell')).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/\/company$/);
    assertNoFatalErrors(diag);
  });

  test('Admin login redirects to /admin and persists on refresh', async ({ page }) => {
    const diag = attachDiagnostics(page);
    await loginViaUi(page, DEMO_ACCOUNTS.admin, DEMO_PASSWORD);

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.locator('.admin-layout')).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/\/admin$/);
    assertNoFatalErrors(diag);
  });

  test('Silent JWT refresh recovers session when access_token is invalid/expired', async ({ page }) => {
    const diag = attachDiagnostics(page);
    await loginViaUi(page, DEMO_ACCOUNTS.candidate, DEMO_PASSWORD);
    await expect(page).toHaveURL(/\/candidate$/);

    // Corrupt only access_token while keeping valid refresh_token
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'expired.invalid.jwt');
    });

    await page.reload();
    await expect(page).toHaveURL(/\/candidate$/);
    await expect(page.locator('.candidate-layout')).toBeVisible();

    const newAccess = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(newAccess).not.toBe('expired.invalid.jwt');
    expect(newAccess).toBeTruthy();

    // Expected 401 console log from intentional corrupted access_token before silent refresh
    assertNoFatalErrors(diag, { allowConsoleErrors: true });
  });
});
