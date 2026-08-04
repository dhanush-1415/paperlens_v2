import { describe, expect, it } from 'vitest';

import { AppError, notFoundError } from '../errors/app-error';
import { attempt, attemptSync } from '../errors/boundaries';
import {
  all,
  andThen,
  andThenAsync,
  err,
  isErr,
  isOk,
  map,
  mapErr,
  match,
  ok,
  partition,
  unwrapOr,
  unwrapOrElse,
  unwrapOrThrow,
} from './result';

/**
 * `Result` is the type every layer below a boundary speaks, so its behaviour is the single
 * most load-bearing contract in the codebase. These tests pin the properties the rest of the
 * architecture assumes — above all that the failure path *short-circuits* rather than being
 * skipped by convention.
 */

describe('constructors and guards', () => {
  it('narrows through isOk / isErr', () => {
    const good = ok(42);
    const bad = err(new AppError('INTERNAL_ERROR'));

    expect(isOk(good)).toBe(true);
    expect(isErr(good)).toBe(false);
    expect(isOk(bad)).toBe(false);
    expect(isErr(bad)).toBe(true);
  });
});

describe('map / mapErr', () => {
  it('transforms the value and leaves an error untouched', () => {
    expect(map(ok(2), (n) => n * 3)).toEqual(ok(6));
  });

  it('does not call the mapper on an error — the short-circuit is the point', () => {
    let called = false;
    const error = new AppError('INTERNAL_ERROR');

    const result = map(err(error), () => {
      called = true;
      return 1;
    });

    expect(called).toBe(false);
    expect(result).toEqual(err(error));
  });

  it('mapErr is the mirror image', () => {
    const mapped = mapErr(err(new AppError('INTERNAL_ERROR')), () => notFoundError('document', 'x'));
    expect(isErr(mapped) && mapped.error.code).toBe('NOT_FOUND');
    expect(mapErr(ok(1), () => new AppError('INTERNAL_ERROR'))).toEqual(ok(1));
  });
});

describe('andThen', () => {
  it('chains successful steps', () => {
    expect(andThen(ok(2), (n) => ok(n + 1))).toEqual(ok(3));
  });

  it('stops at the first failure', () => {
    const error = new AppError('VALIDATION_FAILED');
    let secondRan = false;

    const result = andThen(andThen(ok(1), () => err(error)), () => {
      secondRan = true;
      return ok(99);
    });

    expect(secondRan).toBe(false);
    expect(result).toEqual(err(error));
  });

  it('andThenAsync short-circuits without awaiting the next step', async () => {
    let ran = false;
    const result = await andThenAsync(err(new AppError('TIMEOUT')), async () => {
      ran = true;
      return ok(1);
    });

    expect(ran).toBe(false);
    expect(isErr(result)).toBe(true);
  });
});

describe('unwrapping', () => {
  it('unwrapOr and unwrapOrElse supply a fallback only on failure', () => {
    expect(unwrapOr(ok(1), 0)).toBe(1);
    expect(unwrapOr(err(new AppError('INTERNAL_ERROR')), 0)).toBe(0);
    expect(unwrapOrElse(err(new AppError('INTERNAL_ERROR')), (e) => e.code.length)).toBe('INTERNAL_ERROR'.length);
  });

  it('unwrapOrThrow rethrows the original error instance, not a copy', () => {
    const error = notFoundError('document', 'abc');
    expect(() => unwrapOrThrow(err(error))).toThrowError(error);
    expect(unwrapOrThrow(ok('v'))).toBe('v');
  });

  it('match forces both branches to be handled', () => {
    const describe_ = (r: ReturnType<typeof ok<number>> | ReturnType<typeof err<AppError>>) =>
      match(r, {
        ok: (n) => `ok:${n}`,
        err: (e) => `err:${e.code}`,
      });

    expect(describe_(ok(1))).toBe('ok:1');
    expect(describe_(err(new AppError('FORBIDDEN')))).toBe('err:FORBIDDEN');
  });
});

describe('collections', () => {
  it('all fails on the first error', () => {
    expect(all([ok(1), ok(2)])).toEqual(ok([1, 2]));
    const failed = all([ok(1), err(new AppError('INTERNAL_ERROR')), ok(3)]);
    expect(isErr(failed)).toBe(true);
  });

  it('partition keeps both sides — for batch work that must not abort', () => {
    const { values, errors } = partition([ok(1), err(new AppError('INTERNAL_ERROR')), ok(3)]);
    expect(values).toEqual([1, 3]);
    expect(errors).toHaveLength(1);
  });
});

describe('attempt', () => {
  it('converts a resolved promise into ok', async () => {
    await expect(attempt(async () => 5)).resolves.toEqual(ok(5));
  });

  it('converts a thrown error into a normalised AppError', async () => {
    const result = await attempt(async () => {
      throw new TypeError('boom');
    });

    expect(isErr(result)).toBe(true);
    expect(isErr(result) && result.error).toBeInstanceOf(AppError);
  });

  it('preserves an AppError thrown from inside rather than wrapping it', async () => {
    const original = notFoundError('document', 'id');
    const result = await attempt(async () => {
      throw original;
    });

    expect(isErr(result) && result.error).toBe(original);
  });

  it('attemptSync does the same for synchronous work', () => {
    expect(attemptSync(() => 1)).toEqual(ok(1));
    expect(
      isErr(
        attemptSync(() => {
          throw new Error('x');
        }),
      ),
    ).toBe(true);
  });
});
