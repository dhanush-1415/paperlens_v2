import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/shared/ui';

import { MarketingPageIntro } from '@/features/marketing';
import { DocumentIcon } from '@/shared/ui/icons';
import { ShieldIcon, ClockIcon, CheckCircleIcon } from '@/shared/ui/icons';

export const metadata: Metadata = {
  title: 'Supported Formats',
  description:
    'Upload your contracts, code, images, audio clips, or URLs. If it has text, PaperLens can analyze it.',
  alternates: { canonical: '/supported-formats' },
};

const FORMAT_CATEGORIES = [
  {
    title: 'Documents & Contracts',
    description:
      'Natively parsed on the server with perfect accuracy, maintaining the exact document structure.',
    formats: ['.pdf', '.docx', '.rtf', '.md', '.txt', '.csv', '.tsv', '.xlsx', '.xls', '.json'],
  },
  {
    title: 'Images & Photos',
    description:
      'Powered by Gemini 1.5 Flash Multimodal Vision. We automatically OCR and extract text from images and screenshots.',
    formats: ['.jpeg', '.jpg', '.png', '.webp', '.heic', '.heif', '.gif', '.bmp', '.tiff'],
  },
  {
    title: 'Audio & Video',
    description:
      'Natively transcribed into high-quality text for immediate risk analysis and conversational Q&A.',
    formats: [
      '.mp3',
      '.wav',
      '.m4a',
      '.aac',
      '.ogg',
      '.flac',
      '.webm',
      '.opus',
      '.mp4',
      '.mov',
      '.avi',
      '.mkv',
    ],
  },
  {
    title: 'Code & Scripts',
    description:
      'Any plain text or code file is natively read as UTF-8. Analyze software licenses or technical architecture docs directly.',
    formats: [
      '.js',
      '.ts',
      '.css',
      '.html',
      '.py',
      '.go',
      '.rs',
      '.java',
      '.cpp',
      '.cs',
      '.php',
      '.rb',
      '.swift',
      '.kt',
      '.sh',
      '.sql',
    ],
  },
  {
    title: 'Configs & Logs',
    description:
      'We can parse server logs, environment configurations, and data interchange formats to instantly find anomalies.',
    formats: ['.xml', '.yml', '.yaml', '.toml', '.ini', '.conf', '.env', '.log'],
  },
  {
    title: 'Live URLs',
    description:
      'Paste any public URL. We securely scrape the raw HTML, strip away the noise, and extract the pure readable content.',
    formats: ['https://...', 'http://...'],
  },
];

export default function SupportedFormatsPage() {
  return (
    <>
      <MarketingPageIntro
        eyebrow="Supported Formats"
        heading="Any document. Any format. Any URL."
        lede="We believe you shouldn't have to convert your files just to get an analysis. From complex enterprise PDFs to screenshots of a contract, if it contains information, PaperLens understands it."
      />

      <section className="mx-auto max-w-4xl px-6 py-24 sm:px-8 sm:py-32">
        <div className="flex flex-col gap-16">
          {FORMAT_CATEGORIES.map((category) => (
            <div key={category.title} className="flex flex-col gap-6">
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-text-primary">
                  {category.title}
                </h3>
                <p className="mt-2 text-lg leading-relaxed text-text-secondary">
                  {category.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {category.formats.map((ext) => (
                  <span
                    key={ext}
                    className="bg-surface-3 inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium text-text-primary shadow-sm ring-1 ring-border-subtle"
                  >
                    {ext}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border-subtle bg-surface-1 px-6 py-24 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <DocumentIcon className="text-primary mx-auto size-12" />
          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-text-primary">
            Ready to test our pipeline?
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Drag and drop literally any file from your desktop into the scanner. We handle the
            routing automatically.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button variant="premium" size="lg" className="rounded-full px-8" asChild>
              <Link href="/scan">Go to Scanner</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
