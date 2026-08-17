export interface PersonaSEO {
  slug: string;
  title: string;
  description: string;
  heading: string;
  subheading: string;
  focusKeywords: string[];
  benefits: { title: string; description: string }[];
  faqs: { question: string; answer: string }[];
}

export const PERSONAS_REGISTRY: Record<string, PersonaSEO> = {
  lawyers: {
    slug: 'lawyers',
    title: 'AI Document Analysis for Lawyers & Legal Teams - PaperLens',
    description:
      'PaperLens helps legal professionals instantly review contracts, extract clauses, and verify legal citations in complex PDFs.',
    heading: 'PaperLens for Legal Professionals',
    subheading:
      'Stop losing billable hours reading boilerplate. Use AI to instantly extract key clauses, identify risks, and verify citations across thousands of pages.',
    focusKeywords: ['ai for lawyers', 'legal document analysis', 'contract review ai'],
    benefits: [
      {
        title: 'Risk Identification',
        description:
          'Instantly flag unlimited liability, automatic renewals, and non-standard indemnification clauses.',
      },
      {
        title: 'Citation Verification',
        description: 'Verify case law and statutory references in briefs instantly.',
      },
    ],
    faqs: [
      {
        question: 'Is my client data safe?',
        answer:
          'Yes. PaperLens employs enterprise-grade AES-256 encryption. We never train our base models on your proprietary legal documents.',
      },
    ],
  },
  researchers: {
    slug: 'researchers',
    title: 'AI Research Paper Assistant for Academics - PaperLens',
    description:
      'Summarize methodologies, extract p-values, and comprehend arXiv papers instantly with PaperLens AI for researchers.',
    heading: 'PaperLens for Researchers',
    subheading:
      'Turn a mountain of literature into a structured database. Extract methodologies, conclusions, and data points from complex academic papers.',
    focusKeywords: ['ai for researchers', 'research paper ai', 'academic literature review tool'],
    benefits: [
      {
        title: 'Literature Review Automation',
        description:
          'Upload 50 papers and let our AI generate a structured literature review matrix in seconds.',
      },
      {
        title: 'Methodology Extraction',
        description:
          'Immediately isolate the statistical methods and sample sizes used in any paper.',
      },
    ],
    faqs: [
      {
        question: 'Does it work with arXiv links?',
        answer:
          'Yes! Simply paste an arXiv URL and PaperLens will ingest and analyze the PDF instantly.',
      },
    ],
  },
  students: {
    slug: 'students',
    title: 'AI Study Assistant & PDF Summarizer for Students - PaperLens',
    description:
      'Read less, learn more. PaperLens summarizes textbooks, generates study guides, and explains complex concepts in plain English.',
    heading: 'PaperLens for Students',
    subheading:
      'Dominate your reading list. Turn 500-page textbooks into interactive study guides and flashcards.',
    focusKeywords: ['ai for students', 'pdf summarizer for students', 'ai study guide generator'],
    benefits: [
      {
        title: 'Plain English Explanations',
        description:
          'Ask the AI to explain quantum mechanics or constitutional law like you are 5 years old.',
      },
      {
        title: 'Instant Study Guides',
        description:
          'Automatically extract the key concepts and terms from your syllabus readings.',
      },
    ],
    faqs: [
      {
        question: 'Is this considered cheating?',
        answer:
          "PaperLens is a study aid designed to help you comprehend difficult texts faster, similar to a tutor. Always follow your university's academic integrity guidelines.",
      },
    ],
  },
  freelancers: {
    slug: 'freelancers',
    title: 'AI Contract Review for Freelancers & Creators - PaperLens',
    description:
      'Protect your independent business. Let AI analyze your freelance contracts, MSAs, and NDAs to spot bad IP terms and payment traps.',
    heading: 'PaperLens for Freelancers & Creators',
    subheading:
      "Don't sign away your IP. Instantly review client contracts and scope of work agreements before you sign.",
    focusKeywords: [
      'ai contract review for freelancers',
      'review nda ai',
      'freelance contract analyzer',
    ],
    benefits: [
      {
        title: 'Spot IP Grabs',
        description:
          'Automatically detect clauses where clients try to take ownership of your background IP.',
      },
      {
        title: 'Payment Term Checks',
        description:
          'Ensure your payment terms (Net 30/60) and late fee clauses are clearly defined.',
      },
    ],
    faqs: [
      {
        question: 'Can I upload standard NDAs?',
        answer:
          'Yes, PaperLens can instantly review standard NDAs and tell you if they are mutual or unilateral.',
      },
    ],
  },
  teachers: {
    slug: 'teachers',
    title: 'AI Document Analysis & Grading Assistant for Teachers',
    description:
      'Save hours on lesson planning and grading. Summarize curriculum PDFs and extract key teaching points instantly with AI.',
    heading: 'PaperLens for Educators',
    subheading:
      'Reclaim your weekends. Instantly turn state curriculum PDFs into actionable lesson plans and quizzes.',
    focusKeywords: ['ai for teachers', 'lesson plan generator', 'ai curriculum assistant'],
    benefits: [
      {
        title: 'Quiz Generation',
        description:
          'Upload a textbook chapter and instantly generate a 20-question multiple-choice quiz.',
      },
      {
        title: 'Rubric Extraction',
        description: 'Easily cross-reference student submissions against complex grading rubrics.',
      },
    ],
    faqs: [
      {
        question: 'Is this FERPA compliant?',
        answer:
          'We do not share any data uploaded to our system. All documents are encrypted and kept strictly private.',
      },
    ],
  },
  'financial-analysts': {
    slug: 'financial-analysts',
    title: 'AI for Financial Analysts | Analyze 10-K Reports - PaperLens',
    description:
      'Chat with SEC filings, 10-K reports, and financial statements. Extract revenue data and risk factors instantly with AI.',
    heading: 'PaperLens for Financial Analysts',
    subheading:
      "Don't read 300-page 10-Ks. Ask PaperLens to extract the risk factors and revenue tables instantly.",
    focusKeywords: ['ai for finance', 'analyze 10-k with ai', 'financial statement analyzer'],
    benefits: [
      {
        title: 'Cross-Document Analysis',
        description:
          'Upload Q1, Q2, Q3, and Q4 reports and ask the AI to compare revenue trends across them.',
      },
      {
        title: 'Table Parsing',
        description: 'Accurately extract complex tabular data from SEC filings.',
      },
    ],
    faqs: [
      {
        question: 'Can it handle complex financial jargon?',
        answer:
          'Yes, the AI is capable of comprehending high-level financial and accounting terminology.',
      },
    ],
  },
  'real-estate-agents': {
    slug: 'real-estate-agents',
    title: 'AI Document Review for Real Estate Agents & Brokers',
    description:
      'Review purchase agreements, HOA bylaws, and property disclosures instantly with PaperLens AI.',
    heading: 'PaperLens for Real Estate Professionals',
    subheading:
      'Close deals faster. Instantly summarize 200-page HOA bylaws and flag contingencies in purchase agreements.',
    focusKeywords: ['ai for real estate', 'hoa document analyzer', 'real estate contract ai'],
    benefits: [
      {
        title: 'HOA Bylaw Summaries',
        description:
          'Find the pet policy or rental restrictions in a massive HOA document in 3 seconds.',
      },
      {
        title: 'Contingency Tracking',
        description:
          'Ensure no inspection or financing contingencies are missed in a counter-offer.',
      },
    ],
    faqs: [
      {
        question: 'Can I share the summaries with my clients?',
        answer:
          'Yes, you can generate a public, secure share link to send the document summary directly to your buyer or seller.',
      },
    ],
  },
};

export const allPersonasList = Object.values(PERSONAS_REGISTRY);
