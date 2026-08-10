import { Container, LoadingState } from '@/shared/ui';

/**
 * The root Suspense fallback (requirement 28).
 *
 * `loading.tsx` is sugar for wrapping the segment's children in `<Suspense>`, and with
 * `cacheComponents: true` that boundary is load-bearing rather than cosmetic: it is the seam
 * between the part of the page Next can prerender into a static shell and the part it must
 * stream per request. The shell — document, fonts, theme, navigation — reaches the browser
 * immediately; whatever is still resolving swaps in here.
 *
 * ### Why it is this plain
 *
 * A root fallback appears for every route that has no closer one, so it cannot assume any
 * particular page's shape. A skeleton that mimics a dashboard is wrong on a marketing page
 * and worse than a spinner — a layout that shifts twice reads as a broken page. Route
 * groups add their own `loading.tsx` with a skeleton that actually matches; this one is the
 * floor, not the pattern.
 *
 * `LoadingState` renders an ARIA live region with the label as its text, which is what makes
 * this announce to a screen reader. A bare spinner with no text announces nothing, and the
 * user is told the page is finished when it is not.
 */
export default function Loading() {
 return (
 <Container as="main" className="flex flex-1 flex-col justify-center py-24">
 <LoadingState label="Loading" />
 </Container>
 );
}
