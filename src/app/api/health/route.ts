import { appConfig } from '@/config';
import { CLOCK } from '@/core/container';
import { CONTENT_TYPES, HTTP_HEADERS } from '@/shared/constants';
import { getServerContainer, route } from '@/server/bootstrap';

/**
 * Liveness probe.
 *
 * Three consumers, all of which want the same cheap answer:
 *
 * 1. **The browser network monitor.** `createBrowserNetworkMonitor` probes this URL to
 *    distinguish "the device has no connection" from "the connection is up but our server
 *    is not answering" — a distinction `navigator.onLine` cannot make, since it reports the
 *    state of the network interface and nothing else. Same-origin on purpose: probing a
 *    third party tells you the internet is up, which is not the question.
 * 2. **The platform's health check**, whatever it turns out to be.
 * 3. **A human**, checking a deployment shipped the commit they think it did.
 *
 * ### What it deliberately does not do
 *
 * No database ping, no upstream call, no session check. A liveness probe that depends on a
 * downstream service reports *that* service's health, so a slow database takes the whole
 * fleet out of rotation and turns a degradation into an outage. Readiness — "should this
 * instance receive traffic" — is a different endpoint with different semantics, and it does
 * not exist yet because there is nothing downstream to be ready for.
 *
 * It also returns nothing an unauthenticated caller should not see. The environment name and
 * the commit SHA are already in the client bundle via `NEXT_PUBLIC_*`; the response adds no
 * new disclosure.
 *
 * ### Why there is no `export const dynamic`
 *
 * `cacheComponents` rejects the route segment config entirely — the build fails with
 * "not compatible with `nextConfig.cacheComponents`". It is not needed: under that model a
 * handler is dynamic unless it opts *in* with `use cache`, so the default is already what
 * `force-dynamic` used to buy. The `no-store` response header below is the part that
 * actually matters, and it survives whatever the framework decides about prerendering.
 */
export const GET = route('health.get', async () => {
  const clock = getServerContainer().resolve(CLOCK);

  return Response.json(
    {
      status: 'ok',
      environment: appConfig.environment,
      commit: appConfig.commitSha,
      time: clock().toISOString(),
    },
    {
      headers: {
        [HTTP_HEADERS.contentType]: CONTENT_TYPES.json,
        /**
         * Never cached, anywhere. A cached health check is a lie told at line rate: the
         * probe would keep reporting `ok` from a CDN long after the instance behind it
         * stopped answering.
         */
        [HTTP_HEADERS.cacheControl]: 'no-store, max-age=0',
      },
    },
  );
});
