/**
 * The presentation layer's exports.
 *
 * ### Why this barrel re-exports types but not the DTO module
 *
 * A route needs the components and the label shapes. It does not need `toAnalysisDto` — that
 * is called by the route's data path, from `../application`, not from here. Keeping the two
 * apart is what stops "presentation" from quietly becoming the place everything is imported
 * from.
 *
 * ### Server and client components in one barrel
 *
 * `AnalysisReport` is a Server Component; `AnalysisForm` and `RiskFlagCard` are Client
 * Components. Mixing them here is safe: `'use client'` is a property of the module that
 * declares the directive, not of the file that re-exports it. A route importing all three from
 * this path gets the report rendered on the server and the other two as client references —
 * identical to importing each from its own file.
 *
 * The one place that is *not* true is a Client Component importing this barrel: it would pull
 * `AnalysisReport` — and through it the DTO mapper — into the browser graph. Client Components
 * in this feature deep-import instead, and `risk-flag-card.tsx` says so where it does it.
 */

export { AnalysisForm, type AnalysisFormLabels, type AnalysisFormProps } from './analysis-form';
export {
  AnalysisReport,
  type AnalysisReportLabels,
  type AnalysisReportProps,
} from './analysis-report';
export { RiskFlagCard, type RiskFlagCardProps } from './risk-flag-card';

/**
 * The action is exported so a route can pass it to a `<form action={…}>` without deep-importing
 * `./actions`. It is a `'use server'` export: importing it from a Client Component creates a
 * network reference, not a code import, so nothing in this file's server graph follows it into
 * the bundle.
 */
export { analyzeDocumentAction } from './actions';
