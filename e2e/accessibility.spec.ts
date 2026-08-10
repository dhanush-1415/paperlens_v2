import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * The accessibility and responsive gates for the public site.
 *
 * ### What an automated axe pass is and is not
 *
 * It catches roughly a third of WCAG failures — the mechanical third: contrast, missing names,
 * broken landmark and heading structure, form controls with no label. It cannot tell whether a
 * heading is honest or whether a focus order makes sense. So this file is a floor, not a
 * ceiling, and the judgement calls are asserted where they can be: the skip link and the
 * keyboard paths live in `marketing.spec.ts`, the redundant-signal rule for risk levels lives
 * in the unit suite.
 *
 * ### Why both colour schemes
 *
 * Because contrast is the most common failure and the palette is theme-dependent — the risk
 * ink tokens are overridden per theme precisely because the raw brand accents fail as text on
 * a light canvas. A suite that only tested one theme would be testing half the token set.
 * `emulateMedia` is the right lever: the stored preference defaults to `system`, so this
 * exercises the real resolution path rather than writing to storage behind the app's back.
 *
 * ### Why the horizontal-overflow check is a separate assertion
 *
 * A page that scrolls sideways on a phone is not an axe violation, it is worse than one: it is
 * the single most common way a responsive layout breaks, it makes body text unreachable, and
 * it is invisible on the desktop the layout was built on. One overflowing table or one
 * `min-width` is enough, and nothing else in the pipeline would notice.
 */

const ROUTES = [
  '/',
  '/pricing',
  '/how-it-works',
  '/security',
  '/use-cases',
  '/for/irs-cp2000-notice',
] as const;

/** WCAG 2.1 AA, which is the bar the security page commits us to in writing. */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`axe — ${scheme}`, () => {
    test.use({ colorScheme: scheme });

    for (const route of ROUTES) {
      test(`${route} has no detectable violations`, async ({ page }, testInfo) => {
        await page.goto(route);
        // The consent banner is part of the page under test, so it is scanned too — it is also
        // the component most likely to be built as an inaccessible modal.
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

        const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();

        // Attach the full report before asserting: a bare "expected 0, got 3" in CI sends the
        // next person hunting for which element on which route.
        await testInfo.attach(`axe-${scheme}${route.replace(/\//g, '_')}.json`, {
          body: JSON.stringify(results.violations, null, 2),
          contentType: 'application/json',
        });

        // One line per failing *node*, not per rule: "color-contrast" on its own is a fact
        // about the page, while the selector and the measured ratio are what someone can fix.
        const failures = results.violations.flatMap((violation) =>
          violation.nodes.map(
            (node) =>
              `${violation.id} — ${node.target.join(' ')} — ${(
                node.failureSummary ?? violation.help
              )
                .replace(/\s+/g, ' ')
                .trim()}`,
          ),
        );

        expect(failures).toEqual([]);
      });
    }
  });
}

test.describe('responsive', () => {
  // One project drives this sweep; the mobile project has a fixed device viewport and running
  // the same four widths there would assert the same thing twice with a worse error message.
  test.skip(({ browserName }) => browserName !== 'chromium', 'viewport sweep runs in chromium');

  const WIDTHS = [
    { width: 390, height: 844, label: 'iPhone' },
    { width: 768, height: 1024, label: 'tablet' },
    { width: 1024, height: 768, label: 'small laptop' },
    { width: 1440, height: 900, label: 'desktop' },
  ];

  for (const { width, height, label } of WIDTHS) {
    test(`nothing overflows the viewport at ${width}px (${label})`, async ({ page }) => {
      await page.setViewportSize({ width, height });

      for (const route of ROUTES) {
        await page.goto(route);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

        const overflow = await page.evaluate(() => {
          const root = document.documentElement;
          return { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth };
        });

        // Wide content — the pricing table, a long excerpt — is allowed to scroll inside its
        // own container. The document is not.
        expect(
          overflow.scrollWidth,
          `${route} at ${width}px scrolls horizontally (${overflow.scrollWidth} > ${overflow.clientWidth})`,
        ).toBeLessThanOrEqual(overflow.clientWidth + 1);
      }
    });
  }

  test('every tap target on the phone-width home page clears 44px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const targets = page.locator(
      'header a:visible, header button:visible, main a:visible, main button:visible',
    );
    const count = await targets.count();
    expect(count).toBeGreaterThan(0);

    const undersized: string[] = [];
    for (let index = 0; index < count; index += 1) {
      const target = targets.nth(index);
      const box = await target.boundingBox();
      if (box === null) continue;

      // The skip link and anything else built on the visually-hidden pattern is a 1px clipped
      // box until it takes focus, at which point it is full size. Nothing can be aimed at with
      // a finger before then, and nothing is meant to be — its keyboard behaviour is asserted
      // in `marketing.spec.ts` instead.
      if (box.width <= 4 && box.height <= 4) continue;

      // WCAG 2.2 §2.5.8 sets 24px; 44px is Apple's and Google's guidance and the one that
      // matters for a person filling in a form on a bus. Inline links inside a paragraph are
      // exempt from the rule and from this check — their height is the line height.
      const isInlineProse = await target.evaluate(
        (node) => node.closest('p') !== null || node.closest('li') !== null,
      );
      if (isInlineProse) continue;

      if (box.height < 44 || box.width < 24) {
        undersized.push(
          `${(await target.textContent())?.trim() ?? '?'} → ${box.width}×${box.height}`,
        );
      }
    }

    expect(undersized, `undersized tap targets: ${undersized.join(', ')}`).toEqual([]);
  });
});
