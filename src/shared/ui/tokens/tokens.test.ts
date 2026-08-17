import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { compareRisk, RISK_ORDER } from '@/shared/ui/patterns';
import { RISK_SEVERITY } from '@/features/document-analysis/domain';

import { BREAKPOINTS } from './breakpoints';
import { cssVar, cssVarName, isThemeTokenName, THEME_TOKEN_NAMES, THEME_TOKENS } from './contract';
import { LAYERS } from './layers';
import { DURATION, EASE_STANDARD, STAGGER_STEP } from './motion';

/**
 * The drift test.
 *
 * `src/app/tokens.css` owns every design value. A handful of places unavoidably restate one:
 * TypeScript cannot read a CSS custom property at build time, `global-error.tsx` renders
 * outside the stylesheet by definition, and `viewport.themeColor` is a `<meta>` tag Next
 * serializes before any CSS exists. Each of those duplications is documented at its site as
 * deliberate — and each one is a place two values can silently disagree.
 *
 * So this file parses the stylesheet and asserts the agreement mechanically. It is the
 * enforcement half of "one source of truth": the doc comments state the rule, this makes
 * breaking it a failing test rather than a visual bug someone notices in a screenshot three
 * releases later.
 */

/** Resolved from the repo root: `import.meta.url` is not a file URL under the jsdom env. */
const fromRoot = (path: string) => resolve(process.cwd(), path);

const CSS_PATH = fromRoot('src/app/tokens.css');
const css = readFileSync(CSS_PATH, 'utf8');

/** Custom properties declared anywhere in the sheet, last declaration winning. */
function declaredProperties(source: string): Map<string, string> {
  const found = new Map<string, string>();
  const pattern = /^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);/gim;

  for (const match of source.matchAll(pattern)) {
    found.set(match[1]!.trim(), match[2]!.trim());
  }

  return found;
}

/** Declarations inside the block matching `selector`, for per-theme assertions. */
function blockFor(selector: string): string {
  const start = css.indexOf(selector);
  expect(start, `no \`${selector}\` block in tokens.css`).toBeGreaterThan(-1);

  const open = css.indexOf('{', start);
  let depth = 0;

  for (let index = open; index < css.length; index += 1) {
    if (css[index] === '{') depth += 1;
    if (css[index] === '}') {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, index);
    }
  }

  throw new Error(`unbalanced braces after ${selector}`);
}

/** Single quotes, matching the stylesheet exactly — this is a substring search, not a parser. */
const LIGHT_SELECTOR = ":root[data-theme='light']";

const properties = declaredProperties(css);

describe('the token contract and the stylesheet name the same things', () => {
  it('declares every token the contract names', () => {
    const missing = THEME_TOKEN_NAMES.filter((token) => !properties.has(cssVarName(token)));

    expect(missing, `declared in contract.ts but not in tokens.css: ${missing.join(', ')}`).toEqual(
      [],
    );
  });

  it('names every token the stylesheet declares', () => {
    // The other direction, and the one that actually catches drift in practice: a value gets
    // added to the sheet during a design pass and never reaches the type, so `tokenOverrides`
    // silently cannot address it.
    const undeclared = [...properties.keys()]
      .map((property) => property.slice(2))
      // `--ge-*` belongs to global-error.tsx's inlined critical CSS, `--font-*` to next/font,
      // and `--color-*`/`--text-*`/`--radius-*` to the Tailwind `@theme` scales.
      .filter(
        (name) => !/^(ge-|font-|color-|text-|radius-|shadow-|spacing-|breakpoint-)/.test(name),
      )
      .filter((name) => !isThemeTokenName(name));

    expect(undeclared, `in tokens.css but not in contract.ts: ${undeclared.join(', ')}`).toEqual(
      [],
    );
  });

  it('has no duplicate names across groups', () => {
    expect(new Set(THEME_TOKEN_NAMES).size).toBe(THEME_TOKEN_NAMES.length);
  });

  it('builds custom-property references in exactly one place', () => {
    expect(cssVarName('canvas')).toBe('--canvas');
    expect(cssVar('canvas')).toBe('var(--canvas)');
  });
});

describe('both themes are complete', () => {
  const themeScoped = Object.entries(THEME_TOKENS)
    // Brand, motion, layer, focus and layout are theme-independent by design — they are
    // declared once on `:root` and deliberately not restated per theme.
    .filter(([group]) => ['surface', 'border', 'text'].includes(group))
    .flatMap(([, tokens]) => tokens)
    // `text-on-brand` sits on the brand colour, which is theme-independent — so it is
    // shared with the base block on purpose, exactly like `brand-*` itself.
    .filter((token) => token !== 'text-on-brand');

  it('the light theme overrides every theme-dependent token', () => {
    const light = declaredProperties(blockFor(LIGHT_SELECTOR));
    const missing = themeScoped.filter((token) => !light.has(`--${token}`));

    expect(missing, `not overridden for light: ${missing.join(', ')}`).toEqual([]);
  });

  it('keeps the risk palette theme-aware — a safety signal must survive both canvases', () => {
    const light = declaredProperties(blockFor(LIGHT_SELECTOR));

    // The base hue of each level is shared — "critical is red" is not a theme decision. What
    // must be re-stated is the foreground/background/border triple, because a red that reads
    // on a near-black canvas is unreadable on a near-white one, and this signal is the whole
    // product.
    for (const token of THEME_TOKENS.risk.filter((name) => /-(fg|bg|border)$/.test(name))) {
      expect(light.has(`--${token}`), `--${token} is not re-stated for light`).toBe(true);
    }
  });

  it('declares `color-scheme` in both, so form controls and scrollbars follow', () => {
    expect(blockFor(':root')).toMatch(/color-scheme:\s*dark/);
    expect(blockFor(LIGHT_SELECTOR)).toMatch(/color-scheme:\s*light/);
  });
});

