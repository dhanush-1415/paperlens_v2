interface Moment {
 readonly when: string;
 readonly title: string;
 readonly body: string;
}

const MOMENTS: readonly Moment[] = [
 {
 when: 'On the way',
 title: 'It travels encrypted',
 body: 'The upload runs over TLS from your browser to our servers. Nobody on the network in between — your café’s wifi, your employer’s proxy, your ISP — sees the contents of the file.',
 },
 {
 when: 'While it is read',
 title: 'It stays in memory',
 body: 'The text is extracted and analysed in the memory of the process handling your request. It is not written to a disk, a bucket or a table on the way through, and it is not copied anywhere for later.',
 },
 {
 when: 'When the analysis is done',
 title: 'It is discarded',
 body: 'The document and its extracted text go out of scope with the request. What you see on screen is the report; the source of it no longer exists on our side unless you asked us to keep it.',
 },
 {
 when: 'If you save it',
 title: 'It is stored under your account only',
 body: 'Saving is a choice you make per document. A saved document is encrypted at rest and readable only by the account that saved it — enforced at the data layer, so a bug in a page cannot serve one person’s document to another.',
 },
 {
 when: 'When you delete it',
 title: 'It is actually deleted',
 body: 'Not flagged as hidden and kept. The record is removed, and it drops out of backups as those age out on their normal cycle. Deleting your account deletes everything in it.',
 },
];

export function SecurityLifecycle() {
 return (
 <section aria-labelledby="lifecycle-heading" className="w-full py-24 relative overflow-hidden bg-surface-1/40 border-b border-border-strong/30">
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(var(--brand-primary-rgb),0.03),transparent_50%)] pointer-events-none" />

 <div className="w-[95%] md:w-[90%] lg:w-[80%] mx-auto relative z-10">
 <div className="flex flex-col gap-4 max-w-2xl mb-12">
 <span className="text-xs uppercase font-bold tracking-widest text-brand-primary">The life of a document</span>
 <h2 id="lifecycle-heading" className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary">
 Where your file is, at every moment
 </h2>
 <p className="text-sm md:text-base text-text-secondary leading-relaxed">
 The honest version of this answer is short, so here is the whole of it rather than a
 summary with a link to a policy.
 </p>
 </div>

 <ol className="flex flex-col relative before:absolute before:inset-y-0 before:left-[15px] before:w-px before:bg-gradient-to-b before:from-border-strong before:via-border-subtle before:to-transparent lg:before:hidden">
 {MOMENTS.map((moment, index) => (
 <li
 key={moment.title}
 className="grid gap-4 py-8 pl-12 lg:pl-0 lg:grid-cols-[14rem_1fr] lg:gap-12 relative group border-b border-border-subtle/50 last:border-0"
 >
 <div className="absolute left-0 top-10 lg:static lg:mt-1 flex items-center">
 <span
 aria-hidden
 className="absolute left-0 flex size-8 -translate-x-[15px] lg:translate-x-0 items-center justify-center rounded-full border border-border-strong bg-surface-raised text-xs font-bold text-text-primary shadow-sm group-hover:scale-110 group-hover:bg-brand-primary group-hover:text-canvas group-hover:border-brand-primary transition-all duration-300 z-10 lg:hidden"
 >
 {String(index + 1).padStart(2, '0')}
 </span>
 
 <p className="text-xs font-medium text-brand-primary/80 uppercase tracking-wider group-hover:text-brand-primary transition-colors hidden lg:block">
 {moment.when}
 </p>
 </div>
 
 <div className="flex flex-col gap-2">
 <p className="text-xs font-medium text-brand-primary/80 uppercase tracking-wider group-hover:text-brand-primary transition-colors lg:hidden block mb-1">
 {moment.when}
 </p>
 <h3 className="text-lg font-bold text-text-primary group-hover:text-brand-primary transition-colors">
 {moment.title}
 </h3>
 <p className="text-sm text-text-secondary leading-relaxed max-w-3xl">
 {moment.body}
 </p>
 </div>
 </li>
 ))}
 </ol>
 </div>
 </section>
 );
}
