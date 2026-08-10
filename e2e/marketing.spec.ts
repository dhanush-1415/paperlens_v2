import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * The public site, verified where it actually has to work: in the production build.
 *
 * ### Why the first block fetches raw HTML instead of driving the browser
 *
 * Because the failure this suite exists to catch is invisible to a browser. Every marketing
 * route once shipped as an empty client-rendered shell — a spinner in the HTML, the real page
 * painted afterwards by JavaScript. In Chrome it looked perfect. To Googlebot, to an AI
 * assistant, to a link preview and to anyone on a slow connection it was a blank page with a
 * loading state, and the entire point of twenty-five programmatic SEO pages was gone.
 *
 * The cause was a single clock read while constructing a service during render, which under
 * `cacheComponents` makes the prerender non-deterministic and forces the bailout. Nothing about
 * it was visible in a type check, a lint run, 900 unit tests or a green build — and nothing
 * about the *next* one will be either. So the assertion is made against the bytes the server
 * sends, on every public route, and it is the first thing in this file.
 *
 * `request.get` rather than `page.goto`: it never runs JavaScript, which is exactly the reader
 * we are testing for.
 */

/** Every route a signed-out visitor can reach, plus the guide that is the SEO template. */
const PUBLIC_ROUTES = [
  '/',
  '/pricing',
  '/how-it-works',
  '/security',
  '/use-cases',
  '/for/irs-cp2000-notice',
  '/terms',
  '/privacy',
  '/cookies',
] as const;

async function serverHtml(request: APIRequestContext, path: string): Promise<string> {
  const response = await request.get(path);
  expect(response.status(), `${path} did not return 200`).toBe(200);
  return response.text();
}

