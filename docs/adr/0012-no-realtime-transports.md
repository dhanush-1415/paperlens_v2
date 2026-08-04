# 0012 — Request/response only; no WebSockets, SSE or subscriptions

**Status:** Accepted
**Constraint origin:** Explicit product requirement, not an inference.

## Context

Realtime transports are close at hand. Supabase ships `postgres_changes` subscriptions in the
same client as its query API; Next supports streaming responses; SSE is a dozen lines. The
usual path is that one screen gets a subscription "because it is easy", and within a quarter
the app has a connection lifecycle to manage, a reconnect-and-backfill problem, and a class of
bug that only reproduces when a socket drops mid-mutation.

The requirement here was stated directly: **no realtime APIs.**

## Decision

Every transport in the codebase is request/response. Concretely:

- `core/http` exposes `HttpClient` — `fetch` with an interceptor pipeline, timeout, bounded
  retry with backoff, correlation-id propagation and Zod response parsing. It has no
  `subscribe`, no `stream`, no `EventSource`.
- No port anywhere accepts a callback that fires more than once. A repository method returns
  a `Promise<Result<T, AppError>>`, exactly one value, exactly once. This is the constraint
  encoded structurally rather than written on a wiki.
- Freshness is a **cache** concern, not a transport concern: `cacheLife` profiles decide how
  stale a value may be, `cacheTag` + `revalidateTag`/`updateTag` invalidate on write. A
  mutation revalidates its own tags, so the next read is correct without anything being
  pushed.
- `connect-src` in the CSP is `'self'` only. In development `ws:` is allowed — that is the
  Next dev-server HMR socket, not application traffic, and it is absent in production. The
  policy is therefore the enforcement mechanism, not just documentation: an application
  WebSocket would be blocked by the browser.
- `core/network` monitors connectivity via `navigator.onLine` and the Network Information API.
  It observes the connection; it does not hold one open.

## Alternatives considered

**Realtime where it genuinely helps** (e.g. an analysis-progress indicator). This is the real
alternative and it has real merit — a long analysis with no progress feedback is a worse
experience. Rejected because it was excluded by requirement, and because the same need is met
by polling a status endpoint with a bounded interval, which is one `HttpClient` call and no
new architecture.

**Server-Sent Events instead of WebSockets.** Cheaper, unidirectional, works over plain HTTP.
Still a long-lived connection with a lifecycle, still excluded, and still incompatible with
serving from a CDN edge cache.

**Streaming a Server Component's response.** Worth distinguishing, because the app *does* do
this and it is not what the constraint prohibits. PPR streams a single HTTP response as its
pieces resolve, then the response ends. That is one request, one response, delivered
progressively. The constraint is about *persistent* connections that push server-initiated
updates.

**Deciding later.** Rejected: the cost of a realtime transport is not the code that opens it,
it is every assumption downstream that quietly starts depending on data arriving unprompted.
Encoding "one value, once" in the port signatures now is what makes the constraint hold
without anyone policing it.

## Consequences

- Simpler operationally: no connection pool, no sticky sessions, no reconnect-and-backfill,
  no fan-out at scale. Every response is cacheable by a CDN because every response is a
  complete answer to a complete question.
- Compatible with static shells and PPR. A page holding a socket open cannot be served from
  an edge cache; a page that fetches cannot help but be.
- The whole test suite is deterministic. No test waits for a socket, and no test is flaky
  because a subscription fired twice.
- **Cost, stated plainly:** data is as fresh as its `cacheLife` profile and its invalidation
  tags allow. Where a user needs to see change without acting, the answer is polling with a
  visible refresh affordance, not a push. For this product — a user pastes a document and
  reads the analysis of it — nothing changes without the user causing it, so the cost is
  close to zero. That would not be true of a collaborative editor, and if the product moves
  that way this ADR gets superseded rather than quietly violated.

Related: [0004](0004-framework-native-caching.md) (what replaces push: tags and profiles),
[0007](0007-provider-agnostic-ports.md) (the ports whose signatures encode this).
