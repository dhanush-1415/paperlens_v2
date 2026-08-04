import { describe, expect, it } from 'vitest';

import { Container } from './container';
import { token } from './token';

/**
 * The container is the seam every other claim in this architecture rests on. "Adapters are
 * swappable" is only true if `override()` really replaces a binding *and* discards whatever
 * was already built from it; "there is one instance" is only true if `singleton` survives
 * scoping. Those two properties are what these tests pin down — the rest is bookkeeping.
 */

interface Greeter {
  greet(): string;
}

const GREETER = token<Greeter>('test.greeter');
const COUNTER = token<{ id: number }>('test.counter');

describe('registration', () => {
  it('resolves a registered factory', () => {
    const container = new Container('test');
    container.register(GREETER, () => ({ greet: () => 'hello' }));

    expect(container.resolve(GREETER).greet()).toBe('hello');
  });

  it('refuses a duplicate registration rather than silently winning last', () => {
    const container = new Container('test');
    container.register(GREETER, () => ({ greet: () => 'a' }));

    expect(() => container.register(GREETER, () => ({ greet: () => 'b' }))).toThrowError(
      /already registered/i,
    );
  });

  it('throws CONFIGURATION_ERROR for an unregistered token', () => {
    expect(() => new Container('test').resolve(GREETER)).toThrowError(/No provider registered/);
  });

  it('registerValue binds an already-built instance', () => {
    const container = new Container('test');
    const instance: Greeter = { greet: () => 'value' };
    container.registerValue(GREETER, instance);

    expect(container.resolve(GREETER)).toBe(instance);
  });

  it('reports what is bound, for the boot log', () => {
    const container = new Container('test');
    container.register(GREETER, () => ({ greet: () => '' }));

    expect(container.registrations()).toContain('test.greeter');
  });
});

describe('lifetimes', () => {
  it('singleton builds once', () => {
    const container = new Container('test');
    let built = 0;
    container.register(COUNTER, () => ({ id: ++built }), 'singleton');

    expect(container.resolve(COUNTER)).toBe(container.resolve(COUNTER));
    expect(built).toBe(1);
  });

  it('transient builds every time', () => {
    const container = new Container('test');
    let built = 0;
    container.register(COUNTER, () => ({ id: ++built }), 'transient');

    expect(container.resolve(COUNTER)).not.toBe(container.resolve(COUNTER));
    expect(built).toBe(2);
  });

  it('scoped gives one instance per scope and singletons stay shared', () => {
    const root = new Container('root');
    root.register(COUNTER, () => ({ id: 1 }), 'scoped');
    root.register(GREETER, () => ({ greet: () => 'shared' }), 'singleton');

    const a = root.createScope('request-a');
    const b = root.createScope('request-b');

    // Scoped: a fresh instance per scope — this is what makes a per-request service safe.
    expect(a.resolve(COUNTER)).not.toBe(b.resolve(COUNTER));
    expect(a.resolve(COUNTER)).toBe(a.resolve(COUNTER));

    // Singleton: resolved through the parent, so both scopes see the same object.
    expect(a.resolve(GREETER)).toBe(b.resolve(GREETER));
  });

  it('reset drops instances but keeps registrations', () => {
    const container = new Container('test');
    let built = 0;
    container.register(COUNTER, () => ({ id: ++built }));

    container.resolve(COUNTER);
    container.reset();
    container.resolve(COUNTER);

    expect(built).toBe(2);
    expect(container.has(COUNTER)).toBe(true);
  });
});

describe('override — the swap seam', () => {
  it('replaces a binding and discards the instance already built from it', () => {
    const container = new Container('test');
    container.register(GREETER, () => ({ greet: () => 'real' }));

    // Resolved *before* the override, so a cached instance exists to be invalidated.
    expect(container.resolve(GREETER).greet()).toBe('real');

    container.override(GREETER, () => ({ greet: () => 'fake' }));

    expect(container.resolve(GREETER).greet()).toBe('fake');
  });

  it('returns a restore thunk that puts the original binding and instance back', () => {
    const container = new Container('test');
    container.register(GREETER, () => ({ greet: () => 'real' }));
    const original = container.resolve(GREETER);

    const restore = container.override(GREETER, () => ({ greet: () => 'fake' }));
    container.resolve(GREETER);
    restore();

    expect(container.resolve(GREETER)).toBe(original);
  });

  it('restores to "unregistered" when the token was not bound before', () => {
    const container = new Container('test');
    const restore = container.override(GREETER, () => ({ greet: () => 'fake' }));

    expect(container.resolve(GREETER).greet()).toBe('fake');
    restore();
    expect(() => container.resolve(GREETER)).toThrowError(/No provider registered/);
  });

  it('a consumer written against the token sees the swap with no call-site change', () => {
    // The whole abstraction claim, reduced to an assertion: this function is written once,
    // against the token, and never learns which implementation answered.
    const consumer = (c: Container) => `<${c.resolve(GREETER).greet()}>`;

    const container = new Container('test');
    container.register(GREETER, () => ({ greet: () => 'production' }));
    expect(consumer(container)).toBe('<production>');

    container.override(GREETER, () => ({ greet: () => 'stub' }));
    expect(consumer(container)).toBe('<stub>');
  });
});

describe('hierarchy', () => {
  it('falls through to the parent, and a child binding wins', () => {
    const root = new Container('root');
    root.register(GREETER, () => ({ greet: () => 'parent' }));

    const child = root.createScope('child');
    expect(child.resolve(GREETER).greet()).toBe('parent');
    expect(child.has(GREETER)).toBe(true);

    child.register(GREETER, () => ({ greet: () => 'child' }));
    expect(child.resolve(GREETER).greet()).toBe('child');
    expect(root.resolve(GREETER).greet()).toBe('parent');
  });

  it('resolveOptional returns undefined instead of throwing', () => {
    expect(new Container('test').resolveOptional(GREETER)).toBeUndefined();
  });
});

describe('cycle detection', () => {
  it('fails loudly instead of overflowing the stack', () => {
    const A = token<string>('test.a');
    const B = token<string>('test.b');

    const container = new Container('test');
    container.register(A, (c) => `a:${c.resolve(B)}`);
    container.register(B, (c) => `b:${c.resolve(A)}`);

    expect(() => container.resolve(A)).toThrowError(/Dependency cycle/);
  });

  it('does not mistake a diamond for a cycle', () => {
    const LEAF = token<string>('test.leaf');
    const LEFT = token<string>('test.left');
    const RIGHT = token<string>('test.right');
    const TOP = token<string>('test.top');

    const container = new Container('test');
    container.register(LEAF, () => 'leaf');
    container.register(LEFT, (c) => `L(${c.resolve(LEAF)})`);
    container.register(RIGHT, (c) => `R(${c.resolve(LEAF)})`);
    container.register(TOP, (c) => `${c.resolve(LEFT)}+${c.resolve(RIGHT)}`);

    expect(container.resolve(TOP)).toBe('L(leaf)+R(leaf)');
  });
});
