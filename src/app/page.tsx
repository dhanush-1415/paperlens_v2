import type { Metadata } from 'next';

import { appConfig } from '@/config';
import { serverEnv } from '@/config/env.server';
import { resolveTenant } from '@/config/tenant';
import { TRANSLATOR } from '@/core/container';
import { getRequestScope } from '@/server/bootstrap';
import {
  Badge,
  Card,
  CardDescription,
  CardTitle,
  Container,
  Heading,
  Section,
  Stack,
  Text,
  ThemeToggle,
} from '@/shared/ui';

/**
 * The home page.
 *
 * Deliberately thin. This is the architecture foundation, not the product: the marketing
 * pages, the scan flow and the vault arrive as feature modules under `src/features/`, each
 * owning its own routes. What this page proves is that the shell composes — fonts load, the
 * theme resolves before paint and survives a toggle, the design system renders, and the
 * whole thing prerenders as a static shell under `cacheComponents`.
 *
 * ### Why it is a Server Component
 *
 * It reads configuration and renders markup. Neither needs to happen in a browser, so
 * nothing here ships to one. `ThemeToggle` is the single client island on the page — it owns
 * interactivity, and it is the only thing that costs JavaScript.
 */
export const metadata: Metadata = {
  // No `title`: the root layout's `title.default` already reads "PaperLens — Understand any
  // document before you sign it", and the template would otherwise render it twice.
  description: appConfig.description,
};

const tenant = resolveTenant(serverEnv.TENANT_ID);

/**
 * The centralised concerns, as the container knows them. Rendered here so the page is a
 * live index of what exists rather than a screenshot of it.
 */
const FOUNDATIONS = [
  {
    title: 'One container',
    body: 'Every service is resolved from a typed token. Swapping an implementation is one line in a composition root — never an edit at a call site.',
  },
  {
    title: 'One error path',
    body: 'Failures are Result values in the data path and exceptions only at boundaries, normalised into AppError with a code, a severity and a correlation ID.',
  },
  {
    title: 'One stylesheet',
    body: 'Every colour, radius, shadow and duration is declared once in tokens.css. A tenant re-skins the entire product by overriding a handful of them.',
  },
  {
    title: 'One data rule',
    body: 'UI never touches a data source. Server Components read through the DAL, which verifies the session per request and returns DTOs, never rows.',
  },
] as const;

export default function HomePage() {
  /**
   * Labels are resolved on the server and passed down as props.
   *
   * `ThemeToggle` is a Client Component, and a Client Component that imported the translator
   * would ship the entire dictionary to the browser to render four words. Resolving here
   * keeps the strings on the server, keeps the island's bundle to its behaviour, and — the
   * part that matters for requirement 29 — means the component has no opinion about locale
   * at all. It renders whatever it is handed.
   */
  const t = getRequestScope().resolve(TRANSLATOR);

  return (
    <Container as="main" className="flex-1">
      <Section spacing="xl" aria-labelledby="hero-title">
        <Stack gap="lg" align="start">
          <Stack direction="row" gap="sm" align="center" justify="between" className="w-full">
            <Badge tone="brand">{appConfig.environment}</Badge>
            <ThemeToggle
              label={t.t('theme.label')}
              optionLabels={{
                light: t.t('theme.light'),
                dark: t.t('theme.dark'),
                system: t.t('theme.system'),
              }}
            />
          </Stack>

          <Heading
            level={1}
            id="hero-title"
            size="lg"
            className="font-display text-4xl sm:text-5xl lg:text-6xl"
          >
            {tenant.tagline}
          </Heading>

          <Text size="lg" tone="secondary" editorial measure>
            {tenant.productName} reads the contract, the lease or the notice you were about to
            sign and tells you what it actually says — in the order that matters, with the
            clauses that cost you money at the top.
          </Text>
        </Stack>
      </Section>

      <Section spacing="lg" divider aria-labelledby="foundations-title">
        <Stack gap="lg">
          <Stack gap="xs">
            <Heading level={2} size="eyebrow" id="foundations-title">
              Foundation
            </Heading>
            <Text tone="secondary" measure>
              The architecture underneath. One owner per concern — change it once, and it
              changes everywhere.
            </Text>
          </Stack>

          <Stack
            as="ul"
            direction="row"
            gap="md"
            wrap
            className="[&>li]:min-w-72 [&>li]:flex-1 [&>li]:list-none"
          >
            {FOUNDATIONS.map((item) => (
              <li key={item.title}>
                <Card className="h-full">
                  <CardTitle as="h3">{item.title}</CardTitle>
                  <CardDescription>{item.body}</CardDescription>
                </Card>
              </li>
            ))}
          </Stack>
        </Stack>
      </Section>
    </Container>
  );
}
