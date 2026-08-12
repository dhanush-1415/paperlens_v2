import type { Metadata } from 'next';
import { Heading, Text } from '@/shared/ui';
import { OmniDropzone } from './components/omni-dropzone';

export const metadata: Metadata = {
 title: 'Scan a document',
 description:
 'Paste a contract, lease or notice and see the clauses that cost you money, ranked by severity.',
};

export default function ScanPage() {
 return (
 <div className="flex flex-col w-full min-h-[calc(100vh-80px)] px-4 md:px-8 py-8 bg-canvas">
 <div className="flex-1 flex flex-col w-full mx-auto">
 <div className="flex flex-col mb-4">
   <Heading level={1} size="display-md" className="font-geist font-extrabold tracking-tight text-text-primary mb-3">
     Scan & Analyze
   </Heading>
   <Text size="md" tone="secondary" className="font-inter max-w-2xl leading-relaxed">
     Upload any contract, audio log, or URL. PaperLens automatically routes and analyzes your data.
   </Text>
 </div>

 <div className="flex-1 w-full h-full mt-4">
   <OmniDropzone />
 </div>

 </div>
 </div>
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
