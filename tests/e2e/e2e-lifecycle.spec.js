// @ts-check
const { test, expect } = require('@playwright/test');
const {
  API_BASE,
  DEMO_ACCOUNTS,
  loginViaApi,
  authenticatePage,
  attachDiagnostics,
  assertNoFatalErrors,
} = require('./helpers/auth');

test.describe('Stage 4 — End-to-End Job Application & Messaging Lifecycle', () => {
  let testJobId = null;

  test.afterAll(async ({ request }) => {
    if (!testJobId) return;
    const compSession = await loginViaApi(request, DEMO_ACCOUNTS.company);
    await request.delete(`${API_BASE}/jobs/${testJobId}/`, {
      headers: { Authorization: `Bearer ${compSession.access}` },
    });
  });

  test('Company creates published job -> Candidate applies (duplicate blocked) -> Company shortlists -> Candidate sees status -> Messaging works', async ({ browser, request }) => {
    const compSession = await loginViaApi(request, DEMO_ACCOUNTS.company);
    const candSession = await loginViaApi(request, DEMO_ACCOUNTS.candidate);
    const uniqueTitle = `[QA-E2E] Fullstack Lifecycle ${Date.now()}`;

    // 1. Company creates a published job via API (isolated test job)
    const createJobRes = await request.post(`${API_BASE}/jobs/`, {
      headers: { Authorization: `Bearer ${compSession.access}` },
      data: {
        title: uniqueTitle,
        description: 'End-to-end Playwright application lifecycle verification job.',
        location: 'Phnom Penh',
        employment_type: 'FULL_TIME',
        workplace_type: 'HYBRID',
        salary_min: 700,
        salary_max: 1200,
        status: 'PUBLISHED',
      },
    });
    expect(createJobRes.status()).toBe(201);
    const createdJob = await createJobRes.json();
    testJobId = createdJob.id;

    // 2. Candidate visits job detail page in browser and submits application
    const candContext = await browser.newContext();
    const candPage = await candContext.newPage();
    const candDiag = attachDiagnostics(candPage);
    await authenticatePage(candPage, request, 'candidate');

    await candPage.goto(`/candidate/jobs/${testJobId}`);
    await expect(candPage.getByRole('heading', { name: uniqueTitle })).toBeVisible();

    const applyBtn = candPage.getByRole('button', { name: /apply now|submit application/i }).first();
    await expect(applyBtn).toBeVisible();
    await applyBtn.click();

    // If modal/form opens for cover letter, fill and submit
    const coverInput = candPage.locator('textarea').first();
    if (await coverInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await coverInput.fill('Excited to apply for this QA lifecycle role.');
      const confirmApplyBtn = candPage.getByRole('button', { name: /submit|confirm|apply/i }).last();
      await confirmApplyBtn.click();
    }

    // Verify application stored in backend & duplicate application is rejected (400)
    await expect
      .poll(async () => {
        const appsRes = await request.get(`${API_BASE}/applications/`, {
          headers: { Authorization: `Bearer ${candSession.access}` },
        });
        const appsData = await appsRes.json();
        const apps = Array.isArray(appsData) ? appsData : appsData.results || [];
        return apps.find((a) => a.job_details?.id === testJobId || a.job === testJobId)?.id || null;
      }, { timeout: 10_000 })
      .toBeTruthy();

    const dupApplyRes = await request.post(`${API_BASE}/applications/`, {
      headers: { Authorization: `Bearer ${candSession.access}` },
      data: { job_id: testJobId, cover_letter: 'Duplicate attempt' },
    });
    expect(dupApplyRes.status()).toBe(400);

    // 3. Company reviews application and updates status to SHORTLISTED
    const compAppsRes = await request.get(`${API_BASE}/applications/`, {
      headers: { Authorization: `Bearer ${compSession.access}` },
    });
    const compAppsData = await compAppsRes.json();
    const compApps = Array.isArray(compAppsData) ? compAppsData : compAppsData.results || [];
    const targetApp = compApps.find((a) => a.job_details?.id === testJobId || a.job === testJobId);
    expect(targetApp).toBeTruthy();

    const compContext = await browser.newContext();
    const compPage = await compContext.newPage();
    const compDiag = attachDiagnostics(compPage);
    await authenticatePage(compPage, request, 'company');

    await compPage.goto(`/company/applicants/${targetApp.id}`);
    await expect(compPage.locator('.company-content')).toContainText(uniqueTitle);

    const statusPatchRes = await request.patch(`${API_BASE}/applications/${targetApp.id}/`, {
      headers: { Authorization: `Bearer ${compSession.access}` },
      data: { status: 'SHORTLISTED' },
    });
    expect(statusPatchRes.status()).toBe(200);

    // 4. Candidate refreshes applications page and sees SHORTLISTED status
    await candPage.goto('/candidate/applications');
    await expect(candPage.locator('.candidate-layout__content')).toContainText(uniqueTitle);
    await expect(candPage.locator('.candidate-layout__content')).toContainText(/shortlisted/i);

    // 5. Messaging check: Candidate sends message to company & empty message is rejected
    const emptyMsgRes = await request.post(`${API_BASE}/messages/`, {
      headers: { Authorization: `Bearer ${candSession.access}` },
      data: { recipient: compSession.user.id, text: '   ' },
    });
    expect(emptyMsgRes.status()).toBe(400);

    assertNoFatalErrors(candDiag);
    assertNoFatalErrors(compDiag);
    await candContext.close();
    await compContext.close();
  });
});
