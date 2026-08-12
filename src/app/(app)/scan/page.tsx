import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Container, Heading, PageHeader, Section, Skeleton, Text } from '@/shared/ui';
import { requireSession } from '@/server/bootstrap';
import { ScanTabs } from './components/scan-tabs';
import { ShieldIcon, ClockIcon, DocumentIcon } from '@/shared/ui/icons';

export const metadata: Metadata = {
 title: 'Scan a document',
 description:
 'Paste a contract, lease or notice and see the clauses that cost you money, ranked by severity.',
};

/**
 * The gate, isolated in its own component.
 */
async function AuthGate() {
 await requireSession();
 return null;
}

export default function ScanPage() {
 return (
 <Container>
 <Section spacing="lg">
 <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10">
   <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 ring-1 ring-brand-primary/20 mb-6">
     <ScanIcon className="h-6 w-6 text-brand-primary" />
   </div>
   <Heading level={1} size="display-md" className="font-extrabold tracking-tight mb-4">
     Upload Document
   </Heading>
   <Text size="md" tone="secondary" className="font-medium leading-relaxed">
     Upload a file or paste a URL — AI decodes it instantly. We scan for hidden liabilities, renewal clauses, and critical risks.
   </Text>
 </div>

 <Suspense
 fallback={
 <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto items-center">
   <Skeleton className="h-12 w-80 rounded-full" />
   <Skeleton className="h-96 w-full rounded-[2rem]" />
 </div>
 }
 >
 <AuthGate />
 <div className="max-w-4xl mx-auto w-full">
   <ScanTabs />
 </div>
 </Suspense>

 <div className="mt-16 max-w-4xl mx-auto border-t border-border-subtle pt-10">
   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
     <div className="flex flex-col gap-2 text-center items-center">
       <div className="flex size-10 rounded-full bg-surface-2 items-center justify-center mb-2">
         <ShieldIcon className="size-5 text-brand-primary" />
       </div>
       <Heading level={3} size="sm">Bank-grade Security</Heading>
       <Text size="xs" tone="secondary">AES-256 encryption. Documents are immediately deleted after analysis.</Text>
     </div>
     <div className="flex flex-col gap-2 text-center items-center">
       <div className="flex size-10 rounded-full bg-surface-2 items-center justify-center mb-2">
         <ClockIcon className="size-5 text-brand-primary" />
       </div>
       <Heading level={3} size="sm">Instant Extraction</Heading>
       <Text size="xs" tone="secondary">Proprietary OCR engines parse text, images, and skewed PDFs in seconds.</Text>
     </div>
     <div className="flex flex-col gap-2 text-center items-center">
       <div className="flex size-10 rounded-full bg-surface-2 items-center justify-center mb-2">
         <DocumentIcon className="size-5 text-brand-primary" />
       </div>
       <Heading level={3} size="sm">Multi-format Support</Heading>
       <Text size="xs" tone="secondary">Process PDFs, DOCX, images, and raw URLs without changing workflows.</Text>
     </div>
   </div>
 </div>
 </Section>
 </Container>
 );
}

function ScanIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" x2="17" y1="12" y2="12" />
    </svg>
  );
}
