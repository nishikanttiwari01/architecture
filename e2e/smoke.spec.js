// E2E smoke suite — exercises the workflows the browser self-test cannot:
// real navigation, global search, persistence across reload, and a full mock interview.
// @ts-check
const { test, expect } = require('@playwright/test');

const ROUTES = [
  '/dashboard', '/paths', '/courses', '/progress',
  '/track/banking', '/track/kafka', '/track/java',
  '/patterns', '/pattern/outbox',
  '/case-studies', '/case-study/cs11',
  '/labs', '/lab/lab27',
  '/review-sim', '/review-sim/rv1',
  '/interview', '/mock', '/sysdesign',
  '/toolkit', '/adr', '/bvb', '/qaw', '/calculators',
  '/datastore', '/kafka-designer', '/diagram-challenge',
  '/templates', '/template/adr',
  '/glossary', '/flashcards', '/references',
  '/bookmarks', '/notes', '/settings',
  '/assessments', '/mistakes', '/communication',
  '/lesson/f1', '/lesson/b5'
];

test('browser self-test page passes all checks', async ({ page }) => {
  await page.goto('/test.html');
  await expect(page.locator('.score-banner')).toBeVisible();
  const failures = await page.locator('td.fail').count();
  expect(failures, 'self-test rows marked FAIL').toBe(0);
});

test('every major route renders (no "Page not found", no console errors)', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/index.html');
  for (const route of ROUTES) {
    await page.goto('/index.html#' + route);
    await page.waitForTimeout(100);
    const h1 = await page.locator('#main h1').first().textContent();
    expect(h1, route).not.toContain('Page not found');
    expect(h1, route).not.toContain('Something went wrong');
  }
  expect(errors, 'console page errors during navigation').toEqual([]);
});

test('global search navigates to results (query-string route)', async ({ page }) => {
  await page.goto('/index.html#/dashboard');
  await page.fill('#global-search', 'idempotency');
  await page.press('#global-search', 'Enter');
  await expect(page).toHaveURL(/#\/search\?q=idempotency/);
  await expect(page.locator('.sr-item').first()).toBeVisible();
  // Clicking a result navigates somewhere real
  await page.locator('.sr-item a').first().click();
  const h1 = await page.locator('#main h1').first().textContent();
  expect(h1).not.toContain('Page not found');
});

test('theme choice persists across reload', async ({ page }) => {
  await page.goto('/index.html#/settings');
  const before = await page.getAttribute('html', 'data-theme');
  await page.click('#theme-toggle');
  const after = await page.getAttribute('html', 'data-theme');
  expect(after).not.toBe(before);
  await page.reload();
  expect(await page.getAttribute('html', 'data-theme')).toBe(after);
});

test('complete mock interview: answers survive to feedback and to history', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('/index.html#/mock/run/general-1');
  await page.click('#mi-start');

  const marker = 'IDEMPOTENCY-MARKER-E2E outbox reconciliation timeout';
  await page.fill('#mi-a', marker);

  // Walk through every question; keep the marker answer on question 1 only.
  while (true) {
    const next = page.locator('#mi-next');
    if ((await next.count()) === 0) break;
    const label = await next.textContent();
    await next.click();
    if (label && label.includes('Finish')) break;
    await page.waitForTimeout(50);
  }

  // Feedback shows coverage framing (not a readiness verdict) and the typed answer.
  await expect(page.locator('.score-banner')).toContainText('Key-point coverage');
  await page.locator('details.quiz-q summary').first().click();
  await expect(page.locator('#main')).toContainText('IDEMPOTENCY-MARKER-E2E');

  // The attempt is persisted and reviewable from Progress.
  await page.goto('/index.html#/progress');
  await expect(page.locator('#main')).toContainText('Review →');
  await page.locator('a:has-text("Review →")').first().click();
  await expect(page.locator('.score-banner')).toContainText('Key-point coverage');
  await page.locator('details.quiz-q summary').first().click();
  await expect(page.locator('#main')).toContainText('IDEMPOTENCY-MARKER-E2E');
});

test('quiz answers hidden before submission, explained after', async ({ page }) => {
  await page.goto('/index.html#/lesson/f1');
  // No explanations visible pre-submission
  expect(await page.locator('.quiz-explain').count()).toBe(0);
  // Answer every question (first option) and submit
  const groups = page.locator('.quiz-q');
  const n = await groups.count();
  for (let i = 0; i < n; i++) {
    const input = groups.nth(i).locator('input[type=radio], input[type=checkbox]').first();
    if ((await input.count()) > 0) await input.check();
    const sel = groups.nth(i).locator('select');
    const selCount = await sel.count();
    for (let s = 0; s < selCount; s++) await sel.nth(s).selectOption({ index: 1 });
    const text = groups.nth(i).locator('input[type=text]');
    if ((await text.count()) > 0) await text.fill('answer');
  }
  await page.click('button[type=submit]');
  await expect(page.locator('.score-banner').first()).toBeVisible();
  expect(await page.locator('.quiz-explain').count()).toBeGreaterThan(0);

  // Lesson completion persists across reload
  await page.reload();
  await page.goto('/index.html#/lesson/f1');
  await expect(page.locator('#main')).toContainText('Completed');
});
