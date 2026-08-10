import { CheckIcon } from '@/shared/ui';

interface Commitment {
 readonly title: string;
 readonly body: string;
}

const COMMITMENTS: readonly Commitment[] = [
 {
 title: 'Never used to train a model',
 body: 'Not ours, and not anyone else’s. Where analysis runs through a third-party model provider, it runs under terms that prohibit training on the content — and if that ever stops being true of a provider, we change the provider rather than the sentence.',
 },
 {
 title: 'Never sold, never shared, never brokered',
 body: 'Your documents and what is in them are not a data product. There is no advertising business here to feed, and no arrangement under which a third party receives your content in exchange for anything.',
 },
 {
 title: 'Not read by us',
 body: 'No one here browses documents. Access to production data is restricted, and the rare case where a person needs to look at something to fix a fault requires your explicit permission first — asked for at the time, about that document.',
 },
 {
 title: 'No dark patterns on the way out',
 body: 'Deleting a document takes one action. Closing an account takes one action and does not require an email to support, a phone call, or a page that asks four times whether you are sure.',
 },
];

export function SecurityCommitments() {
 return (
 <section aria-labelledby="commitments-heading" className="w-full py-24 relative overflow-hidden bg-surface-1/40 border-y border-border-strong/30">
 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(var(--risk-safe-rgb),0.05),transparent_70%)] pointer-events-none" />

 <div className="w-[95%] md:w-[90%] lg:w-[80%] mx-auto relative z-10">
 <div className="flex flex-col gap-4 max-w-2xl mb-12">
 <span className="text-xs uppercase font-bold tracking-widest text-risk-safe">Commitments</span>
 <h2 id="commitments-heading" className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary">
 Four promises we could be caught breaking
 </h2>
 <p className="text-sm md:text-base text-text-secondary leading-relaxed">
 Which is the only kind worth printing. Each of these is a statement of fact about how
 the product operates, not an aspiration about how we feel.
 </p>
 </div>

 <ul className="grid gap-6 md:grid-cols-2 lg:gap-8">
 {COMMITMENTS.map((commitment) => (
 <li
 key={commitment.title}
 className="flex gap-5 p-8 rounded-3xl bg-surface-1/40 border border-border-strong/50 backdrop-blur-md shadow-sm transition-all duration-300 hover:shadow-lg hover:border-risk-safe/30 hover:-translate-y-1 group"
 >
 <span
 aria-hidden
 className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full border border-risk-safe/20 bg-risk-safe/10 text-risk-safe group-hover:scale-110 transition-transform"
 >
 <CheckIcon className="size-5" />
 </span>
 <div className="flex min-w-0 flex-col gap-2">
 <h3 className="text-lg font-bold text-text-primary">
 {commitment.title}
 </h3>
 <p className="text-sm text-text-secondary leading-relaxed">
 {commitment.body}
 </p>
 </div>
 </li>
 ))}
 </ul>
 </div>
 </section>
 );
}
