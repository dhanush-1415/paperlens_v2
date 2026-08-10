import { expect, test } from '@playwright/test';

/**
 * The load-bearing smoke test: does the production build actually serve a page.
 *
 * Everything in this repository is verified by types, lint rules and unit tests except the one
 * thing that matters most — that `next build && next start` produces something a browser can
 * render. A build that succeeds and then throws on first paint (a bad `use cache` boundary, a
 * server-only import pulled into a client bundle, a missing Suspense wrapper) passes every
 * other gate in the project.
 */

test('the landing page renders its hero without a client-side error', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(consoleErrors, `uncaught errors: ${consoleErrors.join(' | ')}`).toEqual([]);
});

/**
 * The theme is decided in the browser, so `data-theme` cannot be in the bytes the server sent —
 * the preference lives in `localStorage` and `'system'` resolves against an OS setting the
 * server has never seen. What the server *can* guarantee, and what prevents the flash, is that
 * a synchronous inline script runs before the first paint.
 *
 * So this asserts the three properties that actually make that true, on the raw response:
 * the script is inline (no network round trip), it is not deferred or async (it blocks), and it
 * sits before `<body>` (it runs before there is anything to paint). Then it checks the outcome.
 */
test('the landing page decides its theme in a blocking script, before the first paint', async ({
  page,
}) => {
  const response = await page.goto('/');
  const html = await response!.text();

  const head = html.slice(0, html.indexOf('<body'));
  const bootstrap = head.match(/<script[^>]*>[^<]*dataset\.theme[^<]*<\/script>/);

  expect(bootstrap, 'no inline theme bootstrap script found before <body>').not.toBeNull();
  expect(bootstrap![0]).not.toMatch(/\ssrc=/);
  expect(bootstrap![0]).not.toMatch(/\s(defer|async)[\s=>]/);

  // And it did its job: a concrete theme is on <html> by the time the page is usable.
  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.theme))
    .toMatch(/^(light|dark)$/);
});

test('the health endpoint answers without a session', async ({ request }) => {
  // A liveness probe that requires auth is a liveness probe that reports the wrong thing when
  // the auth provider is what went down.
  const response = await request.get('/api/health');

  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ status: 'ok' });
});

test('an unknown route renders the not-found page rather than an error', async ({ page }) => {
  const response = await page.goto('/definitely-not-a-route');

  expect(response?.status()).toBe(404);
  // The 404 offers a way out rather than a dead end — a 404 with no navigation is how a
  // broken link becomes a lost session. Matched by role, and with a typographic apostrophe,
  // because the page sets one: asserting on a straight `'` fails on correct copy.
  await expect(page.getByRole('heading', { name: 'We couldn’t find that page' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Analyze a document' }).first()).toBeVisible();
});
