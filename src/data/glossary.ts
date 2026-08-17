export interface GlossaryTerm {
  slug: string;
  term: string;
  category: 'Legal' | 'Financial' | 'Academic' | 'General';
  shortDefinition: string;
  detailedExplanation: string;
  howPaperLensHelps: string;
}

// This registry will be programmatically populated by the generate_glossary.py script.
// Here are a few seed examples to build the engine.
export const GLOSSARY_REGISTRY: Record<string, GlossaryTerm> = {
  'indemnification-clause': {
    slug: 'indemnification-clause',
    term: 'Indemnification Clause',
    category: 'Legal',
    shortDefinition:
      'A contractual provision where one party agrees to compensate the other for certain damages or losses.',
    detailedExplanation:
      "In contracts, an indemnification clause is a risk-shifting mechanism. If Party A agrees to indemnify Party B, Party A is promising to pay for legal costs, damages, or settlements if a specific negative event occurs (usually due to Party A's negligence). These are often the most heavily negotiated sections of any commercial agreement.",
    howPaperLensHelps:
      'PaperLens AI can instantly scan a 50-page Master Services Agreement and extract the exact indemnification clauses. It flags whether the indemnification is mutual or unilateral, preventing you from signing away unlimited liability.',
  },
  'p-value': {
    slug: 'p-value',
    term: 'P-Value',
    category: 'Academic',
    shortDefinition: 'A statistical measurement used to validate hypotheses in academic research.',
    detailedExplanation:
      'The p-value represents the probability of obtaining test results at least as extreme as the results actually observed, under the assumption that the null hypothesis is correct. A very small p-value (typically ≤ 0.05) indicates strong evidence against the null hypothesis, so you reject the null hypothesis.',
    howPaperLensHelps:
      'When reviewing dense clinical trials or psychological studies, PaperLens AI automatically extracts the core methodologies and highlights the p-values for primary endpoints, saving researchers hours of skimming.',
  },
  ebitda: {
    slug: 'ebitda',
    term: 'EBITDA',
    category: 'Financial',
    shortDefinition: 'Earnings Before Interest, Taxes, Depreciation, and Amortization.',
    detailedExplanation:
      "EBITDA is a measure of a company's overall financial performance and is used as an alternative to net income in some circumstances. It strips out the cost of debt investments and its tax effects, providing a clearer picture of operational profitability.",
    howPaperLensHelps:
      'Instead of manually hunting through tables in a massive SEC 10-K filing, analysts can ask PaperLens to "Extract the EBITDA for Q3 and compare it to Q2." The AI instantly reads the tables and provides the exact figures with strict citations to the page numbers.',
  },
};

export const allGlossaryTermsList = Object.values(GLOSSARY_REGISTRY);
