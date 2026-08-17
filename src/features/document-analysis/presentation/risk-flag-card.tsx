'use client';
import { useActionState } from 'react';

import { ANALYTICS } from '@/core/container';
import { useService } from '@/core/container/context';
import { AccordionItem, DocumentExcerpt, RiskBadge, Text, Button } from '@/shared/ui';
import { resolveFlagAction } from './actions';
import { CheckCircle2Icon } from 'lucide-react';

/**
 * Imported from the file, not from `../application`.
 *
 * The barrel has runtime exports — the use-case factories — and a `'use client'` module that
 * imports a barrel pulls the whole barrel into the browser bundle even when only a type is
 * wanted. Deep-importing the DTO module keeps this component's client payload to the domain's
 * pure types, which is exactly what it needs and nothing more.
 */
import { type RiskFlagDto } from '../application/dto';
import { CLAUSE_CATEGORY_LABEL } from '../constants';

/**
 * One finding, expandable.
 *
 * ### Why this is a Client Component and the rest of the report is not
 *
 * For one line: the analytics call when a user opens a flag. That single event is the product
 * question this feature exists to answer — do people actually read the findings, and which
 * severity makes them look? Answering it needs an interaction, and an interaction needs
 * JavaScript.
 *
 * Everything expensive stays outside: the excerpt, the explanation and the recommendation are
 * passed in as already-rendered props from a Server Component. What ships to the browser is
 * this component's behaviour, not the document's text.
 *
 * ### Why the analytics client is resolved, not imported
 *
 * `useService(ANALYTICS)` reads from the container the root layout mounted. Importing a
 * singleton instead would give this component a hard dependency on a concrete provider — and
 * a test would have to intercept a network call instead of registering a fake. The container
 * is also where consent is enforced, so a component cannot route around it by construction.
 *
 * ### Why `<details>` and not a state hook
 *
 * `AccordionItem` renders a native `<details>`. It works with JavaScript disabled, it is
 * keyboard-accessible and screen-reader-announced without a single ARIA attribute, and
 * browser find-in-page can open it to reveal a match — which for a page whose entire purpose
 * is quoting a contract back to someone is not a small thing. `onToggle` gives the event; the
 * open state itself is never mirrored into React, because two sources of truth for "is this
 * open" is how a disclosure widget starts fighting its own animation.
 */

export interface RiskFlagCardProps {
  readonly documentId: string;
  readonly flag: RiskFlagDto;
}

export function RiskFlagCard({ documentId, flag }: RiskFlagCardProps) {
  const analytics = useService(ANALYTICS);
  const [state, formAction] = useActionState(resolveFlagAction, null);

  return (
    <AccordionItem
      variant="separated"
      /*
       * No `group`. `AccordionItem`'s group prop maps onto the native `name` attribute, which
       * makes the items *mutually exclusive* — opening one closes the rest. That is right for
       * an FAQ and wrong here: comparing two clauses is the main thing a user does with this
       * list, and it would also mean only the last of several critical findings could honour
       * `defaultOpen`. Independent disclosure is the correct behaviour, and it is the default.
       */
      /*
       * Critical findings start open. A user who scrolls past a collapsed row has not been
       * warned — and "we told you, it was behind the chevron" is not a defence when the
       * clause costs them a deposit.
       */
      defaultOpen={flag.level === 'critical'}
      onToggle={(event) => {
        if (!event.currentTarget.open) return;
        analytics.track('risk_flag.expanded', { documentId, severity: flag.level });
      }}
      title={
        <span className="flex min-w-0 flex-1 items-center gap-3">
          <RiskBadge level={flag.level} size="sm" />
          <span className="min-w-0 flex-1">
            <Text
              as="span"
              size="sm"
              weight="medium"
              tone="primary"
              truncate
              className={flag.isResolved ? 'text-text-tertiary line-through' : ''}
            >
              {flag.title}
            </Text>
          </span>
          {flag.isResolved && (
            <span className="hidden items-center gap-1 rounded border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-green-600 uppercase sm:inline-flex">
              <CheckCircle2Icon className="h-3 w-3" /> Resolved
            </span>
          )}
          <Text as="span" size="xs" tone="tertiary" className="hidden sm:inline">
            {CLAUSE_CATEGORY_LABEL[flag.category]}
          </Text>
        </span>
      }
    >
      <div className="flex flex-col gap-4 pt-1">
        {/*
         * The user's own words, quoted, before our interpretation of them. Order matters: a
         * verdict shown above its evidence asks to be taken on trust, and this product's whole
         * proposition is that it does not have to be.
         */}
        <DocumentExcerpt level={flag.level} clamp="long">
          {flag.excerpt}
        </DocumentExcerpt>

        <Text size="sm" tone="secondary" editorial measure>
          {flag.explanation}
        </Text>

        {flag.recommendation ? (
          <Text size="sm" tone="primary" weight="medium" measure>
            {flag.recommendation}
          </Text>
        ) : null}

        <form action={formAction} className="pt-2">
          <input type="hidden" name="documentId" value={documentId} />
          <input type="hidden" name="flagId" value={flag.id} />
          <Button variant={flag.isResolved ? 'secondary' : 'premium'} size="sm" type="submit">
            {flag.isResolved ? 'Reopen Flag' : 'Mark as Resolved'}
          </Button>
        </form>
      </div>
    </AccordionItem>
  );
}
