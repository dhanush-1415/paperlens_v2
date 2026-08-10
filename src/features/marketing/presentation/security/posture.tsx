export interface SecurityPostureProps {
 contactEmail: string;
}

interface Entry {
 readonly title: string;
 readonly body: string;
}

const IN_PLACE: readonly Entry[] = [
 {
 title: 'Encrypted in transit and at rest',
 body: 'TLS for everything that crosses a network, including between our own services. Anything stored — a saved document, its analysis — is encrypted on disk.',
 },
 {
 title: 'Isolation enforced at the data layer',
 body: 'Which account may read which record is decided below the application, not by a check a page could forget to make. A bug in a route cannot serve one person’s document to another.',
 },
 {
 title: 'Least-privilege access',
 body: 'Production access is scoped to the people who need it for the job they are doing, granted for as long as they need it, and logged.',
 },
 {
 title: 'Dependencies watched',
 body: 'Third-party packages are pinned, scanned for known vulnerabilities on every build, and updated on a schedule rather than when something breaks.',
 },
];

const NOT_YET: readonly Entry[] = [
 {
 title: 'No SOC 2 report yet',
 body: 'We are a young product and have not completed an audit. If your procurement process requires one, tell us — knowing how many people are blocked on it is what decides when we start.',
 },
 {
 title: 'No HIPAA BAA',
 body: 'People do upload medical bills, and the analysis works. But we do not sign business associate agreements today, so PaperLens is not an appropriate place for a covered entity to process protected health information.',
 },
 {
 title: 'No published penetration test',
 body: 'Testing happens; a report you can read does not exist yet. When there is one worth publishing, it will be linked from this page rather than described on it.',
 },
];

function EntryList({ entries, highlightHover }: { entries: readonly Entry[], highlightHover?: 'safe' | 'caution' }) {
 return (
 <ul className="flex flex-col gap-4 mt-6">
 {entries.map((entry) => (
 <li 
 key={entry.title} 
 className={`flex flex-col gap-2 py-5 px-6 rounded-2xl bg-surface-2/40 border border-border-strong/50 transition-all duration-300 hover:shadow-md ${highlightHover === 'safe' ? 'hover:border-risk-safe/30 hover:bg-risk-safe/5' : 'hover:border-risk-caution/30 hover:bg-risk-caution/5'}`}
 >
 <h4 className="text-sm font-bold text-text-primary">
 {entry.title}
 </h4>
 <p className="text-sm text-text-secondary leading-relaxed">
 {entry.body}
 </p>
 </li>
 ))}
 </ul>
 );
}

export function SecurityPosture({ contactEmail }: SecurityPostureProps) {
 return (
 <section aria-labelledby="posture-heading" className="w-full py-24 relative bg-canvas">
 <div className="w-[95%] md:w-[90%] lg:w-[80%] mx-auto">
 <div className="flex flex-col gap-4 max-w-2xl mb-12">
 <span className="text-xs uppercase font-bold tracking-widest text-brand-primary">Posture</span>
 <h2 id="posture-heading" className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary">
 What is in place, and what is not
 </h2>
 <p className="text-sm md:text-base text-text-secondary leading-relaxed">
 The second list is the one worth reading. Every security page has the first.
 </p>
 </div>

 <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-start">
 <div className="flex flex-col p-8 rounded-3xl bg-surface-1/40 border border-border-strong/50 backdrop-blur-md shadow-sm relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-32 h-32 bg-risk-safe/10 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
 <h3 className="text-xs font-bold tracking-widest text-risk-safe uppercase">
 In place today
 </h3>
 <EntryList entries={IN_PLACE} highlightHover="safe" />
 </div>

 <div className="flex flex-col p-8 rounded-3xl bg-surface-1/40 border border-border-strong/50 backdrop-blur-md shadow-sm relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-32 h-32 bg-risk-caution/10 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
 <h3 className="text-xs font-bold tracking-widest text-risk-caution uppercase">
 Not yet
 </h3>
 <EntryList entries={NOT_YET} highlightHover="caution" />
 </div>
 </div>

 <div className="mt-12 flex flex-col gap-3 rounded-3xl border border-brand-primary/20 bg-gradient-to-br from-brand-primary/10 via-surface-1/50 to-transparent p-8 md:p-10 relative overflow-hidden shadow-sm">
 <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
 <h4 className="text-lg font-bold text-text-primary relative z-10">
 Found something?
 </h4>
 <p className="text-sm text-text-secondary leading-relaxed max-w-3xl relative z-10">
 Write to{' '}
 <a
 href={`mailto:${contactEmail}`}
 className="font-bold text-brand-primary hover:text-brand-primary-hover transition-colors"
 >
 {contactEmail}
 </a>{' '}
 with enough detail to reproduce it. We will confirm receipt, keep you updated while we
 fix it, and credit you if you want to be credited. We will not threaten you with a
 lawyer for telling us about a bug.
 </p>
 </div>
 </div>
 </section>
 );
}
