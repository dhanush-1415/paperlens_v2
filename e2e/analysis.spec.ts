import { expect, test } from '@playwright/test';

import { DEMO, RISKY_DOCUMENT, signIn, signOut } from './helpers';

/**
 * The vertical slice, end to end, through the production build.
 *
 * Every layer the architecture defines is exercised by this one flow: proxy → page → DAL →
 * use case → repository port → data source → DTO → Server Component. Nothing is mocked. If any
 * seam between them is wired wrongly, this fails — which is the only reason to run a browser
 * at all, given everything below it already has unit coverage.
 */

test.describe('authentication', () => {
  test('an unauthenticated visitor to a protected route is sent to sign in', async ({ page }) => {
    await page.goto('/scan');

    // The proxy does this optimistically, on the presence of a cookie. It is a redirect for
    // humans, not an authorization check — see the next test for the check that is.
    await expect(page).toHaveURL(/\/login\?/);
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('the redirect carries the original destination and returns the user to it', async ({
    page,
  }) => {
    await page.goto('/scan');
    expect(page.url()).toContain('redirectTo');

    await page.getByLabel('Email').fill(DEMO.email);
    await page.getByLabel('Password').fill(DEMO.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/scan$/);
  });

  test('a wrong password fails without revealing whether the account exists', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('nobody@paperlens.test');
    await page.getByLabel('Password').fill('wrong-password-entirely');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // One message for the form as a whole, never pinned to the password field — pinning it
    // would confirm the email was right, which is an account-enumeration oracle.
    await expect(page.getByText('Could not sign you in')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('signing out clears the session, and the protected route bounces again', async ({
    page,
  }) => {
    await signIn(page);

    await signOut(page);
    await page.goto('/scan');

    await expect(page).toHaveURL(/\/login\?/);
  });
});

test.describe('document analysis', () => {
  test('analyses a pasted contract and reports its risks worst-first', async ({ page }) => {
    await signIn(page);

    await page.getByLabel('Your document').fill(RISKY_DOCUMENT);
    await page.getByLabel('Document type').selectOption('rental_agreement');
    await page.getByRole('button', { name: 'Analyse document' }).click();

    // The action redirects to the report, so the URL is the first proof the whole chain ran.
    await expect(page).toHaveURL(/\/document\/[^/]+$/);

    await expect(page.getByRole('heading', { name: 'What we found' })).toBeVisible();

    // Findings the heuristic analyzer is guaranteed to produce from this text. Asserting on the
    // rendered wording rather than a count keeps the test honest about what the user sees.
    await expect(page.getByText('Renews automatically')).toBeVisible();
    await expect(page.getByText('You give up the right to sue')).toBeVisible();

    // The safety score, which is the number the entire product is judged on.
    await expect(page.getByText('Safety score')).toBeVisible();
  });

  test('rejects a document too short to be a document, without leaving the page', async ({
    page,
  }) => {
    await signIn(page);

    await page.getByLabel('Your document').fill('too short');
    await page.getByRole('button', { name: 'Analyse document' }).click();

    /**
     * Validated on the server and returned as a field error against the input it belongs to —
     * the client never gets to decide what counts as valid.
     *
     * Scoped to the form. Next injects its own `role="alert"` route announcer into every page
     * for screen readers, so a bare `getByRole('alert')` is ambiguous on any route in the app.
     *
     * The assertion is on the English sentence, with the bound filled in. That is three
     * separate things at once: the schema's key reached the boundary, the translator resolved
     * it, and the `min` travelled with it — the whole reason a message ref is a string and not
     * a bare key. A raw `validation.document.tooShort` on screen fails this.
     */
    const field = page.getByRole('textbox', { name: 'Your document' });
    await expect(field).toHaveAttribute('aria-invalid', 'true');

    const fieldError = page.locator('form').getByRole('alert');
    await expect(fieldError).toHaveText(/Paste at least \d+ characters/);

    await expect(page).toHaveURL(/\/scan$/);
  });

  /**
   * The ownership check, and the one place PPR changes what a test can assert.
   *
   * The report sits inside a `<Suspense>` boundary, so the shell — and its `200` — is on the
   * wire before the read has even started. `notFound()` from inside a streamed boundary cannot
   * retroactively change a status line that has already been sent; it swaps in the not-found UI
   * mid-stream. That is a property of streaming, not a hole in the check.
   *
   * So the assertion is on what the second user actually receives, and it is stronger than a
   * status code would be: the same not-found page a nonexistent id produces, byte-for-byte in
   * the parts that matter, and none of the first user's document. Identical responses are
   * precisely what stops the URL becoming an oracle for which documents exist.
   */
  test('another user’s document is indistinguishable from one that never existed', async ({
    page,
    browser,
  }) => {
    await signIn(page);
    await page.getByLabel('Your document').fill(RISKY_DOCUMENT);
    await page.getByRole('button', { name: 'Analyse document' }).click();
    await expect(page).toHaveURL(/\/document\/[^/]+$/);

    const url = page.url();
    await expect(page.getByRole('heading', { name: 'What we found' })).toBeVisible();

    /**
     * A second browser context, not a sign-out and back in on the same one.
     *
     * "Another user" means another browser: its own cookie jar, its own router cache, its own
     * bfcache. Reusing one page would leave this asserting against a client-side cache as much
     * as against the server's answer, which is the opposite of what the test is for.
     */
    const otherContext = await browser.newContext();
    const otherUser = await otherContext.newPage();

    try {
      await signIn(otherUser, 'pro@paperlens.test');
      await otherUser.goto(url);

      // Typographic apostrophe — the page sets `&rsquo;`, so a straight `'` never matches.
      const notFoundHeading = otherUser.getByRole('heading', {
        name: 'We couldn’t find that page',
      });
      await expect(notFoundHeading).toBeVisible();

      // No trace of the owner's document: not the findings, not the score, not the source text.
      await expect(otherUser.getByRole('heading', { name: 'What we found' })).toHaveCount(0);
      await expect(otherUser.getByText('KINGSWAY')).toHaveCount(0);

      // And a fabricated id renders the same thing — no 403, no "you do not have access",
      // nothing that separates "exists but is not yours" from "does not exist".
      await otherUser.goto('/document/does-not-exist-at-all');
      await expect(notFoundHeading).toBeVisible();
    } finally {
      await otherContext.close();
    }
  });
});

test.describe('the proxy is not the authorization check', () => {
  test('a forged session cookie passes the proxy and fails at the page', async ({ page }) => {
    /**
     * `proxy.ts` only asks whether a cookie is *present*. This test gives it one, so the
     * optimistic redirect does not fire and the request reaches the route — where
     * `requireSession()` validates the session for real and renders `unauthorized.tsx`.
     *
     * That is the whole argument for why authorization lives in the DAL: the proxy cannot
     * distinguish a real session from four bytes of garbage, and a Server Action is POST-
     * reachable without ever passing through a page. If this test ever went green by
     * *redirecting* instead, the proxy would have become load-bearing for security.
     */
    await page
      .context()
      .addCookies([
        { name: 'pl_session', value: 'not-a-real-session', url: 'http://localhost:3000' },
      ]);

    await page.goto('/scan');

    await expect(page).toHaveURL(/\/scan$/);
    await expect(page.getByText('Please sign in to continue')).toBeVisible();
  });
});
