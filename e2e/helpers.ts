import { expect, type Page } from '@playwright/test';

/**
 * Shared vocabulary for the smoke suite.
 *
 * Deliberately thin. An e2e helper layer that grows page objects and abstractions ends up
 * asserting against itself, and the first time it hides a change in the real markup the suite
 * goes green on a broken product. These are the two flows every spec needs and nothing else.
 */

/**
 * The credentials printed on the login page in development.
 *
 * They come from `InMemoryAuthProvider`, which is the only auth adapter this build ships. When
 * a real provider is registered in `server/bootstrap.ts`, this constant is the one thing in
 * the suite that has to change — which is the point of the port.
 */
export const DEMO = {
  email: 'demo@paperlens.test',
  password: 'demo-password-1234',
} as const;

/** A contract that trips several of the analyzer's rules, so a report is guaranteed to have content. */
export const RISKY_DOCUMENT = [
  'TENANCY AGREEMENT — FLAT 3, KINGSWAY',
  '',
  '1. Term. This agreement will automatically renew for successive twelve month periods unless',
  'either party gives ninety days written notice.',
  '',
  '2. Disputes. The tenant agrees to binding arbitration and waives any right to a jury trial.',
  '',
  '3. Changes. The landlord reserves the right to modify these terms without prior notice to you.',
  '',
  '4. Termination. An early termination fee equal to three months rent is payable on exit, and the',
  'tenant shall forfeit the deposit.',
  '',
  '5. Liability. In no event shall the landlord be liable for any indirect or consequential loss.',
  '',
  '6. Costs. The tenant shall indemnify and hold harmless the landlord against all claims.',
].join('\n');

export async function signIn(page: Page, email: string = DEMO.email) {
  await page.goto('/login');

  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByLabel('Password').fill(DEMO.password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // The action redirects on success. Waiting for the URL rather than for a spinner to vanish
  // means the assertion is about the outcome, not about a transient piece of UI.
  await expect(page).toHaveURL(/\/scan$/);
}

/**
 * Clicking the button is not signing out — the Server Action still has to run, clear the cookie
 * and redirect. Without waiting for that landing, the next `goto` races the in-flight POST and
 * the test observes a session that is halfway gone.
 *
 * The URL alone is not the landing. A Server Action redirect updates history first and streams
 * the new tree afterwards, so a `goto` issued on the URL change alone commits a new document
 * while the previous navigation's RSC payload is still arriving — which lands the old tree on
 * top of the new one. Waiting for the destination's own content is what makes the sign-out
 * actually finished.
 */
export async function signOut(page: Page) {
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/localhost:\d+\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

/** The theme actually applied to the document, as opposed to the stored preference. */
export function resolvedTheme(page: Page) {
  return page.evaluate(() => document.documentElement.dataset.theme ?? null);
}
