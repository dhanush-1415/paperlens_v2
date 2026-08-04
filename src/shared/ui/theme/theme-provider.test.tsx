import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMemoryStorageDriver, createStorageEntry, type StorageDriver } from '@/core/storage';
import { COOKIE_NAMES, STORAGE_KEYS } from '@/shared/constants/storage-keys';

import { THEME_STORAGE_VERSION } from './script';
import { ThemeProvider, useTheme } from './theme-provider';
import { DEFAULT_THEME_PREFERENCE, type ThemePreference } from './types';

/**
 * Theme ownership.
 *
 * The interesting property is not "the toggle changes a value" — it is that three separate
 * sources of truth stay reconciled: the user's stored *preference*, the OS setting, and the
 * `data-theme` attribute that CSS actually reads. Each pair can disagree, and each
 * disagreement has a distinct visible symptom:
 *
 *   preference vs OS       a user on `'system'` whose OS flips at sunset and whose page
 *                          does not follow;
 *   preference vs DOM      a toggle that appears to do nothing;
 *   tab vs tab             two windows of the same app in different themes.
 *
 * The three-state cycle gets its own test because collapsing it to a flip is the most tempting
 * simplification in the file, and it permanently strands anyone who ever tapped the toggle:
 * `'system'` becomes unreachable and the OS setting is ignored from then on.
 */

/* ── A `matchMedia` we can actually change ────────────────────────────────────────────── */

/**
 * jsdom's `matchMedia` is a constant `false` with inert listeners, and the provider caches the
 * `MediaQueryList` it gets on first use — so a stub installed per-test would never be seen.
 * One controllable list, installed before any import runs, is the only shape that works.
 */
const listeners = new Set<(event: MediaQueryListEvent) => void>();
const systemQuery = {
  matches: false, // `SYSTEM_LIGHT_QUERY` — false means the OS is in dark mode.
  media: '',
  onchange: null,
  addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => {
    listeners.add(listener);
  },
  removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => {
    listeners.delete(listener);
  },
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => true,
};

function setOsTheme(theme: 'light' | 'dark') {
  systemQuery.matches = theme === 'light';
  act(() => {
    for (const listener of listeners) listener({ matches: systemQuery.matches } as MediaQueryListEvent);
  });
}

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: () => systemQuery as unknown as MediaQueryList,
  });
});

/* ── Harness ──────────────────────────────────────────────────────────────────────────── */

function Probe() {
  const { preference, resolved, isHydrated, setPreference, toggle } = useTheme();
  return (
    <div>
      <output data-testid="preference">{preference}</output>
      <output data-testid="resolved">{resolved}</output>
      <output data-testid="hydrated">{String(isHydrated)}</output>
      <button onClick={toggle}>toggle</button>
      <button onClick={() => setPreference('light')}>set light</button>
    </div>
  );
}

function mount(driver: StorageDriver) {
  return render(
    <ThemeProvider driver={driver}>
      <Probe />
    </ThemeProvider>,
  );
}

/** Writes a preference the way the provider does, envelope and all. */
function seed(driver: StorageDriver, preference: ThemePreference) {
  createStorageEntry<ThemePreference>(
    {
      key: STORAGE_KEYS.theme,
      version: THEME_STORAGE_VERSION,
      fallback: DEFAULT_THEME_PREFERENCE,
    },
    { driver },
  ).set(preference);
}

const value = (id: string) => screen.getByTestId(id).textContent;

let driver: StorageDriver;

beforeEach(() => {
  driver = createMemoryStorageDriver();
  systemQuery.matches = false;
  delete document.documentElement.dataset.theme;
});

afterEach(() => {
  listeners.clear();
});

/* ── Tests ────────────────────────────────────────────────────────────────────────────── */

