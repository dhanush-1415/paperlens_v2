import { CheckIcon } from '@/shared/ui';

interface Stage {
 readonly title: string;
 readonly body: string;
 readonly details: readonly string[];
}

const STAGES: readonly Stage[] = [
 {
 title: 'Give it the document',
 body: 'However it reached you. A PDF from an email, a photograph of a letter taken on a kitchen table at an angle, a page pasted out of a portal that would not let you download anything.',
 details: [
 'PDF, Word, images, or text pasted straight in',
 'Phone photos, including the badly lit ones',
 'Scans and faxes, where the text is an image of text',
 'No account, and nothing to install',
 ],
 },
 {
 title: 'It reads the whole thing',
 body: 'Not the first page, and not a summary of a summary. Every clause is read in the context of every other clause, which is what makes it possible to notice that the notice period on page nine contradicts the term on page one.',
 details: [
 'Optical character recognition on scans and photographs',
 'Cross-references resolved — a clause that points at a schedule is read with it',
 'Dates, amounts and durations extracted as values, not as words',
 ],
 },
 {
 title: 'You get it back in order of what it costs you',
 body: 'The report is not the document rearranged. It leads with the clause that has the largest consequence, and each finding carries the exact passage it came from so you can check the work in one glance.',
 details: [
 'Every finding paired with its source passage',
 'Risk level on each: critical, caution, or ordinary',
 'Deadlines as real dates, with the notice period worked backwards',
 'What to do next, in one sentence per finding',
 ],
 },
 {
 title: 'Ask it the question you actually have',
 body: '“Can they raise the rent mid-term?” is not a search query, and it is the question people actually have. Follow-ups are answered in plain English and cite the clause the answer rests on.',
 details: [
 'Answers quote the document rather than paraphrasing it',
 'It says so when the document does not answer the question',
 'The conversation stays with the document it is about',
 ],
 },
 {
 title: 'Keep it, or let it go',
 body: 'Documents are deleted after analysis unless you say otherwise. Saving one is a decision you make per document, and un-saving it deletes it — there is no archive of things you thought you had removed.',
 details: [
 'Deleted after analysis by default',
 'Never used to train a model, in any tier',
 'Saved history on paid plans, searchable and deletable',
 ],
 },
];

export function HowItWorksPipeline() {
 return (
 <section aria-labelledby="pipeline-heading" className="w-full py-24 relative bg-canvas">
 <div className="w-[95%] md:w-[90%] lg:w-[80%] mx-auto">
 <div className="flex flex-col gap-4 max-w-2xl mb-16">
 <span className="text-xs uppercase font-bold tracking-widest text-brand-primary">The sequence</span>
 <h2 id="pipeline-heading" className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary">
 Five stages, and you are present for one of them
 </h2>
 </div>

 <ol className="flex flex-col relative before:absolute before:inset-y-0 before:left-[15px] before:w-px before:bg-gradient-to-b before:from-border-strong before:via-border-subtle before:to-transparent">
 {STAGES.map((stage, index) => (
 <li
 key={stage.title}
 className="relative pl-12 pb-16 last:pb-0 group"
 >
 <span
 aria-hidden
 className="absolute left-0 top-0 flex size-8 items-center justify-center rounded-full border border-border-strong bg-surface-raised text-xs font-bold text-text-primary shadow-sm group-hover:scale-110 group-hover:bg-brand-primary group-hover:text-canvas group-hover:border-brand-primary transition-all duration-300 z-10"
 >
 {String(index + 1).padStart(2, '0')}
 </span>

 <div className="flex flex-col gap-4 bg-surface-1/40 border border-border-subtle backdrop-blur-xl p-8 rounded-3xl shadow-sm transition-all duration-300 hover:shadow-xl hover:border-brand-primary/30 max-w-4xl relative overflow-hidden">
 <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
 
 <h3 className="text-xl font-bold text-text-primary">
 {stage.title}
 </h3>
 <p className="text-sm text-text-secondary leading-relaxed">
 {stage.body}
 </p>

 <ul className="flex flex-col gap-2.5 mt-2 border-t border-border-subtle pt-4">
 {stage.details.map((detail) => (
 <li key={detail} className="flex gap-3 items-start">
 <CheckIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-risk-safe" />
 <span className="text-sm text-text-secondary">{detail}</span>
 </li>
 ))}
 </ul>
 </div>
 </li>
 ))}
 </ol>
 </div>
 </section>
 );
}
