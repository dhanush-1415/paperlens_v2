import type { Metadata } from 'next';
import { legalMetadata, LegalPage } from '../_legal';

export const metadata: Metadata = {
 title: 'Privacy Policy – PaperLens',
 description: 'How PaperLens collects, uses, and protects your data.',
 alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
 return <LegalPage slug="privacy" />;
}
