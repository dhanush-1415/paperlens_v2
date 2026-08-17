export interface UtilitySEO {
  slug: string;
  title: string;
  description: string;
  heading: string;
  subheading: string;
  focusKeywords: string[];
  steps: { name: string; text: string }[];
  faqs: { question: string; answer: string }[];
}

export const UTILITIES_REGISTRY: Record<string, UtilitySEO> = {
  'merge-pdf': {
    slug: 'merge-pdf',
    title: 'Merge PDF Files Online for Free - PaperLens',
    description:
      'Combine multiple PDFs into a single document instantly. Fast, secure, and free online PDF merger.',
    heading: 'Merge PDF Files Instantly',
    subheading:
      'Combine multiple documents into a single PDF in seconds. Completely free and secure.',
    focusKeywords: ['merge pdf', 'combine pdf', 'join pdf files'],
    steps: [
      { name: 'Upload Files', text: 'Drag and drop your PDF files into the upload area above.' },
      {
        name: 'Reorder',
        text: 'Drag the files to rearrange them in the exact order you want them to appear.',
      },
      {
        name: 'Merge & Download',
        text: 'Click Merge. Your new combined PDF will be ready to download instantly.',
      },
    ],
    faqs: [
      {
        question: 'Is my data secure when I merge PDFs?',
        answer:
          'Yes. All files are processed locally in your browser or deleted instantly from our secure servers after processing.',
      },
      {
        question: 'Can I merge PDFs for free?',
        answer: 'Yes, our PDF merging tool is 100% free to use.',
      },
    ],
  },
  'compress-pdf': {
    slug: 'compress-pdf',
    title: 'Compress PDF Online | Reduce File Size - PaperLens',
    description:
      'Reduce PDF file size online without losing quality. Fast, secure, and free PDF compressor.',
    heading: 'Compress PDF to the Smallest Size',
    subheading: 'Need to email a massive PDF? Compress it instantly without losing visual quality.',
    focusKeywords: ['compress pdf', 'reduce pdf size', 'make pdf smaller'],
    steps: [
      { name: 'Select PDF', text: 'Upload the large PDF file you want to compress.' },
      {
        name: 'Choose Compression',
        text: 'Select either Basic or Strong compression based on your file size needs.',
      },
      { name: 'Download', text: 'Download your newly compressed, email-ready PDF.' },
    ],
    faqs: [
      {
        question: 'Will compressing my PDF ruin the quality?',
        answer:
          'No. Our intelligent compression algorithm reduces file size by optimizing embedded images and fonts while preserving readability.',
      },
    ],
  },
  'split-pdf': {
    slug: 'split-pdf',
    title: 'Split PDF Pages Online - Extract Pages from PDF - PaperLens',
    description:
      'Extract pages from your PDF or split a large PDF into multiple smaller documents easily and for free.',
    heading: 'Split & Extract PDF Pages',
    subheading: 'Only need a few pages from a 100-page document? Split or extract pages instantly.',
    focusKeywords: ['split pdf', 'extract pdf pages', 'separate pdf pages'],
    steps: [
      { name: 'Upload PDF', text: 'Select the document you want to split.' },
      {
        name: 'Select Pages',
        text: 'Click on the specific pages you want to extract, or set a custom page range.',
      },
      {
        name: 'Extract',
        text: 'Click Split to instantly download a new PDF containing only your selected pages.',
      },
    ],
    faqs: [
      {
        question: 'Can I extract multiple non-consecutive pages?',
        answer:
          'Yes. You can manually select individual pages (e.g. pages 2, 5, and 9) to extract into a single new document.',
      },
    ],
  },
};

export const allUtilitiesList = Object.values(UTILITIES_REGISTRY);
