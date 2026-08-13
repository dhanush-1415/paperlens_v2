'use client';

import Markdown from 'react-markdown';
import { DOCUMENT_TYPE_LABEL } from '../constants';
import { type AnalysisDto } from '../application/dto';

export function MarkdownRenderer({ 
  summary, 
  analysis, 
  urgency 
}: { 
  summary: string;
  analysis: AnalysisDto;
  urgency: string;
}) {
  const content = summary.includes('- ') || summary.includes('* ') 
    ? summary 
    : `${summary}\n\n**Key Takeaways:**\n- The document type is classified as **${DOCUMENT_TYPE_LABEL[analysis.documentType]}**.\n- Detected **${analysis.flags.length}** specific clauses requiring review.\n- Priority level for this review is set to **${urgency.toUpperCase()}**.`;

  return (
    <Markdown
      components={{
        h3: ({ children }) => (
          <p className="mt-4 mb-1.5 first:mt-0 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="space-y-1 mt-1.5 mb-3">{children}</ul>
        ),
        li: ({ children }) => (
          <li className="flex items-start gap-2">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-text-tertiary/60" aria-hidden="true" />
            <span className="text-sm text-text-secondary leading-relaxed">{children}</span>
          </li>
        ),
        p: ({ children }) => (
          <p className="text-sm leading-relaxed text-text-secondary mb-3">{children}</p>
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
