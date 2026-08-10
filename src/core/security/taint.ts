import 'server-only';

import { experimental_taintObjectReference, experimental_taintUniqueValue } from 'react';

/**
 * Data tainting (requirement 15).
 *
 * The failure this prevents: a Server Component fetches a full user record and passes it to
 * a Client Component that only renders the display name. Everything else on that object —
 * password hash, email, internal ids — is serialized into the RSC payload and readable in
 * the page source. Nothing errors. Nothing looks wrong.
 *
 * React's taint API turns that from a silent leak into a build-time crash. Marking an object
 * as tainted makes React throw if it ever crosses the server/client boundary.
 *
 * Two things to be honest about:
 *
 * 1. **Tainting is a safety net, not the design.** The design is the DTO mapper: fetch the
 * record, project it to exactly the fields the client needs, pass the projection. Taint
 * catches the case where someone forgets. It is not a licence to pass entities around.
 * 2. **It requires `experimental.taint: true`** in `next.config.ts`, which this project
 * enables. The API is experimental and the names say so; that is why every call is
 * funnelled through this file rather than sprinkled across features.
 *
 * The reference is held for the lifetime of the process for `taintUniqueValue`, so it takes
 * a `lifetime` object — when that object is garbage collected, the taint is released. Pass
 * the record the value came from.
 */

/**
 * The taint API exists only where there is a boundary to protect.
 *
 * React exports `experimental_taintObjectReference` under the `react-server` condition — the
 * RSC runtime, which is the only place an object can be serialised across to a client. In the
 * browser build, and in a unit test running under jsdom, the export is simply absent: there is
 * no boundary, so there is nothing to mark.
 *
 * Resolving it once here, behind a guard, means calling `taintEntity` is safe from any
 * environment and its protection is still real in the one environment that matters. The
 * alternative — an unguarded call — makes every repository unit-testable only under a full RSC
 * runtime, which is a high price for a safety net.
 */
const taintObject: typeof experimental_taintObjectReference | undefined =
 typeof experimental_taintObjectReference === 'function'
 ? experimental_taintObjectReference
 : undefined;

const taintValue: typeof experimental_taintUniqueValue | undefined =
 typeof experimental_taintUniqueValue === 'function' ? experimental_taintUniqueValue : undefined;

/**
 * Forbid an entire object from reaching the client.
 *
 * Use on every raw row or upstream response the moment it enters the application. The
 * message is shown to the developer in the error overlay, so it should say what to do, not
 * what went wrong.
 */
export function taintEntity<T extends object>(entity: T, name: string): T {
 taintObject?.(
 `${name} must not be passed to a Client Component. Map it to a DTO in the feature's ` +
 'application layer and pass that instead.',
 entity,
 );
 return entity;
}

/**
 * Forbid a specific scalar from reaching the client.
 *
 * For values that are legitimately extracted from a tainted object and then must not travel
 * — an API key, a session token, an internal id. Object tainting does not cover these,
 * because reading a property produces a fresh, untainted string.
 */
export function taintSecret(value: string, name: string, lifetime: object): string {
 // Empty strings are skipped: React throws on tainting a value that could collide with
 // another (a poisoned empty string would make every empty string in the app un-passable).
 if (value.length === 0) return value;

 taintValue?.(`${name} is a secret and must never reach the client.`, lifetime, value);
 return value;
}

/**
 * Taint a whole record and its listed secret fields in one call.
 *
 * The common shape at a data-source boundary: the row itself must not travel, and two or
 * three of its fields must not travel even if extracted.
 */
export function taintRecord<T extends object>(
 record: T,
 name: string,
 secretFields: readonly (keyof T)[] = [],
): T {
 taintEntity(record, name);

 for (const field of secretFields) {
 const value = record[field];
 if (typeof value === 'string') {
 taintSecret(value, `${name}.${String(field)}`, record);
 }
 }

 return record;
}
