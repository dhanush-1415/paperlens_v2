/**
 * `/how-it-works`, in three sections.
 *
 * Sequence, then anatomy, then limits — the order matters. A reader who has just been told what
 * the software does is at the peak of their optimism about it, and that is the moment to say
 * precisely what it does not do. Putting the limits last would make them a postscript nobody
 * reaches; putting them first would answer an objection the reader has not formed yet.
 *
 * All three are Server Components. This route ships no JavaScript of its own.
 */

export { HowItWorksAnatomy } from './anatomy';
export { HowItWorksLimits } from './limits';
export { HowItWorksPipeline } from './pipeline';
