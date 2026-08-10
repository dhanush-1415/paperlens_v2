import type { Metadata } from 'next';

import { legalMetadata, LegalPage } from '../_legal';

export const metadata: Metadata = {
 title: 'Cookie Policy – PaperLens',
 description: 'Details about the cookies used by PaperLens.',
 alternates: { canonical: '/cookies' },
};

export default function CookiesPage() {
 return <LegalPage slug="cookies" />;
}
