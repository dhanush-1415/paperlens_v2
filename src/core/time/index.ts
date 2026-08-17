/**
 * Time — public API.
 *
 * The container's `CLOCK` token resolves to a {@link Clock}. Application code should never
 * import from here: it resolves the token instead. The exceptions are the two composition
 * roots, which must name the production implementation once, and tests, which name a fake.
 */

export {
  epochMillis,
  fixedClock,
  manualClock,
  offsetClock,
  systemClock,
  type Clock,
  type EpochClock,
  type ManualClock,
} from './clock';
