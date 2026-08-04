/**
 * Stands in for `server-only` and `client-only` under Vitest.
 *
 * Both packages work by *failing to resolve*: `server-only` has no browser export, so
 * importing it from a Client Component is a build error. That is exactly the right mechanism
 * in a bundler and exactly the wrong one in a unit test, where importing a server module into
 * Node is the point of the exercise.
 *
 * Aliasing them to this empty module removes the guard for tests only. The guard still fires
 * in `next build`, which is the build that ships — see the alias block in `vitest.config.ts`.
 */
export {};
