export interface ToolSEO {
  slug: string;
  title: string;
  description: string;
  heading: string;
  subheading: string;
  focusKeywords: string[];
  features: { title: string; description: string }[];
  faqs: { question: string; answer: string }[];
}

export const TOOLS_REGISTRY: Record<string, ToolSEO> = {
  'pdf-analyzer-ai': {
    slug: 'pdf-analyzer-ai',
    title: 'Free PDF Analyzer AI | Extract Data from PDFs - PaperLens',
    description:
      'Use the ultimate PDF Analyzer AI to extract key insights, citations, and summaries from dense documents in seconds without reading.',
    heading: 'AI-Powered PDF Analyzer',
    subheading:
      'Turn 100-page PDFs into actionable insights in seconds. The most accurate PDF analyzer for researchers, lawyers, and students.',
    focusKeywords: ['pdf analyzer ai', 'ai pdf reader', 'document analysis ai'],
    features: [
      {
        title: 'Instant Extraction',
        description:
          'Upload any PDF and our AI will immediately extract the core arguments, data points, and conclusions.',
      },
      {
        title: 'Citation Verification',
        description:
          'Every claim the AI makes is backed by a direct citation to the original text.',
      },
    ],
    faqs: [
      {
        question: 'What is a PDF Analyzer AI?',
        answer:
          'A PDF Analyzer AI is a tool that uses machine learning to read, comprehend, and summarize long PDF documents, allowing users to ask natural language questions about the text.',
      },
      {
        question: 'Is PaperLens free to use?',
        answer:
          'Yes, PaperLens offers a free tier for analyzing PDFs. You can upgrade for enterprise-scale document analysis.',
      },
    ],
  },
  'chat-with-pdf': {
    slug: 'chat-with-pdf',
    title: 'Chat with PDF Free | Ask AI Questions About Your Document',
    description:
      'Chat with any PDF document. Upload your file, ask questions, and get cited answers instantly using the best Chat with PDF AI tool.',
    heading: 'Chat with any PDF Document',
    subheading:
      'Stop scrolling. Start chatting. Talk to your PDFs like you would a human assistant and get instant, cited answers.',
    focusKeywords: ['chat with pdf', 'talk to pdf', 'ask ai about pdf', 'ai chat with pdf'],
    features: [
      {
        title: 'Conversational UI',
        description:
          'Ask questions in plain English and get answers pulled directly from your document.',
      },
      {
        title: 'Multi-Document Chat',
        description:
          'Chat with up to 50 PDFs simultaneously to synthesize information across multiple sources.',
      },
    ],
    faqs: [
      {
        question: 'How do I chat with a PDF?',
        answer:
          'Simply upload your PDF file to PaperLens and type your question in the chat box. The AI will read the document and provide an answer instantly.',
      },
      {
        question: 'Can I chat with multiple PDFs at once?',
        answer:
          'Yes, PaperLens supports multi-document analysis, allowing you to cross-reference and chat with multiple files in a single session.',
      },
    ],
  },
  'ai-pdf-summarizer': {
    slug: 'ai-pdf-summarizer',
    title: 'Best AI PDF Summarizer | Summarize Long Documents Online',
    description:
      'Summarize long PDFs online for free. Our AI PDF summarizer extracts the most important bullet points from books, reports, and manuals.',
    heading: 'AI PDF Summarizer',
    subheading:
      'Get the TL;DR for any document. Automatically generate executive summaries, bullet points, and study guides from massive PDFs.',
    focusKeywords: [
      'ai pdf summarizer',
      'summarize pdf online',
      'ai document summarizer',
      'summarize long pdfs',
    ],
    features: [
      {
        title: 'Executive Summaries',
        description:
          'Generate 1-page executive summaries from 100-page business reports in one click.',
      },
      {
        title: 'Custom Length Control',
        description: 'Choose whether you want a 3-bullet summary or a detailed 5-page breakdown.',
      },
    ],
    faqs: [
      {
        question: 'How accurate is the AI summarizer?',
        answer:
          'Our AI uses advanced semantic chunking to ensure that no critical information is hallucinated or omitted from the final summary.',
      },
    ],
  },
  'research-paper-summarizer': {
    slug: 'research-paper-summarizer',
    title: 'Research Paper Summarizer AI | arXiv Integration - PaperLens',
    description:
      'Summarize complex research papers instantly. Understand methodologies, results, and abstracts with our advanced AI summarizer.',
    heading: 'Research Paper Summarizer',
    subheading:
      'Stop struggling with dense academic text. Get instantly readable summaries of arXiv papers and journals.',
    focusKeywords: ['research paper summarizer', 'arxiv ai', 'summarize academic papers'],
    features: [
      {
        title: 'Methodology Breakdown',
        description:
          'Our AI automatically sections out the methodology, making it easy to understand how the research was conducted.',
      },
      {
        title: 'Results Extraction',
        description:
          'Instantly see the final results and p-values without digging through the discussion section.',
      },
    ],
    faqs: [
      {
        question: 'How accurate is the research paper summarizer?',
        answer:
          'Our models are specifically tuned on academic texts to ensure high accuracy when summarizing methodologies and conclusions.',
      },
    ],
  },
  'legal-contract-analyzer': {
    slug: 'legal-contract-analyzer',
    title: 'Legal Contract Analyzer AI | Review NDAs & Leases - PaperLens',
    description:
      'Analyze legal contracts in seconds. Spot hidden clauses, liabilities, and obligations with our AI contract analyzer.',
    heading: 'Legal Contract Analyzer AI',
    subheading:
      'Never sign a bad contract again. Instantly flag hidden liabilities, auto-renewals, and unfair clauses.',
    focusKeywords: ['legal contract analyzer', 'ai contract review', 'review nda ai'],
    features: [
      {
        title: 'Clause Detection',
        description:
          'Automatically flag non-competes, indemnifications, and auto-renewals before you sign.',
      },
      {
        title: 'Plain English Translation',
        description: 'Turn complex legalese into simple, easy-to-understand plain English.',
      },
    ],
    faqs: [
      {
        question: 'Can AI replace a lawyer for contract review?',
        answer:
          'While AI is excellent for spotting standard clauses and summarizing terms, it should not replace professional legal counsel for high-stakes agreements.',
      },
    ],
  },
  'invoice-data-extraction': {
    slug: 'invoice-data-extraction',
    title: 'Extract Data from Invoices & Receipts with AI | OCR Alternative',
    description:
      'Automate your accounting. Extract line items, totals, and vendor details from invoices and receipts using intelligent document AI.',
    heading: 'AI Invoice Data Extraction',
    subheading:
      'Ditch manual data entry. Automatically extract structured data from hundreds of invoices simultaneously.',
    focusKeywords: ['extract data from invoice', 'ai ocr extraction', 'invoice data capture ai'],
    features: [
      {
        title: 'Line Item Parsing',
        description:
          'Accurately read complex tables and line items that traditional OCR tools scramble.',
      },
      {
        title: 'Export to CSV',
        description:
          'Download the extracted data in a clean, structured CSV format ready for your accounting software.',
      },
    ],
    faqs: [
      {
        question: 'Is it better than standard OCR?',
        answer:
          'Yes. Standard OCR only recognizes letters, whereas PaperLens uses semantic AI to understand the layout and relationship of tables, ensuring accurate data extraction.',
      },
    ],
  },
};

export const allToolsList = Object.values(TOOLS_REGISTRY);
