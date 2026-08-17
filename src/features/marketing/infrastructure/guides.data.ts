/**
 * The guide corpus — twenty-five documents, as data.
 *
 * ### Why this is `infrastructure/` and not `domain/`
 *
 * It is *content*, and content has an owner who is not an engineer. Today it ships in a
 * TypeScript array because that is the cheapest correct thing: no fetch, no cache, no build
 * step, and `tsc` refuses a guide missing its checklist. The day a marketer needs to fix a
 * typo without a deploy, this file is replaced by a CMS adapter behind the same port and
 * nothing above `infrastructure/` changes. Putting the prose in `domain/` would have made that
 * swap a refactor of the layer that is supposed to be the most stable in the codebase.
 *
 * ### Why the array is frozen at the type level and not at runtime
 *
 * `readonly DocumentGuide[]` with every field `readonly` makes mutation a compile error, which
 * catches it at the only moment it is cheap to catch. `Object.freeze` would additionally catch
 * it at runtime — in production, in a request, as a silent no-op under non-strict mode. The
 * compiler is the better guard here because there is no dynamic writer to defend against: this
 * module has exactly one consumer and it only reads.
 *
 * ### On slugs
 *
 * A slug is a public URL that search engines have indexed and other sites have linked. Renaming
 * one is not a refactor — it is a 404 and a lost ranking. Slugs are append-only; a guide whose
 * name is wrong gets better prose, not a better slug.
 */

import { type DocumentGuide } from '../domain';

