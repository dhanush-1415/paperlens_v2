import { expect, test } from '@playwright/test';

import { resolvedTheme } from './helpers';

/**
 * Theme persistence, and the flash it exists to prevent.
 *
 * This is the one behaviour in the system that cannot be tested anywhere else. The unit suite
 * (`shared/ui/theme/script.test.ts`) proves the bootstrap script agrees with the storage
 * envelope; only a real browser can prove the script runs *before the first paint*, because
 * that is a property of where the `<script>` sits in the document rather than of what it does.
 */

const TOGGLE = /^Theme:/;

/**
 * The control cycles the *preference*; `data-theme` reflects the *resolved* theme. They are not
 * the same thing, and the difference is the reason this test asserts on the accessible name.
 *
 * A browser reporting `prefers-color-scheme: light` starts at preference `system` resolving to
 * `light`. One click moves the preference to `light` — a real change, and `data-theme` does not
 * move at all. Asserting "the attribute changed on click" would fail here against correct code.
 */
test('every click advances the preference, and the cycle returns to where it started', async ({
  page,
}) => {
  await page.goto('/');

  const toggle = page.getByRole('button', { name: TOGGLE });
  // Disabled until hydration — the control cannot honestly report a preference it has not read
  // yet, and a toggle that silently does nothing is worse than one that is visibly not ready.
  await expect(toggle).toBeEnabled();

  const nameOf = () => toggle.getAttribute('aria-label');
  const start = await nameOf();
  const seen = [start];

  for (let click = 0; click < 3; click += 1) {
    await toggle.click();
    await expect
      .poll(nameOf, { message: 'the preference did not advance on click' })
      .not.toBe(seen.at(-1));
    seen.push(await nameOf());
  }

  // light → dark → system → light: three distinct states, and the fourth is the first again.
  expect(new Set(seen.slice(0, 3)).size).toBe(3);
  expect(seen[3]).toBe(start);
});

test('the resolved theme follows the preference to the DOM', async ({ page }) => {
  await page.goto('/');

  const toggle = page.getByRole('button', { name: TOGGLE });
  await expect(toggle).toBeEnabled();

  const before = await resolvedTheme(page);

  // At most three clicks reaches every state in the cycle, so one of them must resolve to the
  // other theme regardless of what the OS preference is in this browser.
  for (let click = 0; click < 3; click += 1) {
    await toggle.click();
    if ((await resolvedTheme(page)) !== before) return;
  }

  throw new Error(`data-theme stayed "${before}" through a full cycle`);
});

test('survives a hard reload with no flash of the wrong theme', async ({ page }) => {
  await page.goto('/');

  const toggle = page.getByRole('button', { name: TOGGLE });
  await expect(toggle).toBeEnabled();

  // Cycle until the applied theme is light, whatever the starting preference was. The cycle is
  // light → dark → system, so three clicks is always enough.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if ((await resolvedTheme(page)) === 'light') break;
    await toggle.click();
  }
  expect(await resolvedTheme(page)).toBe('light');

  await page.reload();

  /**
   * The assertion that matters: `data-theme` is `light` in the HTML *as delivered*, before any
   * bundle has run. If the preference were applied by an effect instead, this attribute would
   * be absent here and the user would watch the page turn from dark to light after paint.
   */
  const html = await page.content();
  expect(html).toMatch(/<html[^>]*\sdata-theme="light"/);
  expect(await resolvedTheme(page)).toBe('light');
});

test('a corrupt stored preference degrades to a complete theme rather than none', async ({
  page,
}) => {
  // Half-written by a killed tab, or written by an older version of the app. Either way the
  // page must still render *a* theme — an unset `data-theme` matches no rule in the stylesheet.
  await page.goto('/');
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.includes('theme')) localStorage.setItem(key, '{not json');
    }
  });

  await page.reload();

  expect(['light', 'dark']).toContain(await resolvedTheme(page));
});