describe('adopting the stored preference', () => {
  it('defaults to system when nothing is stored', () => {
    mount(driver);

    expect(value('preference')).toBe('system');
  });

  it('reads an explicit preference on the first client render, not in an effect', () => {
    // The obvious shape — default, then adopt storage in `useEffect` — renders a value it
    // already knows is wrong and corrects it a frame later. `useSyncExternalStore` supplies
    // the truth in the same commit that flips `isHydrated`.
    seed(driver, 'light');

    mount(driver);

    expect(value('preference')).toBe('light');
    expect(value('resolved')).toBe('light');
  });

  it('ignores a value that is not a theme', () => {
    // Storage is user-writable. `'dracula'` must resolve to the fallback rather than become a
    // `data-theme` value with no matching CSS — which renders an unstyled page.
    driver.setItem(STORAGE_KEYS.theme, JSON.stringify({ v: THEME_STORAGE_VERSION, d: 'dracula' }));

    mount(driver);

    expect(value('preference')).toBe(DEFAULT_THEME_PREFERENCE);
  });

  it('ignores a payload written by an older envelope version', () => {
    driver.setItem(STORAGE_KEYS.theme, JSON.stringify({ v: THEME_STORAGE_VERSION - 1, d: 'light' }));

    mount(driver);

    expect(value('preference')).toBe(DEFAULT_THEME_PREFERENCE);
  });

  it('reports itself hydrated once it has taken over from the bootstrap script', () => {
    mount(driver);

    expect(value('hydrated')).toBe('true');
  });
});

describe('resolving against the OS', () => {
  it('follows the OS while the preference is system', () => {
    setOsTheme('light');
    mount(driver);

    expect(value('resolved')).toBe('light');
  });

  it('follows an OS change without a reload', () => {
    // The reason `'system'` is stored as a preference rather than resolved at write time. A
    // user whose OS switches at sunset expects the page to follow.
    mount(driver);
    expect(value('resolved')).toBe('dark');

    setOsTheme('light');

    expect(value('resolved')).toBe('light');
  });

  it('ignores the OS once the user has chosen explicitly', () => {
    seed(driver, 'dark');
    setOsTheme('light');

    mount(driver);

    expect(value('resolved')).toBe('dark');
  });
});

describe('the toggle', () => {
  it('cycles light → dark → system rather than flipping', async () => {
    // A two-state flip makes `'system'` unreachable for anyone who ever tapped the toggle:
    // they are locked out of following their OS for good.
    seed(driver, 'light');
    mount(driver);

    await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
    expect(value('preference')).toBe('dark');

    await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
    expect(value('preference')).toBe('system');

    await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
    expect(value('preference')).toBe('light');
  });

  it('persists the choice through the injected driver', async () => {
    mount(driver);

    await userEvent.click(screen.getByRole('button', { name: 'set light' }));

    expect(driver.getItem(STORAGE_KEYS.theme)).toContain('light');
  });

  it('re-renders from the store rather than from local component state', async () => {
    // If `set` did not notify, the value would persist and the UI would not move — the
    // classic "the toggle does nothing" report.
    mount(driver);

    await userEvent.click(screen.getByRole('button', { name: 'set light' }));

    expect(value('preference')).toBe('light');
    expect(value('resolved')).toBe('light');
  });
});

describe('reflecting to the DOM', () => {
  it('writes data-theme on the document element', async () => {
    // On `<html>` rather than a class or a context value, because CSS that React does not
    // render still has to see it: the scrollbar, `::selection`, native controls, portals.
    mount(driver);

    await userEvent.click(screen.getByRole('button', { name: 'set light' }));

    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('mirrors the resolved theme into a cookie for server-rendered surfaces', async () => {
    mount(driver);

    await userEvent.click(screen.getByRole('button', { name: 'set light' }));

    expect(document.cookie).toContain(`${COOKIE_NAMES.theme}=light`);
  });

  it('writes the resolved theme, never the preference', async () => {
    // `data-theme="system"` has no matching CSS. The attribute is a rendering instruction,
    // and only light and dark are renderable.
    setOsTheme('light');
    mount(driver);

    await act(async () => {});

    expect(document.documentElement.dataset.theme).toBe('light');
  });
});

describe('cross-tab sync', () => {
  it('adopts a change made in another tab', () => {
    // The `storage` event fires in every *other* tab. Without this, a second window keeps the
    // old theme until it reloads — small, and very visible to anyone working with two windows.
    mount(driver);
    seed(driver, 'light');

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEYS.theme }));
    });

    expect(value('preference')).toBe('light');
  });

  it('ignores a storage event for an unrelated key', () => {
    mount(driver);
    seed(driver, 'light');

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'pl:something-else:v1' }));
    });

    // Still the cached value: an unrelated write must not cost a parse of ours.
    expect(value('preference')).toBe('system');
  });
});

describe('useTheme outside the provider', () => {
  it('throws rather than pretending the theme is light', () => {
    // A silent default makes a missing provider look like a working light theme, and the bug
    // surfaces weeks later as "the toggle does nothing on this one page".
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<Probe />)).toThrow(/must be used within <ThemeProvider>/);

    consoleError.mockRestore();
  });
});
