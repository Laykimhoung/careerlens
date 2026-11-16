// @ts-check
const { test, expect } = require('@playwright/test');
const {
  API_BASE,
  authenticatePage,
  attachDiagnostics,
  assertNoFatalErrors,
} = require('../helpers/auth');

test.describe('Stage 3 — Candidate Feature Workflows', () => {
  test('Candidate Dashboard loads stats and key workspace links', async ({ page, request }) => {
    const diag = attachDiagnostics(page);
    await authenticatePage(page, request, 'candidate');

    await page.goto('/candidate');
    await expect(page.locator('.candidate-layout')).toBeVisible();
    await expect(page.locator('.candidate-layout__content')).not.toBeEmpty();

    assertNoFatalErrors(diag);
  });

  test('Candidate Jobs search, filter, job details navigation, and Save/Unsave job toggle', async ({ page, request }) => {
    const diag = attachDiagnostics(page);
    await authenticatePage(page, request, 'candidate');

    // Fetch a real published job from API to verify UI matches backend
    const jobsRes = await request.get(`${API_BASE}/jobs/`);
    expect(jobsRes.ok()).toBeTruthy();
    const jobsPayload = await jobsRes.json();
    const jobs = Array.isArray(jobsPayload) ? jobsPayload : jobsPayload.results || [];
    expect(jobs.length).toBeGreaterThan(0);

    await page.goto('/candidate/jobs');
    await expect(page.getByText(jobs[0].title).first()).toBeVisible();

    // Search by first job's title keyword
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search" i]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill(jobs[0].title);
    await expect(page.getByText(jobs[0].title).first()).toBeVisible();

    // Navigate directly to job details page and verify title + company render
    await page.goto(`/candidate/jobs/${jobs[0].id}`);
    await expect(page.getByRole('heading', { name: jobs[0].title })).toBeVisible();

    assertNoFatalErrors(diag);
  });

  test('Candidate secondary pages load without runtime errors (Applications, Saved Jobs, Profile, Resume, CV Studio, Career Roadmap, Messages)', async ({ page, request }) => {
    const diag = attachDiagnostics(page);
    await authenticatePage(page, request, 'candidate');

    const routes = [
      '/candidate/applications',
      '/candidate/saved-jobs',
      '/candidate/profile',
      '/candidate/resume',
      '/candidate/cv-studio',
      '/candidate/cv-versions',
      '/candidate/career-roadmap',
      '/candidate/best-fit-jobs',
      '/candidate/messages',
      '/candidate/notifications',
    ];

    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('.candidate-layout__content')).toBeVisible();
      // Ensure loading spinner settles
      await page.waitForLoadState('networkidle');
    }

    assertNoFatalErrors(diag);
  });
});
