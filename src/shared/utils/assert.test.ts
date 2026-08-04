import { describe, expect, it } from 'vitest';

import { assert, assertDefined, assertNever, required } from './assert';

/**
 * Invariants.
 *
 * The behaviour under test is small; the *distinction* being enforced is not. These throw a
 * plain `Error` rather than an `AppError`, and that is deliberate: an `AppError` carries an
 * HTTP status, a user-facing message key and a retry flag, none of which mean anything for a
 * state that cannot happen. Wrapping a bug in the vocabulary of an expected failure is how it
 * ends up rendered to a user as "something went wrong, please try again" and retried forever.
 *
 * So the assertions below check the message shape too: an invariant should be identifiable in
 * a log at a glance, without reading the stack.
 */

describe('assert', () => {
  it('passes a truthy condition through silently', () => {
    expect(() => assert(1, 'never')).not.toThrow();
  });

  it('throws a labelled Error on a falsy condition', () => {
    expect(() => assert(false, 'user must be loaded')).toThrow('Invariant failed: user must be loaded');
  });

  it('treats every falsy value as a violation, including zero and the empty string', () => {
    for (const value of [0, '', null, undefined, Number.NaN, false]) {
      expect(() => assert(value, 'x'), String(value)).toThrow(/Invariant failed/);
    }
  });

  it('narrows the type for the code that follows', () => {
    const value: string | null = 'present' as string | null;
    assert(value !== null, 'value');
    // Compiles only because `assert` is declared `asserts condition`.
    expect(value.length).toBe(7);
  });
});

describe('assertDefined', () => {
  it('accepts any defined value, including the falsy ones', () => {
    // The difference from `assert`: `0` and `''` are legitimate values, and an invariant that
    // rejected them would fire on a genuinely-empty document title.
    for (const value of [0, '', false, Number.NaN]) {
      expect(() => assertDefined(value, 'x'), String(value)).not.toThrow();
    }
  });

  it('names which of null and undefined it received', () => {
    // The two mean different things — a missing key versus a key explicitly set to nothing —
    // and knowing which one arrived is usually the whole debugging session.
    expect(() => assertDefined(null, 'session')).toThrow(/received null/);
    expect(() => assertDefined(undefined, 'session')).toThrow(/received undefined/);
  });
});

describe('required', () => {
  it('returns the value, so it can be used in an expression position', () => {
    expect(required('doc_1', 'id')).toBe('doc_1');
    expect(required(0, 'count')).toBe(0);
  });

  it('throws with the same message as assertDefined', () => {
    expect(() => required(null, 'id')).toThrow('Invariant failed: id (received null)');
  });
});

describe('assertNever', () => {
  it('reports the unhandled value, not just that one existed', () => {
    // Reached only when a union gained a member and a switch was not updated — usually in
    // production, from data that predates the deploy. The value is the only clue.
    expect(() => assertNever('surprise' as never)).toThrow('Unhandled case: "surprise"');
  });

  it('accepts a call-site message naming which switch fell through', () => {
    expect(() => assertNever('x' as never, 'Unknown risk level')).toThrow(
      'Unknown risk level: "x"',
    );
  });
});