describe('the TypeScript mirrors match the stylesheet', () => {
  it('motion durations agree', () => {
    expect(properties.get('--duration-micro')).toBe(`${DURATION.micro}ms`);
    expect(properties.get('--duration-standard')).toBe(`${DURATION.standard}ms`);
    expect(properties.get('--duration-entrance')).toBe(`${DURATION.entrance}ms`);
  });

  it('the stagger step agrees', () => {
    expect(properties.get('--stagger-step')).toBe(`${STAGGER_STEP}ms`);
  });

  it('the easing curve agrees, character for character', () => {
    // A curve that differs in the third decimal is a curve nobody will ever notice is wrong
    // and everybody will feel is off.
    expect(properties.get('--ease-standard')).toBe(EASE_STANDARD);
  });

  it('every stacking layer agrees', () => {
    for (const [name, value] of Object.entries(LAYERS)) {
      expect(properties.get(`--z-${name}`), `--z-${name}`).toBe(String(value));
    }
  });

  it('the layer scale leaves room to insert between neighbours', () => {
    const values = Object.values(LAYERS);
    const ascending = [...values].sort((a, b) => a - b);

    expect(values).toEqual(ascending);
    for (let index = 1; index < values.length; index += 1) {
      expect(values[index]! - values[index - 1]!).toBeGreaterThanOrEqual(100);
    }
  });

  it('breakpoints are ascending and distinct', () => {
    const values = Object.values(BREAKPOINTS);
    expect([...values].sort((a, b) => a - b)).toEqual(values);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe('the values restated outside the stylesheet', () => {
  const read = (path: string) => readFileSync(fromRoot(path), 'utf8');

  /** `#08090B` and `#08090b` are the same colour to a browser and different strings to a test. */
  const hex = (value: string | undefined) => value?.trim().toLowerCase();

  it('global-error.tsx’s inlined canvas colours match the real tokens', () => {
    // `global-error.tsx` replaces the entire document, stylesheet included — so it cannot use
    // a token and has to inline its own. That is the one legitimate hex duplication in the
    // codebase, and this is what keeps it honest.
    const source = read('src/app/global-error.tsx');
    const inlined = [...source.matchAll(/--ge-canvas:\s*(#[0-9a-f]{6})/gi)].map((m) => hex(m[1]));

    expect(inlined).toHaveLength(2);
    expect(inlined).toContain(hex(declaredProperties(blockFor(LIGHT_SELECTOR)).get('--canvas')));
    expect(inlined).toContain(hex(properties.get('--canvas')));
  });

  it('the viewport themeColor meta matches both canvases', () => {
    // Painted by the browser chrome *before* the first byte of CSS is parsed, which is why it
    // is a literal and why it drifting produces a visible flash of the wrong colour.
    const source = read('src/app/layout.tsx');
    const colors = [...source.matchAll(/color:\s*'(#[0-9a-fA-F]{6})'/g)].map((m) => hex(m[1]));

    expect(colors).toContain(hex(properties.get('--canvas')));
    expect(colors).toContain(hex(declaredProperties(blockFor(LIGHT_SELECTOR)).get('--canvas')));
  });

  it('no design-system component contains a hex colour', () => {
    // Asserted where the temptation is highest. Anything that needs a colour reaches for a
    // token; anything no token can express is a missing token, not a licence to inline one.
    // The two files exempted above are exempt because they render outside the stylesheet.
    const roots = ['primitives', 'components', 'patterns'];
    const offenders: string[] = [];

    for (const root of roots) {
      const dir = fromRoot(`src/shared/ui/${root}`);
      // Tests are excluded: they ship to nobody, and a `#` in prose ("React #143") is not a
      // colour. Widening the regex to tell those apart would only make the guard subtler and
      // easier to slip past — the rule is about what renders, so it scans what renders.
      const components = readdirSync(dir).filter(
        (name) => /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name),
      );

      for (const file of components) {
        const source = readFileSync(`${dir}/${file}`, 'utf8');
        if (/#[0-9a-fA-F]{3,8}\b/.test(source.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ''))) {
          offenders.push(`${root}/${file}`);
        }
      }
    }

    expect(offenders, `hex literals outside tokens.css: ${offenders.join(', ')}`).toEqual([]);
  });
});

describe('the risk scale has one order, stated twice by necessity', () => {
  it('the domain severity and the design system’s badge order agree', () => {
    // `RISK_SEVERITY` (domain) ranks findings for scoring; `RISK_ORDER` (design system) ranks
    // badges for display. They must not be one constant — the design system may not import a
    // feature, and the domain may not import the UI. So they are two, and this is the seam
    // that proves they say the same thing.
    const byDomain = [...RISK_ORDER].sort((a, b) => RISK_SEVERITY[b] - RISK_SEVERITY[a]);

    expect(byDomain).toEqual([...RISK_ORDER]);
  });

  it('compareRisk sorts the way the domain scores', () => {
    const shuffled = ['safe', 'critical', 'caution'] as const;

    expect([...shuffled].sort(compareRisk)).toEqual(['critical', 'caution', 'safe']);
  });

  it('every risk level has a full set of tokens', () => {
    for (const level of RISK_ORDER) {
      for (const suffix of ['', '-fg', '-bg', '-border']) {
        expect(properties.has(`--risk-${level}${suffix}`), `--risk-${level}${suffix}`).toBe(true);
      }
    }
  });
});
