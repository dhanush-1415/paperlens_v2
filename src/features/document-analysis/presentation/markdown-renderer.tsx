'use client';

import Markdown from 'react-markdown';
import { DOCUMENT_TYPE_LABEL } from '../constants';
import { type AnalysisDto } from '../application/dto';

export function MarkdownRenderer({
  summary,
  analysis,
  urgency,
}: {
  summary: string;
  analysis: AnalysisDto;
  urgency: string;
}) {
  const content =
    summary.includes('- ') || summary.includes('* ')
      ? summary
      : `${summary}\n\n**Key Takeaways:**\n- The document type is classified as **${DOCUMENT_TYPE_LABEL[analysis.documentType]}**.\n- Detected **${analysis.flags.length}** specific clauses requiring review.\n- Authenticity signal indicates the document is **${analysis.legitimacy === 'SUSPICIOUS' ? 'Suspicious' : 'Standard'}**.\n- Priority level for this review is set to **${urgency.toUpperCase()}**.`;

  return (
    <Markdown
      components={{
        h3: ({ children }) => (
          <p className="mt-5 mb-2 flex items-center gap-2 text-[10px] font-bold tracking-widest text-brand-primary/80 uppercase">
            <span className="h-px flex-1 bg-brand-primary/20" />
            <span>{children}</span>
            <span className="h-px flex-1 bg-brand-primary/20" />
          </p>
        ),
        ul: ({ children }) => <ul className="mb-2 space-y-1 pl-3.5">{children}</ul>,
        li: ({ children }) => (
          <li className="flex list-none items-start gap-1.5">
            <span
              className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-text-primary/30"
              aria-hidden="true"
            />
            <span className="min-w-0 text-sm leading-relaxed text-text-secondary">{children}</span>
          </li>
        ),
        p: ({ children }) => (
          <p className="mb-3 text-sm leading-relaxed text-text-secondary">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-text-primary">{children}</strong>
        ),
      }}
    >
      {content}
    </Markdown>
  );
}
