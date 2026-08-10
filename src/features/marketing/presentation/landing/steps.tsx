/**
 * Three steps.
 *
 * Not a "how it works" page — that route exists and goes deeper. This is the compressed version
 * whose only job is to remove the suspicion that there is a catch: an upload flow with six
 * screens, a credit card at step two, a wait measured in hours.
 *
 * ### The numbers
 *
 * Rendered from the array index and marked `aria-hidden`, for the same reason the legal sections
 * are numbered in the rendering: a screen reader announcing "one Give it the document" is worse
 * than the heading alone, and an ordered list already carries the sequence.
 */

import { Container, Heading, Section, Text } from '@/shared/ui';

interface Step {
 readonly title: string;
 readonly body: string;
}

const STEPS: readonly Step[] = [
 {
 title: 'Give it the document',
 body: 'Paste the text, drop the PDF, or photograph the letter. No account, and nothing to configure before you see a result.',
 },
 {
 title: 'It reads every clause',
 body: 'Fees, penalties, renewal traps, notice periods and dates — each one paired with the exact passage it came from, so you can check the work.',
 },
 {
 title: 'Ask it anything',
 body: 'Follow up in plain English. "Can they raise the rent mid-term?" gets an answer and the clause it rests on, not a summary of the summary.',
 },
];

export function LandingSteps() {
 return (
 <Section spacing="lg" divider surface="raised">
 <Container width="shell">
 <Heading level={2} size="eyebrow">
 How it works
 </Heading>

 <ol className="mt-8 grid gap-8 md:grid-cols-3 md:gap-10">
 {STEPS.map((step, index) => (
 <li key={step.title} className="flex flex-col gap-3">
 <span aria-hidden className="tabular text-2xs text-text-tertiary">
 {String(index + 1).padStart(2, '0')}
 </span>
 <Heading level={3} size="sm">
 {step.title}
 </Heading>
 <Text size="sm" tone="secondary" editorial>
 {step.body}
 </Text>
 </li>
 ))}
 </ol>
 </Container>
 </Section>
 );
}
