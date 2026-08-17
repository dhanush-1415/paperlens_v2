import { beforeEach, describe, expect, it } from 'vitest';

import { type StorageDriver } from '@/core/storage/types';

/**
 * The `StorageDriver` contract.
 *
 * A port is only an abstraction if every adapter behind it is *actually* interchangeable, and
 * "actually" is a testable claim. This suite is the claim: one description of the required
 * behaviour, executed against every implementation. An adapter that passes can be swapped in
 * at the composition root with no call-site change; one that fails is a different interface
 * wearing the same type.
 *
 * The rules that matter most here are the ones a naive adapter gets wrong:
 * - `getItem` returns `null` for missing *and* for unavailable. Callers never see the
 * difference, because a caller that has to distinguish them ends up with two code paths for
 * one outcome.
 * - Nothing throws. Safari private mode and an exceeded quota are ordinary conditions on the
 * web, and an unguarded write is a white screen for a real slice of users.
 * - `setItem` reports failure by returning `false`, so a caller that cares can react and one
 * that does not is unaffected.
 * - `keys()` and `clear()` are scoped to the application's `pl:` namespace. Browser storage is
 * one flat namespace shared with every script on the origin, and a driver that wiped it
 * wholesale would delete data that is not ours. Every key below therefore carries the real
 * prefix — a contract that tested unprefixed keys would be testing a namespace the
 * application never writes to.
 */

/** The application's storage namespace. Mirrors the `pl:` prefix in `STORAGE_KEYS`. */
const KEY = (name: string) => `pl:contract-${name}:v1`;
export function describeStorageDriverContract(
  name: string,
  createDriver: () => StorageDriver,
): void {
  describe(`StorageDriver contract: ${name}`, () => {
    let driver: StorageDriver;

    beforeEach(() => {
      driver = createDriver();
      driver.clear();
    });

    it('names itself, for the boot log and diagnostics', () => {
      expect(driver.name).toBeTypeOf('string');
      expect(driver.name.length).toBeGreaterThan(0);
    });

    it('returns null for a key that was never written', () => {
      expect(driver.getItem(KEY('absent'))).toBeNull();
    });

    it('round-trips a value', () => {
      const wrote = driver.setItem(KEY('key'), 'value');

      // A no-op driver legitimately reports false; what it must not do is claim success.
      if (wrote) {
        expect(driver.getItem(KEY('key'))).toBe('value');
      } else {
        expect(driver.getItem(KEY('key'))).toBeNull();
      }
    });

    it('overwrites rather than appending', () => {
      driver.setItem(KEY('key'), 'first');
      driver.setItem(KEY('key'), 'second');

      expect(driver.getItem(KEY('key'))).not.toBe('first');
    });

    it('removes a key, and removing a missing key is not an error', () => {
      driver.setItem(KEY('key'), 'value');
      driver.removeItem(KEY('key'));

      expect(driver.getItem(KEY('key'))).toBeNull();
      expect(() => driver.removeItem(KEY('never-existed'))).not.toThrow();
    });

    it('clear empties the store', () => {
      driver.setItem(KEY('a'), '1');
      driver.setItem(KEY('b'), '2');
      driver.clear();

      expect(driver.getItem(KEY('a'))).toBeNull();
      expect(driver.keys()).toEqual([]);
    });

    it('keys lists what was written and nothing else', () => {
      driver.setItem(KEY('a'), '1');
      driver.setItem(KEY('b'), '2');

      const keys = driver.keys();
      if (driver.getItem(KEY('a')) !== null) {
        expect(keys).toContain(KEY('a'));
        expect(keys).toContain(KEY('b'));
      }
      expect(keys).not.toContain(KEY('never-written'));
    });

    it('never throws — not on empty keys, huge values, or unicode', () => {
      expect(() => {
        driver.setItem('', 'empty key');
        driver.setItem(KEY('big'), 'x'.repeat(10_000));
        driver.setItem(KEY('unicode'), '🔒 café — “quoted”');
        driver.getItem('');
        driver.keys();
      }).not.toThrow();
    });

    it('stores strings verbatim, including ones that look like JSON', () => {
      // The envelope layer above serialises; the driver must not second-guess it by parsing
      // or re-encoding, or a round trip stops being lossless.
      const payload = '{"v":1,"d":{"theme":"dark"}}';
      if (driver.setItem(KEY('json'), payload)) {
        expect(driver.getItem(KEY('json'))).toBe(payload);
      }
    });
  });
}