export const DOCUMENT_GUIDES: readonly DocumentGuide[] = [
  {
    slug: 'irs-cp2000-notice',
    category: 'tax-govt',
    categoryLabel: 'Tax & Government',
    title: 'Decode IRS CP2000 Notice Online - PaperLens',
    description:
      'Learn how to decode and respond to an IRS CP2000 Underreported Income Notice. Compare discrepancies, calculate penalties, and verify tax liability.',
    heading: 'IRS CP2000 Underreported Income Notice',
    summary:
      'The IRS sends a CP2000 notice when information they received from third parties (like employers, banks, or brokerages) does not match the income you reported on your tax return. This is not an official audit, but a proposal to adjust your tax liability.',
    typicalRisks: [
      'Discrepancies in reported 1099-B stock sales where the cost basis was omitted.',
      'Interest or dividend income from accounts you forgot to list.',
      'Proposed penalties and interest accumulating from the original tax filing date.',
      'Strict 30-day response deadline to agree or disagree with the proposed changes.',
    ],
    checklist: [
      'Locate your tax return from the year specified in the notice.',
      'Compare the IRS proposed changes list with your form W-2, 1099-INT, 1099-DIV, or 1099-B.',
      'Identify if the discrepancy is correct, partially correct, or incorrect.',
      'Gather evidence (such as cost basis statements) if you disagree with the changes.',
      'Complete the CP2000 Response Form and submit within 30 days.',
    ],
    faqs: [
      {
        question: 'Is a CP2000 notice an audit?',
        answer:
          'No, a CP2000 notice is not an audit. It is a computer-generated proposal showing discrepancies between reported third-party information and your tax return.',
      },
      {
        question: 'What happens if I ignore the CP2000 notice?',
        answer:
          'If you fail to respond within 30 days, the IRS will issue a Statutory Notice of Deficiency, followed by a formal tax assessment, billing, and potential levy actions.',
      },
    ],
  },
  {
    slug: 'irs-cp504-levy-notice',
    category: 'tax-govt',
    categoryLabel: 'Tax & Government',
    title: 'How to Handle IRS CP504 Notice of Intent to Levy - PaperLens',
    description:
      'Received an IRS CP504 Notice? Find out what it means, what assets can be seized, and immediate steps to stop the levy and resolve tax debt.',
    heading: 'IRS CP504 Intent to Levy Notice',
    summary:
      'The CP504 is an urgent notice of intent to levy. It informs you that you have an unpaid tax balance and that the IRS intends to seize your state tax refund or other assets if you do not pay immediately.',
    typicalRisks: [
      'Immediate seizure of state income tax refunds to satisfy the debt.',
      'Initiation of search for other seizable assets (bank accounts, wages).',
      'Accrual of failure-to-pay penalties and interest charges.',
      'Establishment of a federal tax lien on your property.',
    ],
    checklist: [
      'Verify the total balance due, tax periods, and penalty calculations shown.',
      'Check if you qualify for an installment agreement, Offer in Compromise, or Currently Not Collectible status.',
      'Make a payment or set up a payment plan immediately to halt the levy.',
      'Contact the IRS at the number listed on the notice if you disagree with the balance.',
    ],
    faqs: [
      {
        question: 'Does CP504 mean the IRS will seize my house?',
        answer:
          'No, a CP504 notice is primarily used to seize state tax refunds. However, it serves as a final warning before the IRS issues a Final Notice of Intent to Levy, which can target wages, bank accounts, and physical property.',
      },
      {
        question: 'How long do I have to pay after receiving a CP504?',
        answer:
          'You must pay the balance or establish a payment agreement within 30 days from the date printed on the CP504 notice.',
      },
    ],
  },
  {
    slug: 'irs-cp14-balance-due',
    category: 'tax-govt',
    categoryLabel: 'Tax & Government',
    title: 'IRS Notice CP14 Balance Due Explained - PaperLens',
    description:
      'Understand IRS Notice CP14, including why you received it, how interest and penalties are calculated, and how to pay or dispute the balance.',
    heading: 'IRS Notice CP14 Balance Due',
    summary:
      'Notice CP14 is the first official bill sent by the IRS when you file a tax return showing a balance due but do not pay the tax in full by the filing deadline.',
    typicalRisks: [
      'Accrual of late payment penalties (typically 0.5% per month, up to 25%).',
      'Daily compounding interest charges on the unpaid tax amount.',
      'Failure to establish a payment option leads to more aggressive collection letters.',
    ],
    checklist: [
      'Confirm the balance matches the liability calculated on your submitted tax return.',
      'Pay the balance in full via IRS Direct Pay to avoid additional interest.',
      'If unable to pay in full, apply for a short-term payment extension or monthly payment plan.',
      'Verify if you qualify for First-Time Penalty Abatement to reduce the overall cost.',
    ],
    faqs: [
      {
        question: 'What happens if I cannot pay my CP14 balance?',
        answer:
          'If you cannot pay, you should still contact the IRS or apply online for an installment agreement. Ignoring the notice will result in compounding interest, penalties, and eventual collection action.',
      },
    ],
  },
  {
    slug: 'apartment-lease-renewal',
    category: 'real-estate',
    categoryLabel: 'Real Estate & Leases',
    title: 'Review Your Apartment Lease Renewal Offer - PaperLens',
    description:
      'Review rent increases, cancellation terms, and hidden fees in your apartment lease renewal. Ensure your rights are protected before signing.',
    heading: 'Apartment Lease Renewal Agreement',
    summary:
      'A lease renewal is a contract extension between a landlord and tenant. It specifies the updated rent amount, lease term length, and any modifications to the original building rules or policies.',
    typicalRisks: [
      'Rent increases exceeding local rent control limits or market rates.',
      'Hidden fee updates for parking, trash valet, or pets.',
      'Unfavorable lease breaks or cancellation fees (e.g. 60-day notice + 2 months rent penalty).',
      'Transition to an expensive month-to-month rate if renewal is missed.',
    ],
    checklist: [
      'Compare the rent increase percentage with local rent stabilization ordinances.',
      'Check the deadline for providing written notice to vacate (usually 30 or 60 days).',
      'Verify that all terms of the original lease remain in effect unless explicitly modified.',
      'Check for any new tenant obligations, fee structures, or amenity restrictions.',
    ],
    faqs: [
      {
        question: 'Can a landlord increase rent by any amount on renewal?',
        answer:
          'It depends on local laws. In rent-stabilized jurisdictions, increases are capped. In unregulated markets, landlords can raise rent to any market rate, provided they give proper notice.',
      },
    ],
  },
  {
    slug: 'commercial-lease-agreement',
    category: 'real-estate',
    categoryLabel: 'Real Estate & Leases',
    title: 'Analyze Commercial Lease Agreements Online - PaperLens',
    description:
      'Scan and review office, retail, or industrial commercial leases. Spot triple-net (NNN) pitfalls, maintenance clauses, and rent escalation formulas.',
    heading: 'Commercial Lease Agreement',
    summary:
      'A commercial lease is a legally binding contract for renting retail, office, or industrial space. Unlike residential leases, commercial leases have fewer statutory consumer protections and highly complex terms.',
    typicalRisks: [
      'Triple Net (NNN) clauses shifting all property taxes, insurance, and maintenance costs to the tenant.',
      'Rent escalation clauses linked to CPI indexes that compound annually.',
      'Personal guarantee requirements making business owners personally liable for lease defaults.',
      'Lack of subleasing rights or assignment control during business downsizes.',
    ],
    checklist: [
      'Calculate the True Monthly Cost including CAM (Common Area Maintenance) fees.',
      'Inspect the definition of usable vs rentable square footage.',
      'Negotiate the removal or limitation of personal liability guarantees.',
      'Confirm renewal options, tenant improvement allowances, and relocation clauses.',
    ],
    faqs: [
      {
        question: 'What is the difference between a Gross Lease and a Net Lease?',
        answer:
          "In a Gross Lease, the tenant pays a flat rent, and the landlord covers all taxes, insurance, and maintenance. In a Net Lease (e.g., NNN), the tenant pays a base rent plus a share of the property's operating expenses.",
      },
    ],
  },
  {
    slug: 'security-deposit-dispute',
    category: 'real-estate',
    categoryLabel: 'Real Estate & Leases',
    title: 'Draft Security Deposit Dispute Demand Letter - PaperLens',
    description:
      'Learn how to challenge unfair security deposit deductions. Understand state return timelines, wear-and-tear exceptions, and itemization rules.',
    heading: 'Security Deposit Refund Dispute',
    summary:
      "Landlords are legally required to return a tenant's security deposit within a strict state-mandated timeframe after move-out, minus legitimate deductions for damages beyond normal wear and tear.",
    typicalRisks: [
      'Unlawful deductions for cleaning or painting that fall under normal wear and tear.',
      'Landlord failing to provide an itemized list of deductions with receipts within the legal deadline.',
      'Withholding the entire deposit without communication.',
      'Difficulty recovering funds from out-of-state landlords.',
    ],
    checklist: [
      'Look up the security deposit return deadline for your state (typically 14 to 30 days).',
      'Review your move-in and move-out inspection photo evidence.',
      'Request itemized invoices and receipts for any deductions claimed.',
      'Draft and mail a formal security deposit demand letter via certified mail.',
    ],
    faqs: [
      {
        question: 'What counts as normal wear and tear?',
        answer:
          'Normal wear and tear includes minor scuffs, worn carpet in high-traffic areas, faded paint, and loose door handles. Damages include large holes in walls, broken windows, pet stains, or missing fixtures.',
      },
    ],
  },
  {
    slug: 'pay-or-quit-3-day-notice',
    category: 'real-estate',
    categoryLabel: 'Real Estate & Leases',
    title: '3-Day Notice to Pay Rent or Quit: Rights & Steps - PaperLens',
    description:
      'Received a 3-Day Notice to Pay Rent or Quit? Learn your tenant rights, how to cure the default, and how to stop eviction proceedings.',
    heading: '3-Day Notice to Pay Rent or Quit',
    summary:
      'A 3-Day Notice to Pay Rent or Quit is a formal warning issued by a landlord to a tenant who has failed to pay rent on time. It is the initial step required before the landlord can file a formal eviction lawsuit (Unlawful Detainer).',
    typicalRisks: [
      'Eviction lawsuit filing if rent is not paid or the tenant does not vacate within 3 days.',
      'Irreparable damage to credit score and rental history if an eviction is filed.',
      'Accrual of landlord legal fees and late payment penalties.',
    ],
    checklist: [
      'Check if the notice specifies the exact amount of rent owed, excluding illegal late fees.',
      'Pay the full rent amount owed before the 3-day notice period expires (curing the default).',
      'Get a written, signed receipt for any payment made.',
      'Seek legal aid immediately if you cannot pay the balance or if the notice is defective.',
    ],
    faqs: [
      {
        question: 'Does the 3-day notice mean I have to leave in 3 days?',
        answer:
          'No. The notice gives you 3 days to pay the rent or move. If you do neither, the landlord cannot throw you out; they must file a lawsuit, which takes time to resolve in court.',
      },
    ],
  },
  {
    slug: 'roommate-agreement',
    category: 'real-estate',
    categoryLabel: 'Real Estate & Leases',
    title: 'Create an Actionable Roommate Agreement - PaperLens',
    description:
      'Ensure fair rent division, utility splits, guest policies, and lease exit terms with a comprehensive roommate agreement.',
    heading: 'Roommate Cohabitation Agreement',
    summary:
      'A roommate agreement is a contract between co-tenants sharing a rental unit. It outlines financial splits, chore schedules, guest policies, and procedures for when a roommate wants to move out early.',
    typicalRisks: [
      'One roommate defaulting on rent, leaving others liable under joint and several lease clauses.',
      'Vague guest policies causing domestic friction.',
      'Disputes over utility bills, shared supplies, and security deposit refunds.',
      'Unexpected move-outs without a replacement found.',
    ],
    checklist: [
      'Specify the exact division of rent and utility bills (internet, electric, water).',
      'Detail the policy for overnight guests, parties, and quiet hours.',
      'Define the process and notice period required for a roommate leaving the agreement.',
      'Outline how the security deposit refund will be distributed upon lease termination.',
    ],
    faqs: [
      {
        question: 'Is a roommate agreement legally binding?',
        answer:
          'Yes, financial obligations (like rent and utility splits) in a roommate agreement are legally binding and can be enforced in small claims court.',
      },
    ],
  },
  {
    slug: 'medical-eob',
    category: 'medical-insurance',
    categoryLabel: 'Medical & Insurance',
    title: 'How to Read a Medical Explanation of Benefits (EOB) - PaperLens',
    description:
      'Deconstruct your health insurance Explanation of Benefits (EOB). Identify patient responsibility, out-of-network rates, and claim codes.',
    heading: 'Medical Explanation of Benefits (EOB)',
    summary:
      'An EOB is not a bill. It is a statement sent by your health insurance company showing what medical services were performed, how much the insurance provider paid, and how much you are responsible for paying.',
    typicalRisks: [
      "Confusion between an EOB statement and an actual doctor's bill.",
      'Claim denials due to missing information, incorrect billing codes, or pre-authorization issues.',
      'Unexpected out-of-network rates for assistant surgeons or laboratory services.',
      'Unapplied deductible amounts.',
    ],
    checklist: [
      'Match the dates of service and provider names on the EOB with your medical appointments.',
      'Verify the "Patient Responsibility" column matches what the doctor\'s office eventually bills you.',
      'Inspect the claim denial codes or reason descriptions if a service was not covered.',
      'Contact your insurance company if you notice duplicate service listings.',
    ],
    faqs: [
      {
        question: 'Why did I get an EOB if it is not a bill?',
        answer:
          'Insurance companies are legally required to send EOBs to explain their coverage decisions, deductibles applied, and payment calculations for transparency.',
      },
    ],
  },
  {
    slug: 'insurance-denial-letter',
    category: 'medical-insurance',
    categoryLabel: 'Medical & Insurance',
    title: 'Appeal an Insurance Claim Denial Letter - PaperLens',
    description:
      'Steps to appeal medical, auto, or property insurance claim denials. Gather evidence, draft appeal letters, and meet deadlines.',
    heading: 'Insurance Claim Denial Letter',
    summary:
      'An insurance denial letter is a notification that your insurer refuses to pay for a medical procedure, prescription, property repair, or accident claim. It must outline the reasons for denial and details on how to file an appeal.',
    typicalRisks: [
      'Missing the strict appeal filing deadline (often 180 days for health insurance).',
      'Inadequate medical necessity documentation from doctors.',
      'Lack of clear evidence or duplicate billing issues causing initial rejections.',
      'Failure to exhaust internal appeal paths before seeking external review.',
    ],
    checklist: [
      'Identify the specific exclusion or policy clause cited as the reason for the denial.',
      'Request your full medical records, billing codes, and claim files from the provider.',
      "Ask your doctor to write a Letter of Medical Necessity answering the insurer's objections.",
      'Submit a formal, written appeal letter outlining the evidence clearly.',
    ],
    faqs: [
      {
        question: 'What are the chances of winning an insurance appeal?',
        answer:
          'Approximately 40% to 50% of health insurance appeals succeed when backed by clear doctor documentation and objective evidence.',
      },
    ],
  },
  {
    slug: 'prior-authorization-request',
    category: 'medical-insurance',
    categoryLabel: 'Medical & Insurance',
    title: 'Prior Authorization Request Guide - PaperLens',
    description:
      'Ensure your prior authorization is approved. Understand insurance guidelines, required documentation, and appeal steps.',
    heading: 'Prior Authorization Request',
    summary:
      'Prior authorization is a health plan cost-control process. It requires physicians to obtain approval from the insurance provider before performing certain procedures, tests, or prescribing specific medications.',
    typicalRisks: [
      'Delays in critical medical treatment while waiting for insurance approval.',
      'Denials due to insurers requiring "step therapy" (trying cheaper treatments first).',
      'Expired authorizations resulting in post-procedure bill denials.',
      'Paperwork errors or incomplete clinical notes submitted by the clinic.',
    ],
    checklist: [
      'Ask your doctor to confirm if a planned procedure or drug requires prior authorization.',
      'Ensure the clinic submits all relevant clinical notes, imaging, and lab results.',
      'Track the request status with both the clinic and the insurance provider.',
      'If denied, file an expedited appeal showing the urgent medical need.',
    ],
    faqs: [
      {
        question: 'How long does a prior authorization take?',
        answer:
          'Standard prior authorizations take between 5 to 10 business days. Urgent requests can be expedited and resolved within 24 to 72 hours.',
      },
    ],
  },
  {
    slug: 'health-insurance-appeal',
    category: 'medical-insurance',
    categoryLabel: 'Medical & Insurance',
    title: 'Health Insurance Appeal Process Guide - PaperLens',
    description:
      'Step-by-step instructions on filing internal and external health insurance appeals. Reclaim denied coverage and resolve billing disputes.',
    heading: 'Health Insurance Claim Appeal',
    summary:
      'A health insurance appeal is a formal request for your insurance company to review its decision to deny coverage or payment for services. Under the Affordable Care Act, you have the right to both internal and independent external appeals.',
    typicalRisks: [
      'Complex administrative procedures designed to discourage patients.',
      'Loss of appeal rights due to late submissions.',
      'Strict clinical criteria definitions that exclude alternative treatments.',
    ],
    checklist: [
      'Read the denial letter to determine if it is an administrative or clinical denial.',
      'Collect all relevant medical records, clinical study data, and doctor recommendation letters.',
      "Complete the insurer's official appeal form and write a detailed argument.",
      'If the internal appeal is denied, file for an independent External Review.',
    ],
    faqs: [
      {
        question: 'What is an external review in health insurance?',
        answer:
          'An external review is an independent evaluation of your claim by a third-party medical professional who is not associated with your insurance company. Their decision is binding on the insurer.',
      },
    ],
  },
  {
    slug: 'cobra-continuation-notice',
    category: 'hr-employment',
    categoryLabel: 'HR & Employment',
    title: 'COBRA Coverage Continuation Notice Guide - PaperLens',
    description:
      'Learn how to evaluate a COBRA continuation notice. Calculate premiums, check sign-up deadlines, and compare health insurance options.',
    heading: 'COBRA Coverage Continuation Notice',
    summary:
      'A COBRA notice is sent to employees who experience a qualifying event (like job loss or reduction in hours). It offers the option to temporarily continue their group health insurance coverage at their own expense.',
    typicalRisks: [
      'Extremely high monthly premiums, as you must pay 100% of the cost plus a 2% administrative fee.',
      'Missed enrollment window (60-day election period starting from the notice date).',
      'Failure to make the initial payment on time, voiding coverage.',
      'Loss of subsidy programs or tax credits compared to ACA marketplace plans.',
    ],
    checklist: [
      'Locate the "Election Period" deadline date and the "First Payment" deadline.',
      'Compare the COBRA monthly premium with equivalent plans on the health insurance marketplace.',
      'Decide whether to continue dental, vision, and health, or health only.',
      'Complete the COBRA Election Form and mail or submit online before the 60-day limit.',
    ],
    faqs: [
      {
        question: 'How long does COBRA coverage last?',
        answer:
          'In most cases, COBRA coverage lasts for up to 18 months, but it can extend to 36 months under specific qualifying circumstances like divorce or death.',
      },
    ],
  },
  {
    slug: 'job-offer-letter',
    category: 'hr-employment',
    categoryLabel: 'HR & Employment',
    title: 'Review Job Offer Letters & Compensation - PaperLens',
    description:
      'What to look for in a job offer letter. Review stock options, bonus structures, non-competes, and termination notice rules.',
    heading: 'Job Offer Letter Agreement',
    summary:
      'A job offer letter is a document outlining the terms of employment, including role responsibilities, base salary, incentive compensation, employee benefits, equity grants, and start date.',
    typicalRisks: [
      'At-will employment clauses allowing termination at any time without severance.',
      'Ambiguity regarding the vesting schedule of stock options (RSUs).',
      'Broad non-compete or non-solicitation clauses hidden in referenced documents.',
      'Unclear bonus milestones or discretionary commission terms.',
    ],
    checklist: [
      'Confirm the base salary, payment frequency, and overtime classification (exempt vs non-exempt).',
      'Check the vesting schedule details (e.g. 1-year cliff, 4-year monthly vesting).',
      'Ensure the offer does not require signing restrictive covenants without proper review.',
      'Negotiate terms, sign, and keep a copy of the fully executed agreement.',
    ],
    faqs: [
      {
        question: 'Is a job offer letter a binding contract?',
        answer:
          'Generally, in the US, job offer letters are not binding employment contracts because of at-will employment laws, unless they explicitly state a guaranteed term of employment.',
      },
    ],
  },
  {
    slug: 'non-compete-agreement',
    category: 'hr-employment',
    categoryLabel: 'HR & Employment',
    title: 'Analyze Employee Non-Compete Agreements - PaperLens',
    description:
      'Understand the enforceability of employee non-compete agreements. Check geographic limits, duration caps, and state-specific bans.',
    heading: 'Non-Compete and Restrictive Covenant',
    summary:
      'A non-compete agreement is a contract restricting an employee from working for competitors or starting a competing business in the same industry for a specified period and geographical area after leaving their job.',
    typicalRisks: [
      'Broad geographic restrictions preventing work in entire states or countries.',
      'Excessive duration limits (e.g. 2 years) keeping you out of your career field.',
      'Restrictions on soliciting any client, even those you did not work with.',
      'Loss of future job opportunities due to fear of employer litigation.',
    ],
    checklist: [
      'Verify if your state has banned non-competes (e.g. California, Minnesota, Oklahoma).',
      'Inspect the definitions of "Competitor", "Geographic Scope", and "Restricted Period".',
      'Check if the agreement contains a "blue-pencil" clause allowing courts to narrow terms.',
      'Request the employer to narrow the scope of restrictions before signing.',
    ],
    faqs: [
      {
        question: 'Are non-competes enforceable if I am fired?',
        answer:
          'It depends on state laws. In many states, courts are reluctant to enforce non-competes if the employee was laid off or terminated without cause.',
      },
    ],
  },
  {
    slug: 'severance-agreement',
    category: 'hr-employment',
    categoryLabel: 'HR & Employment',
    title: 'Severance Agreement Review Checklist - PaperLens',
    description:
      'Do not sign away your rights. Review severance agreements, general releases of claims, OWBPA rules, and healthcare coverage.',
    heading: 'Severance and General Release Agreement',
    summary:
      'A severance agreement outlines the compensation and benefits an employee receives upon termination in exchange for signing a general release of claims, which waives the right to sue the employer.',
    typicalRisks: [
      'Waiver of right to collect unemployment benefits or file discrimination claims.',
      'Clawback clauses requiring you to return severance pay if you violate NDA terms.',
      'Broad non-disparagement covenants preventing you from sharing honest reviews.',
      'Strict sign-off deadlines (e.g. 21 or 45 days under OWBPA rules).',
    ],
    checklist: [
      'Verify the calculation of the severance payout and accrued vacation pay.',
      'Check the COBRA premium coverage period offered by the employer.',
      'Verify that the release does not cover future claims or rights that cannot be waived by law.',
      'Ensure you are given the legal consideration period to review (21 days) and revoke (7 days).',
    ],
    faqs: [
      {
        question: 'Can I negotiate a severance package?',
        answer:
          'Yes. Severance packages are usually negotiable. You can negotiate for additional weeks of pay, extended health coverage, or outplacement assistance.',
      },
    ],
  },
  {
    slug: 'freelance-contract',
    category: 'hr-employment',
    categoryLabel: 'HR & Employment',
    title: 'Freelance & Independent Contractor Contract Review - PaperLens',
    description:
      'Ensure prompt payment. Review freelance contracts for late fees, intellectual property transfers, indemnification, and scope creep.',
    heading: 'Freelance Services Agreement',
    summary:
      'A freelance contract is an agreement between an independent contractor and a client. It outlines project scope, deliverables, payment milestones, deadlines, and intellectual property ownership.',
    typicalRisks: [
      'Broad indemnification clauses making the freelancer liable for all client legal costs.',
      'Client owning all background IP instead of just the project deliverables.',
      'No late payment interest penalties or collection cost coverage.',
      'Scope creep without additional compensation structures.',
    ],
    checklist: [
      'Clearly define the Scope of Work (SOW) to prevent unpaid tasks.',
      'Specify payment terms (e.g. Net 30) and insert a late fee percentage.',
      'Ensure background IP remains your property, licensing only final deliverables to the client.',
      'Confirm termination terms require payment for all work completed up to date.',
    ],
    faqs: [
      {
        question: 'Who owns the intellectual property in a freelance project?',
        answer:
          'Unless the contract states otherwise, the freelancer owns the copyright. However, most standard contracts contain a "Work Made For Hire" clause transferring ownership to the client upon full payment.',
      },
    ],
  },
  {
    slug: 'small-claims-summons',
    category: 'legal-court',
    categoryLabel: 'Legal & Court',
    title: 'Small Claims Summons and Complaint Guide - PaperLens',
    description:
      'Received a small claims court summons? Find out how to file an answer, draft a countersuit, and prepare for your hearing.',
    heading: 'Small Claims Court Summons',
    summary:
      "A small claims summons is a formal court order commanding you to appear in court to defend against a civil lawsuit. It includes a complaint detailing the plaintiff's claim and the amount of money sought.",
    typicalRisks: [
      'Default judgment entered against you if you fail to file an answer or appear.',
      'Damage to credit score once a judgment is recorded.',
      'Bank garnishments or asset levies based on court orders.',
      'Extremely short response window (often 10 to 30 days).',
    ],
    checklist: [
      'Verify the court date, time, and location specified on the summons.',
      'Review the complaint claims and note down all factual inaccuracies.',
      'File a written Answer with the court clerk detailing your defenses.',
      'Collect all receipts, emails, contracts, and photo evidence for the hearing.',
    ],
    faqs: [
      {
        question: 'Do I need a lawyer for small claims court?',
        answer:
          'In most states, lawyers are not allowed in small claims court, and parties must represent themselves. In states where attorneys are allowed, they are rarely used due to the low dispute amounts.',
      },
    ],
  },
  {
    slug: 'child-support-order',
    category: 'legal-court',
    categoryLabel: 'Legal & Court',
    title: 'Child Support Order Rules & Modification - PaperLens',
    description:
      'Understand child support calculations, payment terms, and modification steps. Protect your rights under family law court orders.',
    heading: 'Family Court Child Support Order',
    summary:
      'A child support order is a legally binding directive issued by a family court. It dictates the monthly financial contributions one parent must pay to the other to cover the expenses of raising their minor child.',
    typicalRisks: [
      'Automatic wage garnishment orders issued to employers.',
      "Driver's license suspension and passport denial for arrears.",
      'Interception of tax refunds or lottery winnings.',
      'Inflexible payment calculations that do not adapt to job losses without a formal modification filing.',
    ],
    checklist: [
      'Check the income calculations, custody timeshares, and deductions used by the court.',
      'Verify the payment method (direct pay, state registry, or wage deduction).',
      'Locate the termination date of the support obligation (usually age 18 or graduation).',
      'If your income changes significantly, file a Motion to Modify child support immediately.',
    ],
    faqs: [
      {
        question: 'Can child support be modified retroactively?',
        answer:
          'No. Child support modifications are generally not retroactive. They only apply to payments due after the date you formally file a petition for modification with the court.',
      },
    ],
  },
  {
    slug: 'subpoena-duces-tecum',
    category: 'legal-court',
    categoryLabel: 'Legal & Court',
    title: 'Subpoena Duces Tecum: Compliance & Objections - PaperLens',
    description:
      'Received a subpoena for documents? Learn how to comply, redact confidential info, or file objections to overbroad requests.',
    heading: 'Subpoena Duces Tecum (Document Subpoena)',
    summary:
      'A subpoena duces tecum is a court-ordered command requiring a person or organization to produce physical evidence, documents, or records relevant to an ongoing legal proceeding.',
    typicalRisks: [
      'Contempt of court charges or fines for failure to respond or produce records.',
      'Inadvertent waiver of attorney-client privilege or trade secret protection.',
      'Burdensome costs for collecting, scanning, and reviewing thousands of pages.',
      'Accidental disclosure of third-party personally identifiable info (PII).',
    ],
    checklist: [
      'Check the compliance deadline date and the exact list of requested documents.',
      'Identify if you are a party to the lawsuit or a non-party witness.',
      'Consult legal counsel to draft objections if the request is overbroad or vague.',
      'Redact privileged or sensitive information before delivering the records.',
    ],
    faqs: [
      {
        question: 'What is the difference between a standard subpoena and a duces tecum subpoena?',
        answer:
          'A standard subpoena (ad testificandum) requires you to appear in court to testify. A subpoena duces tecum requires you to produce physical documents, records, or digital files.',
      },
    ],
  },
  {
    slug: 'non-disclosure-agreement',
    category: 'legal-court',
    categoryLabel: 'Legal & Court',
    title: 'Review Non-Disclosure Agreements (NDA) - PaperLens',
    description:
      'Check for mutual definitions, exclusion clauses, duration limits, and trade secret protections in NDAs before sharing information.',
    heading: 'Non-Disclosure Agreement (NDA)',
    summary:
      'An NDA is a legal contract designed to protect sensitive business information, proprietary data, trade secrets, and intellectual property from unauthorized disclosure during partnership discussions.',
    typicalRisks: [
      'Unilateral (one-way) confidentiality clauses protecting only the other party.',
      'Overly broad definitions of "Confidential Information" that include public data.',
      'Infinite duration limits on general business information (should be 2-5 years).',
      'Injunction clauses allowing the other party to freeze your business without proof of harm.',
    ],
    checklist: [
      'Ensure the agreement is Mutual if both sides are exchanging proprietary data.',
      'Check the standard exclusions list (public info, independently developed, already known).',
      'Define a reasonable term of confidentiality (e.g., 3 years from disclosure).',
      'Verify that the return or destruction of materials can be requested in writing.',
    ],
    faqs: [
      {
        question: 'Are unilateral NDAs safe to sign?',
        answer:
          'Unilateral NDAs are common but should only be signed if you are the party receiving information. If both parties are sharing information, a Mutual NDA is required.',
      },
    ],
  },
  {
    slug: 'promissory-note',
    category: 'finance-corporate',
    categoryLabel: 'Corporate & Finance',
    title: 'Analyze Promissory Notes & Loan Terms - PaperLens',
    description:
      'Spot interest rate calculations, late fee penalties, amortization methods, and acceleration clauses in promissory notes.',
    heading: 'Promissory Note & Loan Contract',
    summary:
      'A promissory note is a financial instrument containing a written, unconditional promise by one party (the maker/borrower) to pay a specific sum of money to another party (the payee/lender) under agreed terms.',
    typicalRisks: [
      'Usurious interest rates that violate state lending laws.',
      'Unfavorable "Acceleration" clauses making the entire balance due immediately upon a single late payment.',
      'Cognovit clauses or confession of judgment terms waiving your right to defend yourself in court.',
      'Compounding interest calculations.',
    ],
    checklist: [
      'Verify the principal amount, interest rate, and payment schedule details.',
      'Confirm the calculation method for late payment fees and grace periods.',
      'Check for a prepayment penalty clause if the borrower intends to pay off the loan early.',
      'Review any collateral or security details matching the promissory note terms.',
    ],
    faqs: [
      {
        question: 'What makes a promissory note legally enforceable?',
        answer:
          "A promissory note is enforceable if it contains the loan amount, interest rate, repayment terms, and the borrower's signature. It does not always require notarization to be valid.",
      },
    ],
  },
  {
    slug: 'personal-loan-agreement',
    category: 'finance-corporate',
    categoryLabel: 'Corporate & Finance',
    title: 'Draft a Personal Loan Agreement - PaperLens',
    description:
      'Protect family and peer loans. Create personal loan contracts with transparent interest, payment schedules, and default clauses.',
    heading: 'Personal Loan Agreement',
    summary:
      'A personal loan agreement is a contract detailing the terms of a loan between friends, family members, or peer-to-peer lenders. It establishes legal boundaries to prevent personal relationships from complicating financial obligations.',
    typicalRisks: [
      'Vague repayment schedules leading to outstanding unpaid debts.',
      'Lender failing to document interest, potentially triggering IRS gift tax reviews.',
      'No clear default terms or collection procedures.',
      'Disputes over verbal terms.',
    ],
    checklist: [
      'Specify the loan principal, payment due dates, and payment methods.',
      'Set an interest rate that satisfies the IRS Applicable Federal Rate (AFR) requirements.',
      'Include a clear clause outlining what happens in the event of default.',
      'Ensure both parties sign the agreement in the presence of a witness or notary.',
    ],
    faqs: [
      {
        question: 'Why should I charge interest on loans to family members?',
        answer:
          'The IRS requires loans over $10,000 between family members to have a minimum interest rate (AFR) to prevent the loan from being classified as a taxable gift.',
      },
    ],
  },
  {
    slug: 'equity-grant-notice',
    category: 'finance-corporate',
    categoryLabel: 'Corporate & Finance',
    title: 'Evaluate Equity Options & Option Grants - PaperLens',
    description:
      'Decode ISO, NSO, and RSU stock option grants. Understand vesting cliffs, post-termination exercise windows, and tax implications.',
    heading: 'Equity Stock Option Grant Notice',
    summary:
      'An equity grant notice outlines the details of stock options, RSUs, or SARs awarded to an employee. It details the number of shares, strike price, vesting schedules, and option classification (ISO vs NSO).',
    typicalRisks: [
      'Short Post-Termination Exercise Window (usually 90 days for ISOs) forcing option forfeiture.',
      'Accelerated vesting terms that do not apply during corporate acquisition events (Single vs Double Trigger).',
      'Alternative Minimum Tax (AMT) liabilities triggered upon exercise of ISOs.',
      'Complex vesting terms with performance metrics that are difficult to verify.',
    ],
    checklist: [
      'Identify the grant type (ISO, NSO, RSU) to determine tax filing rules.',
      'Confirm the strike price matches the fair market value (409A valuation) on the grant date.',
      'Calculate the vesting timeline details and notice the one-year cliff date.',
      'Check the expiration date (typically 10 years from the grant date).',
    ],
    faqs: [
      {
        question: 'What is the post-termination exercise window?',
        answer:
          'This is the time limit (usually 90 days) an ex-employee has to buy their vested options after leaving the company before they expire.',
      },
    ],
  },
  {
    slug: 'partnership-agreement',
    category: 'finance-corporate',
    categoryLabel: 'Corporate & Finance',
    title: 'Review Business Partnership Agreements - PaperLens',
    description:
      'Ensure fair business operations. Check profit allocation, voting thresholds, buy-out rules, and dissolution procedures.',
    heading: 'Business Partnership Agreement',
    summary:
      'A partnership agreement is a contract between co-owners of a business. It establishes the capital contributions, profit distributions, management roles, voting powers, and procedures for resolving deadlocks.',
    typicalRisks: [
      'Equal 50/50 voting distributions causing complete business deadlocks.',
      'No buy-sell provision for partner exits, deaths, or divorces.',
      'Vague definitions of partner capital call requirements.',
      'Unstructured liability splits leaving partners exposed to debt lawsuits.',
    ],
    checklist: [
      'Specify the capital contribution amounts and equity percentages for each partner.',
      'Define voting thresholds for major decisions (e.g. 75% for asset sales).',
      'Outline the buy-sell valuation formula to handle partner departures.',
      'Insert an arbitration clause to resolve internal business disputes.',
    ],
    faqs: [
      {
        question: 'What is a buy-sell provision in a partnership?',
        answer:
          "A buy-sell provision details how a partner's share of the business will be valued and purchased if they decide to leave, retire, or pass away.",
      },
    ],
  },
];
