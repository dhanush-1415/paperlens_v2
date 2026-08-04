export type { Result, Ok, Err } from './result';
export {
  ok,
  err,
  isOk,
  isErr,
  map,
  mapErr,
  andThen,
  andThenAsync,
  unwrapOr,
  unwrapOrElse,
  unwrapOrThrow,
  match,
  all,
  partition,
} from './result';