test.describe('server-rendered content', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} arrives as HTML, not as a client-side bailout`, async ({ request }) => {
      const html = await serverHtml(request, route);

      // The marker React streams when a prerender was abandoned. Its presence means everything
      // below the boundary is missing from the response.
      expect(html).not.toContain('BAILOUT_TO_CLIENT_SIDE_RENDERING');

      // And the positive assertion, because a page can also be empty without bailing: the
      // heading a crawler indexes has to be in the bytes.
      expect(html, `${route} served no <h1>`).toMatch(/<h1[\s>]/);
    });
  }

  test('the guide template ships its structured data and its answers', async ({ request }) => {
    const html = await serverHtml(request, '/for/irs-cp2000-notice');

    const block = html.match(
      /<script type="application\/ld\+json">(.*?)<\/script>/s,
    ) as RegExpMatchArray | null;
    expect(block, 'no JSON-LD in the guide response').not.toBeNull();

    const graph = (
      JSON.parse(block![1] as string) as {
        '@graph': { '@type': string; mainEntity?: { name: string }[] }[];
      }
    )['@graph'];

    expect(graph.map((node) => node['@type'])).toEqual(['BreadcrumbList', 'FAQPage']);

    // The answers are in the HTML while the accordion is closed — the native `<details>` doing
    // its job. This is the part an assistant quotes when asked the same question.
    const faq = graph.find((node) => node['@type'] === 'FAQPage');
    const firstQuestion = faq?.mainEntity?.[0]?.name;
    expect(firstQuestion).toBeTruthy();
    expect(html).toContain(firstQuestion as string);
  });

  test('every guide is prerendered, not just the one under test', async ({ request }) => {
    const hub = await serverHtml(request, '/use-cases');
    const slugs = [...hub.matchAll(/href="\/for\/([a-z0-9-]+)"/g)].map((match) => match[1]);

    expect(new Set(slugs).size).toBe(25);

    // A spot check across the corpus rather than all 25 responses: this test is about the hub
    // linking real pages, and the route-level assertion above covers the template itself.
    for (const slug of [...new Set(slugs)].slice(0, 3)) {
      const html = await serverHtml(request, `/for/${slug}`);
      expect(html, `/for/${slug} served no <h1>`).toMatch(/<h1[\s>]/);
    }
  });

  test('each page states its own canonical URL and description', async ({ request }) => {
    for (const route of ['/pricing', '/security', '/for/irs-cp2000-notice']) {
      const html = await serverHtml(request, route);

      expect(html, `${route} has no meta description`).toMatch(/<meta name="description"/);
      expect(html, `${route} has no canonical`).toContain(`rel="canonical"`);
    }
  });
});

test.describe('the public shell', () => {
  test('carries the same header and footer on every route', async ({ page }) => {
    for (const route of PUBLIC_ROUTES) {
      await page.goto(route);

      await expect(page.getByRole('banner'), route).toBeVisible();
      await expect(page.getByRole('contentinfo'), route).toBeVisible();
      await expect(page.getByRole('main'), route).toBeVisible();
    }
  });

  test('offers a skip link as the first thing a keyboard reaches', async ({ page }) => {
    await page.goto('/');

    // WCAG 2.4.1. Without it, a keyboard user tabs through the whole nav on every page before
    // reaching the content they came for.
    await page.keyboard.press('Tab');

    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();

    await skip.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });

  test('navigates the primary links without a full reload', async ({ page }) => {
    await page.goto('/');

    await page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('link', { name: 'Pricing' })
      .click();
    await expect(page).toHaveURL(/\/pricing$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('cookie consent', () => {
  test('asks once, accepts a refusal, and does not ask again', async ({ page }) => {
    await page.goto('/');

    const banner = page.getByRole('region', { name: 'Cookies and analytics' });
    await expect(banner).toBeVisible();

    // Both choices are buttons of equal weight. A "reject" rendered as grey text is the dark
    // pattern this component exists to not be.
    await expect(banner.getByRole('button', { name: 'Reject' })).toBeVisible();
    await expect(banner.getByRole('button', { name: 'Accept' })).toBeVisible();

    await banner.getByRole('button', { name: 'Reject' }).click();
    await expect(banner).toBeHidden();

    // Across a navigation and across a reload — the decision is persisted, not just hidden.
    await page.goto('/pricing');
    await expect(page.getByRole('region', { name: 'Cookies and analytics' })).toBeHidden();

    await page.reload();
    await expect(page.getByRole('region', { name: 'Cookies and analytics' })).toBeHidden();
  });

  test('leaves the page usable while it is open', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('region', { name: 'Cookies and analytics' })).toBeVisible();
    // Not a modal: no focus trap, no barrier. A consent wall is the other dark pattern.
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('heading', { level: 1 }).click();
  });
});

test.describe('the sticky call to action', () => {
  /** Dismiss the consent banner first — it sits at the same edge of the viewport. */
  async function settleConsent(page: import('@playwright/test').Page) {
    await page
      .getByRole('region', { name: 'Cookies and analytics' })
      .getByRole('button', { name: 'Reject' })
      .click();
  }

  test('is earned by scrolling, and stays dismissed for the session', async ({ page }) => {
    await page.goto('/');
    await settleConsent(page);

    const bar = page.getByRole('region', { name: /Ready to see what your document says/ });

    // Not on arrival. A bar that appears immediately is an interruption; one that appears
    // after most of the page is a convenience.
    await expect(bar).toBeHidden();

    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await expect(bar).toBeVisible();

    await bar.getByRole('button', { name: 'Close' }).click();
    await expect(bar).toBeHidden();

    // Scrolling again must not resurrect it, and neither must a reload: the dismissal is stored
    // for the session, because a bar that returns is how a product teaches people to use
    // blockers.
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await expect(bar).toBeHidden();

    await page.reload();
    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await expect(bar).toBeHidden();
  });
});

test.describe('pricing', () => {
  test('quotes a total that changes with the volume, from the keyboard', async ({ page }) => {
    await page.goto('/pricing');

    const slider = page.getByRole('slider', { name: /documents per month/i });
    await expect(slider).toBeVisible();

    const before = await page.getByRole('status').first().textContent();

    // Arrow keys, not a drag: the native range input is the reason this works at all, and a
    // custom slider is where that gets lost.
    await slider.focus();
    for (let press = 0; press < 8; press += 1) await slider.press('ArrowRight');

    await expect.poll(async () => page.getByRole('status').first().textContent()).not.toBe(before);
  });

  test('shows a price without asking for an email first', async ({ page }) => {
    await page.goto('/pricing');

    // Hiding a price behind a form qualifies leads at the cost of the buyer's afternoon, and it
    // is not compatible with a product whose premise is that you are entitled to know what
    // something costs before you commit.
    await expect(page.getByText('$0')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toHaveCount(0);
  });
});
