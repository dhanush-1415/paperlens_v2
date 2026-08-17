export interface ComparisonSEO {
  slug: string;
  competitorName: string;
  title: string;
  description: string;
  heading: string;
  subheading: string;
  focusKeywords: string[];
  points: { feature: string; paperlens: string; competitor: string }[];
  faqs: { question: string; answer: string }[];
}

export const COMPARISONS_REGISTRY: Record<string, ComparisonSEO> = {
  'paperlens-vs-chatpdf': {
    slug: 'paperlens-vs-chatpdf',
    competitorName: 'ChatPDF',
    title: 'PaperLens vs ChatPDF: Which is the Best AI PDF Analyzer? - PaperLens',
    description:
      'Compare PaperLens and ChatPDF. See why researchers and lawyers prefer PaperLens for citation verification, document scale, and privacy.',
    heading: 'PaperLens vs ChatPDF',
    subheading:
      'Why power users are switching from ChatPDF to PaperLens for enterprise-grade document analysis.',
    focusKeywords: ['paperlens vs chatpdf', 'chatpdf alternative', 'better than chatpdf'],
    points: [
      {
        feature: 'Citation Verification',
        paperlens: 'Strict citation mapping to exact source pages.',
        competitor: 'Often hallucinates page numbers or context.',
      },
      {
        feature: 'Data Privacy',
        paperlens: 'Zero-data retention policy for enterprise clients.',
        competitor: 'Documents may be used for model training.',
      },
      {
        feature: 'Scale',
        paperlens: 'Analyze up to 50 documents simultaneously in a single knowledge base.',
        competitor: 'Limited to single document chats in most tiers.',
      },
    ],
    faqs: [
      {
        question: 'Is PaperLens better than ChatPDF?',
        answer:
          'PaperLens is designed for professionals (lawyers, researchers) who need strict citation accuracy and multi-document analysis, whereas ChatPDF is generally built for casual, single-document chats.',
      },
    ],
  },
  'paperlens-vs-humata': {
    slug: 'paperlens-vs-humata',
    competitorName: 'Humata AI',
    title: 'PaperLens vs Humata AI: Best AI Document Analyzer - PaperLens',
    description:
      'Compare PaperLens vs Humata AI. Find out which tool is better for analyzing academic papers and legal contracts securely.',
    heading: 'PaperLens vs Humata AI',
    subheading:
      'Discover why PaperLens is the preferred Humata AI alternative for academic research and legal review.',
    focusKeywords: ['paperlens vs humata', 'humata ai alternative', 'humata vs paperlens'],
    points: [
      {
        feature: 'Academic Focus',
        paperlens: 'Native arXiv integration and LaTeX formula parsing.',
        competitor: 'Standard OCR extraction that struggles with complex math.',
      },
      {
        feature: 'Pricing Transparency',
        paperlens: 'Flat subscription rates with no hidden per-page fees.',
        competitor: 'Per-page pricing models that become expensive at scale.',
      },
    ],
    faqs: [
      {
        question: 'What makes PaperLens a good alternative to Humata AI?',
        answer:
          'PaperLens offers transparent pricing, superior extraction of complex academic formatting (like LaTeX), and explicit citation tracking.',
      },
    ],
  },
};

export const allComparisonsList = Object.values(COMPARISONS_REGISTRY);
