/**
 * Consent persistence (requirement 16).
 *
 * Consent is stored client-side through the storage layer, versioned like everything else.
 * The version matters more here than elsewhere: adding a new consent category invalidates a
 * previously-recorded choice, because the user never agreed to the new category. Bumping
 * `CONSENT_VERSION` re-asks, which is the legally and ethically correct behaviour and is
 * exactly what a hand-rolled `localStorage.getItem('consent')` would get wrong.
 */

import { STORAGE_KEYS } from '@/shared/constants/storage-keys';

import { createStorageEntry } from '../storage/entry';
import { DEFAULT_CONSENT, type ConsentState, type ConsentValue } from './types';
import type { StorageDriver, StorageEntry } from '../storage/types';

/** Bump when a category is added or its meaning changes. Forces a re-ask. */
export const CONSENT_VERSION = 1;

function isConsentValue(value: unknown): value is ConsentValue {
  return value === 'granted' || value === 'denied' || value === 'unknown';
}

function isConsentState(value: unknown): value is ConsentState {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.essential === true &&
    isConsentValue(candidate.analytics) &&
    isConsentValue(candidate.marketing) &&
    (candidate.decidedAt === null || typeof candidate.decidedAt === 'number')
  );
}

export function createConsentStore(driver: StorageDriver): StorageEntry<ConsentState> {
  return createStorageEntry<ConsentState>(
    {
      key: STORAGE_KEYS.consent,
      version: CONSENT_VERSION,
      fallback: DEFAULT_CONSENT,
      validate: isConsentState,
    },
    { driver },
  );
}

/** True when the banner should be shown. */
export function needsConsentDecision(consent: ConsentState): boolean {
  return consent.analytics === 'unknown' || consent.marketing === 'unknown';
}

export function grantAll(now: number): ConsentState {
  return { essential: true, analytics: 'granted', marketing: 'granted', decidedAt: now };
}

export function denyAll(now: number): ConsentState {
  return { essential: true, analytics: 'denied', marketing: 'denied', decidedAt: now };
}

/**
 * A partial choice from a preferences dialog.
 *
 * Anything left unspecified becomes `denied`, never `unknown`: the user made a decision, and
 * recording the unspecified parts as "not asked" would re-prompt them for a question they
 * just answered.
 */
export function customConsent(
  choices: { analytics?: boolean; marketing?: boolean },
  now: number,
): ConsentState {
  return {
    essential: true,
    analytics: choices.analytics ? 'granted' : 'denied',
    marketing: choices.marketing ? 'granted' : 'denied',
    decidedAt: now,
  };
}
