import type { Metadata } from 'next';
import { legalMetadata, LegalPage } from '../_legal';

export const metadata: Metadata = {
 title: 'Terms of Service – PaperLens',
 description: 'Legal terms governing the use of PaperLens platform.',
 alternates: { canonical: '/terms' },
};

export default function TermsPage() {
 return <LegalPage slug="terms" />;
}
