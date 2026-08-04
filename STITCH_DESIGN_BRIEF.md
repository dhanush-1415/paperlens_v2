# PaperLens — Stitch Design Brief (All Public / Non-Auth Pages)

> **How to use this with Stitch**
> 1. Start a new Stitch project. Paste **PART 1 (Design System)** as your first prompt and let it generate the style foundation.
> 2. For **every screen after that**, paste the **STYLE PREAMBLE (PART 2)** followed by that screen's prompt from **PART 4**. Stitch loses context between screens — the preamble re-anchors it every time.
> 3. Generate **desktop first**, then ask Stitch for the mobile variant of the same screen ("Now generate the 390px mobile version of this screen, same design system").
> 4. Generate **dark theme first** (it's the hero look), then ask for the light variant.
> 5. `/logo` from the old app is an internal scratch page — deliberately excluded.

---

## PART 1 — MASTER DESIGN SYSTEM PROMPT

*(Paste this as your very first Stitch prompt.)*

```
Create the design system foundation for PaperLens — an AI product that decodes
intimidating real-world documents (IRS notices, eviction notices, medical bills,
debt-collection letters, leases, insurance denial letters, court summons, NDAs,
job offers, severance agreements) into plain English, surfaces the risks, and
tells you exactly what to do next and by when.

POSITIONING: "Don't sign what you don't understand."
This is not a cute consumer app. It is a calm, precise, expensive-feeling
instrument — the visual authority of Stripe, the restraint of Linear, the trust
of Mercury, the editorial confidence of a financial publication. The user
arrives scared and confused. Every design decision must move them from FEAR to
CLARITY to CONTROL.

═══════════════ TYPOGRAPHY ═══════════════
Display / hero headlines (40px+ only): Instrument Serif, weight 400, tracking
  -0.02em. Used ONLY on marketing and editorial surfaces. Occasional italic on a
  single emphasized word.
UI / body / buttons / nav: Geist Sans (fallback Inter Tight). Weights 400/500/600.
Data, document excerpts, clause quotes, deadlines, code: Geist Mono.
  Monospace is semantic here — anything quoted FROM the user's document renders
  in mono so it reads as evidence, never as marketing copy.

Type scale (px): 12, 13, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72
Line height: 1.15 for display, 1.5 for body, 1.6 for long-form editorial.
Body copy max measure: 68 characters. Never let a paragraph run wider.

═══════════════ COLOR ═══════════════
Brand accent — "Aurora Lens":
  primary          #5B8CFF
  primary-hover    #3B6FE8
  secondary        #A78BFA
  tertiary         #22D3EE
  signature gradient: linear-gradient(135deg, #22D3EE 0%, #5B8CFF 45%, #A78BFA 100%)
  Use the gradient sparingly: hero accents, the lens rim, one key stat, active
  nav indicator. Never as a full section background.

Semantic risk palette — RESERVED. Never use these decoratively, only to encode
actual document risk:
  critical  #F04438   caution  #F79009   safe  #12B76A   info  #5B8CFF

DARK THEME (this is the default and the hero look):
  canvas #08090B | surface-1 #0E1013 | surface-2 #14171B | raised card #191D22
  border-subtle #1E2329 | border-strong #2B3138
  text-primary #F5F7FA | text-secondary #A0A8B4 | text-tertiary #6B7480

LIGHT THEME (equal effort, not an afterthought — it is the "paper" mode):
  canvas #FCFCFD | surface-1 #FFFFFF | surface-2 #F7F8FA | raised card #F1F3F6
  border-subtle #E7EAEF | border-strong #D3D8E0
  text-primary #0A0C0F | text-secondary #4A525E | text-tertiary #79828F

Both themes must be fully designed. Every screen ships in both. Theme toggle
lives in the navbar with a smooth cross-fade, no flash.

═══════════════ SPACE, SHAPE, DEPTH ═══════════════
4px base unit, 8pt rhythm. Section vertical padding: 128px desktop / 80px tablet
  / 56px mobile. Content max-width 1200px, shell max-width 1440px, 24px gutters,
  12-column grid.
Radii: 8px inputs · 12px cards · 16px panels · 20px modals · 999px pills.
Depth in DARK theme: do NOT use drop shadows. Use a 1px border plus a 1px inset
  top highlight of rgba(255,255,255,0.06) so cards read as machined metal.
Depth in LIGHT theme: soft, wide, low-opacity shadows
  (0 1px 2px rgba(10,12,15,.04), 0 8px 24px rgba(10,12,15,.06)). Never harsh.
Borders do the heavy lifting in both themes. Hairlines everywhere.

═══════════════ MOTION ═══════════════
Micro (hover, toggle): 150ms. Standard (cards, popovers): 240ms.
Entrance / scroll reveal: 400–600ms, staggered 60ms per child.
Easing: cubic-bezier(0.16, 1, 0.3, 1) for everything. No bounce, no elastic.
Buttons: subtle magnetic pull toward cursor + 1px lift.
All motion respects prefers-reduced-motion.
Motion should feel like precision machinery, never like a toy.

═══════════════ SIGNATURE INTERACTION — "THE LENS" ═══════════════
The product's namesake and its one unmistakable visual idea. A draggable
circular lens (with the gradient rim and a faint chromatic-aberration edge)
floats over a rendered document. Inside the lens, the dense legal text is
replaced live by plain-English translation, with risk chips and a deadline
countdown. Outside the lens, the document stays intimidating and grey.
Drag it and the truth follows your cursor.
This interaction appears on the landing hero, /how-it-works, and every
/for/[slug] page. It is the brand.

═══════════════ CORE COMPONENT LIBRARY ═══════════════
Build these as reusable components:
1.  Button — primary (gradient border + solid fill), secondary (bordered ghost),
    tertiary (text + arrow), destructive. Sizes sm/md/lg. Loading + disabled states.
2.  Risk Chip — pill with dot + label: Critical / Caution / Safe / Info.
3.  Deadline Countdown — mono, "23 days left", turns caution then critical as it
    shrinks. This component is the emotional engine of the product.
4.  Document Card — thumbnail, doc type, risk summary, timestamp.
5.  Clause Row — original mono text on the left, plain-English on the right,
    expandable, with a "why this matters" note.
6.  Bento Cell — for feature grids, 3 sizes, hover-reveals a micro-animation.
7.  Stat Tile — big mono number, animated count-up on scroll, label beneath.
8.  Testimonial Card — avatar, quote, name, role, document type they decoded.
9.  Pricing Card — with "Most popular" ribbon variant.
10. FAQ Accordion — hairline dividers, smooth height animation, plus/minus morph.
11. Trust Bar — encryption, auto-delete, no-training-on-your-data, region badges.
12. Sticky CTA Bar — appears after 60% scroll, dismissible.
13. Command Palette (⌘K) — searches docs, blog, document types, FAQ.
14. Navbar + Footer (defined in PART 3).
15. Empty / Error / Loading states for every data surface. Skeletons, not spinners.

═══════════════ ACCESSIBILITY (non-negotiable) ═══════════════
WCAG 2.2 AA minimum on both themes. 4.5:1 body text, 3:1 UI. Visible 2px focus
ring in primary color with 2px offset. Full keyboard navigation. Risk is never
communicated by color alone — always color + icon + text label. Tap targets 44px
minimum. Semantic heading order.

═══════════════ HARD RULES ═══════════════
· No stock-photo people. Use rendered document artifacts, UI screenshots, and
  abstract optical/prism imagery.
· No emoji in the interface.
· No purple-blob "AI startup" gradients smeared over everything.
· No fake urgency, fake counters, fake scarcity, or confirm-shaming. This is a
  trust product handling people's legal and financial documents — one dark
  pattern destroys the entire value proposition. All urgency must come from the
  REAL deadline printed on the user's actual document.
· Every page must work perfectly at 390px, 768px, 1024px, 1440px, 1920px.
```

---

## PART 2 — STYLE PREAMBLE

*(Paste this at the top of **every** screen prompt in Part 4.)*

```
PaperLens design system. Premium fintech-grade, calm and precise — Stripe /
Linear / Mercury tier. Fonts: Instrument Serif for display headlines 40px+,
Geist Sans for all UI, Geist Mono for anything quoted from a user's document.
Dark theme canvas #08090B, surfaces #0E1013/#14171B/#191D22, borders #1E2329,
text #F5F7FA / #A0A8B4. Light theme canvas #FCFCFD, surfaces #FFFFFF/#F7F8FA,
borders #E7EAEF, text #0A0C0F / #4A525E. Accent #5B8CFF with #A78BFA and #22D3EE,
signature gradient 135deg cyan→blue→violet used sparingly. Risk colors reserved:
critical #F04438, caution #F79009, safe #12B76A. Radii 12px cards / 16px panels /
999px pills. Hairline 1px borders, dark theme uses inset top highlight instead of
shadows. Motion 240ms cubic-bezier(0.16,1,0.3,1). Content max-width 1200px,
12-col grid, section padding 128px desktop / 56px mobile. Fully responsive at
390/768/1024/1440px. Both dark and light themes. WCAG AA. No stock photos, no
emoji, no fake urgency.
```

---

## PART 3 — GLOBAL SHELL

### 3A. Navbar

```
[STYLE PREAMBLE]

Design the global marketing navbar for PaperLens.

Desktop: 64px tall, sticky, transparent over the hero and transitioning to a
frosted glass bar (backdrop-blur 20px, 80% surface opacity, 1px bottom hairline)
once the user scrolls past 40px.

Left: the PaperLens wordmark in Geist Sans 600 with a small optical-lens mark —
two overlapping apertures forming a subtle "P", stroked in the signature gradient.

Center: nav items — Product, Use Cases, Pricing, Resources, Security.
"Product" and "Resources" open wide mega-menu panels on hover:
  · Product panel: two columns — "How it works", "The Lens", "Deadline tracking",
    "Document vault", "Multi-language" — each with a 20px line icon, label, and
    one-line description. Right rail shows a live mini-preview of an analysis.
  · Resources panel: Blog (with 2 latest post cards), Document library (27 types),
    FAQ, Support, API docs.
Mega-menus animate open with a 240ms height+fade, hairline border, raised surface.

Right: a ⌘K search affordance (bordered pill showing the shortcut key), a
theme toggle (sun/moon that morphs, no icon swap-flash), "Log in" as a text link,
and "Analyze a document — free" as the primary gradient-bordered button.

Active route gets a 2px gradient underline that slides between items.

Mobile (390px): logo left, theme toggle + hamburger right. Hamburger opens a
full-screen sheet sliding up from the bottom with large 24px nav items, stagger-
revealed, the search field pinned at top, and the primary CTA pinned to the
bottom safe area as a full-width button.
```

### 3B. Footer

```
[STYLE PREAMBLE]

Design the global footer for PaperLens. Tall, editorial, confident — this is the
last impression, so it must feel like an established company, not a side project.

Top band: a final conversion block on surface-2 with a 1px top hairline — an
Instrument Serif headline "Stop guessing what your paperwork means.", one line of
supporting copy, a primary CTA "Analyze a document — free", and a reassurance
line in 13px text-tertiary: "No card required · Your file is deleted after
analysis · We never train on your documents."

Main grid, 5 columns on desktop:
  Product — How it works, Pricing, Security, Use cases, API
  Documents — IRS notices, Eviction & lease, Medical bills, Debt collection,
              Employment, "All 27 document types →"
  Resources — Blog, FAQ, Support, Status, Changelog
  Company — About, Careers, Contact, Press kit
  Legal — Privacy, Terms, Cookies, DPA, Sub-processors

Left of the grid: the logo mark, a one-sentence mission line, and a compact
language selector.

Trust strip above the bottom bar: horizontal row of badges with line icons —
AES-256 encryption at rest · TLS 1.3 in transit · Auto-delete after analysis ·
Never used for model training · GDPR & CCPA aligned. Muted, monochrome, 13px.

Bottom bar: © PaperLens, a legal disclaimer in text-tertiary 12px — "PaperLens
provides informational analysis, not legal or financial advice." — and social
icons (X, LinkedIn, GitHub) as 16px line icons that fill with the accent on hover.

Mobile: columns collapse to accordions, trust strip wraps to two lines, CTA block
becomes full-width.
```

### 3C. 404 / Not Found

```
[STYLE PREAMBLE]

Design a 404 page for PaperLens. Centered, generous whitespace, dark theme hero
feel. Large Instrument Serif "This page couldn't be decoded." with a mono "404"
chip above it. One line of helpful copy. A search input (same one as ⌘K) as the
primary recovery path, and below it four suggested destination cards: Analyze a
document, Browse document types, Read the blog, Contact support. A very subtle
animated optical-noise / lens-flare backdrop at 4% opacity. No cartoon
illustration, no mascot.
```

### 3D. Cookie Consent

```
[STYLE PREAMBLE]

Design a cookie consent banner for PaperLens. Bottom-left anchored card (not a
full-width bar, not a blocking modal), 400px wide, raised surface, 16px radius,
hairline border. Short honest copy, three equally weighted actions — "Accept all",
"Reject non-essential", "Customize" — with no visual trickery favoring accept.
Customize expands in place to show four toggle rows: Essential (locked on),
Analytics, Product improvement, Marketing — each with a one-line plain-English
explanation. Slides up with a 400ms ease. Mobile: full-width above the safe area.
```

---

## PART 4 — SCREEN PROMPTS (16 public pages)

### 1. `/` — Landing Page

**Goal:** convert a scared stranger into someone who has uploaded a document, in under 30 seconds.
**Emotion:** *"Finally, something that will just tell me what this means."*

```
[STYLE PREAMBLE]

Design the PaperLens landing page. This is the most important screen in the
company. Dark theme is the hero look.

SECTION 1 — HERO (100vh, dark)
Backdrop: near-black #08090B with a very slow-drifting prismatic light refraction
in the upper right at 8% opacity, and an ultra-fine 1px grid at 3% opacity that
fades out toward the bottom.
Eyebrow pill: mono 12px, "Trusted with 2.4M documents decoded" with a small live
green dot.
Headline (Instrument Serif, 72px desktop / 40px mobile, tracking -0.02em):
  "Don't sign what you don't understand."
Subhead (Geist Sans 20px, text-secondary, max 60ch):
  "Upload any IRS notice, lease, medical bill or contract. PaperLens explains it
  in plain English, flags what's risky, and tells you exactly what to do — and by
  when."
Primary CTA: "Analyze a document — free". Secondary: "Watch a 60-second demo →".
Micro-reassurance under the CTAs, 13px text-tertiary: "No signup to try · No card
· Deleted after analysis".

THE CENTERPIECE — right half on desktop, below CTAs on mobile:
An interactive LENS demo. A realistic rendering of an IRS CP2000 notice sits in a
tilted, subtly 3D-perspective card. A draggable circular lens with a gradient rim
hovers over it. Wherever the lens sits, the dense legal text is replaced live by
plain English in Geist Sans, with a red "Critical" risk chip and a mono deadline
countdown "Respond within 23 days". Outside the lens, the document stays grey and
intimidating. The lens auto-orbits slowly until the user grabs it. Small
instruction: "Drag the lens".

SECTION 2 — TRUST BAR
Thin band directly under the hero. Left: "Used by people facing" + a slow
horizontal marquee of document type pills (IRS CP2000 · Eviction notice · Medical
EOB · Debt collection · Non-compete · Court summons · Insurance denial). Right:
three mono stat tiles that count up on scroll — 2.4M documents decoded · 4.9/5
average rating · 38 languages.

SECTION 3 — THE PROBLEM (loss aversion, done honestly)
Section headline in Instrument Serif: "The scariest part isn't the document. It's
the deadline you didn't see."
Three cards, each showing a real consequence: a missed IRS response window, a
lease auto-renewal clause, a 30-day insurance appeal deadline. Each card renders
the actual buried clause in Geist Mono, dimmed, with the critical fragment
highlighted — then the plain-English consequence beneath it in normal type. Cards
tilt very slightly on hover with the highlight brightening.

SECTION 4 — HOW IT WORKS (3 steps, scroll-driven)
A sticky left column with the step number in huge Instrument Serif and the step
title; the right column scrolls through the matching visual.
  01 Drop it in — drag-and-drop zone accepting PDF, photo, screenshot, or pasted
     text; shows a file materializing with a scan-line sweep.
  02 Watch it decode — a streaming analysis panel where plain-English findings
     type in line by line, risk chips populating in real time.
  03 Know what to do — an action checklist with a deadline countdown, a
     "questions to ask" list, and a one-tap "Explain this to me like I'm 12"
     toggle.

SECTION 5 — CAPABILITIES BENTO
Asymmetric bento grid, 5 cells of varying size, each with a live micro-animation
on hover:
  · Risk radar — a radial severity chart sweeping across clauses (large cell)
  · Deadline tracking — a calendar with a countdown chip (tall cell)
  · Ask anything — a chat bubble thread about the document (wide cell)
  · 38 languages — a phrase morphing between scripts (small cell)
  · Private vault — documents stacking into an encrypted drawer (small cell)

SECTION 6 — DOCUMENT LIBRARY
"We already know your document." A 6-column responsive grid of 27 document-type
tiles, each with a line icon, name, and hover-revealing "Decode yours →" linking
to /for/[slug]. Includes a filter row: Tax · Housing · Medical · Debt ·
Employment · Legal. This section is the SEO internal-linking engine — make it
visually substantial, not a footnote.

SECTION 7 — SOCIAL PROOF
Masonry of testimonial cards. Each quote is specific and outcome-shaped ("It
caught a $4,300 error on my hospital bill I'd already agreed to pay"), with name,
role, and a small mono tag of the document type decoded. One large featured card
with a longer story. Beneath: a review-score row and press mentions as monochrome
wordmarks.

SECTION 8 — PRIVACY (objection handling)
Two-column: left, an Instrument Serif headline "Your documents are the most
sensitive thing you own. We treat them that way." Right, four hairline-divided
rows — encrypted in transit and at rest · deleted automatically after analysis ·
never used to train models · you can wipe everything in one click. Link to
/security.

SECTION 9 — PRICING TEASER
Compact 2-card preview (Free / Pro) with the full comparison behind "See full
pricing →". Free card leads with "10 documents a month, free forever".

SECTION 10 — FINAL CTA
Full-bleed dark panel, signature gradient hairline at top, Instrument Serif
headline, single primary CTA, reassurance line. Nothing else.

STICKY ELEMENT: after 60% scroll, a slim bottom bar slides up — "Still have that
document sitting on your desk?" + primary CTA + dismiss X.

MOBILE: hero collapses to headline → CTA → lens demo (touch-draggable). Bento
becomes a single column. Document library becomes a horizontally scrolling
carousel with snap points. Sticky CTA becomes a full-width thumb-zone button.
```

---

### 2. `/pricing` — Pricing

**Goal:** anchor value, make Pro the obvious choice, remove every risk objection.

```
[STYLE PREAMBLE]

Design the PaperLens pricing page. Confident and transparent — no asterisks, no
hidden tiers.

HEADER: Instrument Serif "Pricing that costs less than being wrong once."
Subhead referencing the real stakes. A monthly/annual segmented toggle with a
"Save 2 months" badge that animates in when annual is selected; prices morph with
a rolling-digit animation.

THREE PRICING CARDS (equal height, middle one elevated and ribboned "Most popular",
with a 1px signature-gradient border and a faint gradient glow):
  · FREE — $0. 10 documents / month, 20 follow-up questions, core risk analysis,
    English only. CTA "Start free".
  · PRO — the hero tier. 60 documents / month (75 on annual), 200 follow-up
    questions, re-analysis, all 38 languages, private encrypted vault, deadline
    reminders. CTA "Go Pro". Small line: "Most people upgrade after their second
    document."
  · BUSINESS / API — usage-based, "$29 base + $0.025 per scan beyond 1,000".
    Includes an interactive volume slider that live-computes monthly cost with a
    mono readout, plus SSO, audit log, DPA, priority support. CTA "Talk to sales".
Each card lists features as hairline-divided rows with check icons; features NOT
included appear dimmed with a minus, never hidden — honesty converts better here.

RISK-REVERSAL STRIP directly under the cards: four compact assurances — cancel
anytime in one click · no card to start · 14-day refund, no questions · your
documents stay yours.

COMPARISON TABLE: full feature matrix, sticky header row and sticky first column,
zebra hairlines, grouped sections (Analysis · Documents · Collaboration · Privacy
· Support). Rows reveal a tooltip on the info icon.

ROI / VALUE ANCHOR BLOCK: three mono stat tiles comparing PaperLens Pro to the
real-world alternative — an hour of a lawyer's time, a missed IRS deadline
penalty, an unnoticed billing error. Framed factually with sources, never as a
scare tactic.

TESTIMONIAL: a single wide card from a Pro user, quantified outcome.

FAQ ACCORDION: 8 pricing-specific questions — what happens when I hit my limit,
what if I cancel mid-month, do you store my documents, is this legal advice, can
I expense this, do you offer nonprofit or hardship pricing.

CLOSING CTA band.

MOBILE: cards stack with Pro first (not middle), comparison table becomes a
per-plan accordion, volume slider gets larger touch targets.
```

---

### 3. `/how-it-works` — How It Works

**Goal:** make the technology feel inevitable and trustworthy; convert the researcher.

```
[STYLE PREAMBLE]

Design the PaperLens "How it works" page — a scroll-driven, cinematic explainer.

HERO: Instrument Serif "From legal fog to a to-do list. In about 20 seconds."
with a compact version of the interactive lens demo.

THE PIPELINE — a sticky-scroll narrative with 5 stages. The left column pins the
stage number, title and description; the right column morphs through the visuals
as the user scrolls. A slim vertical progress rail with 5 nodes tracks position.
  01 INGEST — PDF, photo, screenshot or pasted text lands in the drop zone;
     OCR scan-lines sweep across a skewed photo of a letter and straighten it.
  02 UNDERSTAND — the document is segmented into labeled regions (sender, amount,
     deadline, clauses, fine print) with animated bounding boxes and mono labels.
  03 DECODE — split view: original mono legalese on the left, plain English
     typing in on the right, sentence by sentence, synchronized with highlights.
  04 ASSESS RISK — clauses sort themselves into Critical / Caution / Safe columns
     with a radial risk score assembling in the center.
  05 ACT — the output: a plain-English summary, an action checklist with
     deadlines, suggested questions to ask, and a draft response letter.

THE LENS, FULL WIDTH: a large interactive demo with a document selector above it
(IRS notice / lease / medical bill / job offer) so visitors can drag the lens
across whichever document is scaring THEM. This is the page's conversion moment —
place a CTA immediately beneath it: "Do this with your document →".

ACCURACY & LIMITS: an honest, trust-building section. Two columns — "What
PaperLens is very good at" vs "What PaperLens will not do" (it is not legal
advice, it does not file anything for you, it does not replace an attorney for
litigation). This candor is a conversion asset, not a liability. Style it with
equal visual weight, not as fine print.

PRIVACY PATH: a horizontal timeline of the document's journey — uploaded over
TLS 1.3 → processed in memory → encrypted at rest if vaulted → auto-deleted →
never trained on. Each node expands on hover.

SUPPORTED DOCUMENTS: compact grid linking into /for/[slug].
FAQ accordion. Final CTA band.

MOBILE: sticky-scroll becomes stacked full-width stages, each self-contained;
the lens demo becomes touch-draggable with a "tap to reveal" hint.
```

---

### 4. `/use-cases` — Use Cases Hub

**Goal:** self-segmentation — every visitor finds *their* exact situation and clicks through.

```
[STYLE PREAMBLE]

Design the PaperLens "Use cases" hub — the routing layer between a visitor's
specific fear and the /for/[slug] page that speaks to it.

HERO: Instrument Serif "Whatever landed in your mailbox, we've decoded it before."
Beneath it a prominent search field with the ⌘K styling — "Search your document
type…" — with live-filtering results and recent/popular suggestions.

CATEGORY FILTER: a sticky pill row — All · Tax & Government · Housing & Leases ·
Medical & Insurance · Debt & Credit · Employment · Legal & Contracts. Active pill
gets the gradient fill. Filtering re-flows the grid with a 240ms stagger.

SIX CATEGORY SECTIONS, each with:
  · a section header with a line icon, category name, and a one-line description
    of the emotional stakes for that category
  · a grid of document-type cards. Each card: line icon, document name, a
    one-line "what it actually means", a risk-level chip, and a hover state that
    lifts the card and reveals "Decode this →".
Categories and their documents:
  TAX & GOVERNMENT — IRS CP2000, IRS CP504 intent to levy, IRS CP14 balance due
  HOUSING & LEASES — apartment lease renewal, commercial lease, security deposit
    dispute, 3-day pay-or-quit notice, roommate agreement
  MEDICAL & INSURANCE — medical EOB, insurance denial letter, prior authorization,
    health insurance appeal, COBRA continuation notice
  EMPLOYMENT — job offer letter, non-compete, severance agreement, freelance
    contract
  LEGAL & CONTRACTS — small claims summons, subpoena duces tecum, NDA,
    child support order
  FINANCIAL — promissory note, personal loan agreement, equity grant notice,
    partnership agreement

"DON'T SEE YOURS?" panel: reassurance that PaperLens handles any document, with a
direct upload CTA.

Between sections 3 and 4, an inline conversion block: a single testimonial plus a
primary CTA, styled as a raised panel so it breaks the grid rhythm deliberately.

Closing CTA band.

MOBILE: filter pills scroll horizontally with snap; cards go to a single column;
search field becomes sticky under the navbar.
```

---

### 5. `/for/[slug]` — Document Type Landing Template (×27)

**Goal:** the SEO acquisition engine. Highest-intent traffic on the site — must convert hard.

```
[STYLE PREAMBLE]

Design the PaperLens document-type landing page TEMPLATE. This single layout
renders 27 times (IRS CP2000, eviction notice, medical EOB, non-compete,
severance agreement, etc.). Use "IRS CP2000 Notice" as the worked example, but
every element must be slot-based and reusable.

This page receives someone who just googled their document in a panic at 11pm.
Answer their question immediately — do not make them scroll for the payoff.

BREADCRUMB: Home / Use cases / Tax & Government / IRS CP2000 Notice.

HERO (asymmetric, 60/40):
  Left — a risk chip ("Critical · Time-sensitive"), Instrument Serif H1 "What an
  IRS CP2000 notice actually means", a 2-sentence direct answer in 20px
  text-secondary that resolves the query without scrolling, a mono deadline
  callout "You typically have 30 days to respond", and the primary CTA "Decode my
  CP2000 — free".
  Right — a realistic rendering of the actual document with the interactive lens
  pre-positioned over the most alarming paragraph, already showing the plain-
  English translation. Auto-demonstrates once on load, then invites dragging.

"AT A GLANCE" STRIP: four mono stat tiles — Typical deadline · Who sends it ·
What it usually costs · Can it be disputed. Instantly scannable.

ANATOMY OF THE DOCUMENT: the centerpiece. A full rendering of the document with
numbered hotspot markers on each important region. Clicking a marker opens a side
panel explaining that region in plain English, with the original text quoted in
Geist Mono. On mobile this becomes a vertical stepper through the same hotspots.

"WHAT IT MEANS" — long-form editorial section, 68ch measure, Instrument Serif
subheads, pull-quotes, and inline mono blocks for quoted clause text.

RISK BREAKDOWN: a table of the common clauses/line items in this document type,
each with a risk chip and a plain-English consequence.

WHAT TO DO NEXT: a numbered action checklist with mono deadline chips, styled as
a genuinely usable to-do list, plus a "questions to ask" list and a note on when
to involve a professional.

MID-PAGE CONVERSION BLOCK: raised panel — "Yours will have different numbers.
Get the version that reads YOUR notice." + upload CTA + reassurance line.

FAQ ACCORDION: 8–10 questions specific to this document type, written for
featured-snippet capture. Marked up as an FAQ block.

RELATED DOCUMENTS: 4 cards linking to sibling /for/ pages.
RELATED READING: 3 blog post cards.

CLOSING CTA band.

A slim reading-progress bar sits under the navbar. A floating "Decode mine" pill
follows the user from 25% scroll on mobile.

MOBILE: hero stacks with the lens demo directly under the CTA; anatomy hotspots
become a swipeable stepper; sticky CTA pill in the thumb zone.
```

---

### 6. `/blog` — Blog Index

**Goal:** establish authority, capture organic traffic, feed email list.

```
[STYLE PREAMBLE]

Design the PaperLens blog index. Editorial and premium — should feel like a
respected financial publication, not a SaaS content farm. 56 posts, so
discoverability matters as much as beauty.

MASTHEAD: Instrument Serif "The PaperLens Files" with a one-line description —
"Plain-English guides to the documents that decide your money, your housing, and
your rights." A hairline rule beneath, and a compact newsletter capture on the
right: single email field + "Subscribe" + "12,000 readers · one email a week ·
unsubscribe in one click".

FEATURED POST: full-width editorial card — large title in Instrument Serif, a
generated abstract document-texture image, category chip, read time, author, and
a 2-line excerpt. Hover lifts the whole card and brightens the image.

FILTER ROW (sticky): category pills — All · IRS & Tax · Housing · Medical ·
Debt · Employment · Legal · Product. Plus a search field and a sort control
(Newest / Most read).

POST GRID: 3 columns desktop, 2 tablet, 1 mobile. Each card — thumbnail with a
subtle duotone treatment in brand colors, category chip, Instrument Serif title
(2-line clamp), 2-line excerpt, and a footer row with mono read-time and date.
Cards use hairline borders, not shadows, in dark theme.

Every 6th grid position is replaced by an inline CTA cell styled distinctly —
alternating between "Decode a document free" and a newsletter capture — so the
grid rhythm sells without interrupting.

PAGINATION: "Load more" button plus a numbered fallback.

SIDEBAR (desktop only, right rail, sticky): Most read this week (numbered list),
Browse by document type (links to /for/), and a compact upgrade card.

Closing newsletter band with social proof.

MOBILE: filters scroll horizontally, sidebar content moves to the bottom as
stacked sections, newsletter capture becomes full-width.
```

---

### 7. `/blog/[slug]` — Blog Post Template

**Goal:** exceptional reading experience + convert readers mid-article.

```
[STYLE PREAMBLE]

Design the PaperLens blog post template. Long-form reading is the product here —
typography does most of the work.

HEADER: breadcrumb, category chip, Instrument Serif H1 at 56px, a 20px standfirst
in text-secondary, then a byline row — author avatar, name, role, publish date,
mono read time, and share buttons (copy link, X, LinkedIn) as 16px line icons.
A full-width hero image with a duotone treatment. Reading progress bar under the
navbar.

LAYOUT: three columns on desktop — a sticky left rail with the table of contents
(active section highlighted with a gradient left-border, smooth scroll), a 68ch
center content column, and a sticky right rail with share controls and a compact
conversion card.

ARTICLE TYPOGRAPHY: 18px/1.7 body, Instrument Serif H2s with generous top margin,
sans H3s, hairline-ruled section breaks. Style these content elements distinctly:
  · Pull-quote — large Instrument Serif italic with a gradient left rule
  · Callout boxes — Info / Caution / Critical variants using the risk palette,
    each with icon + label
  · Document excerpt block — Geist Mono on surface-2 with a "From an actual
    CP2000 notice" caption and highlighted critical fragments
  · Key-takeaways summary card — pinned near the top, bulleted, raised surface
  · Comparison tables with sticky headers
  · Inline links in accent color with a 1px underline that thickens on hover
  · Numbered step lists with large mono numerals

INLINE CONVERSION UNITS (2 per article, placed after the 3rd section and near the
end): a raised panel with a relevant one-liner and an upload CTA — contextual to
the article's document type, not generic.

AUTHOR CARD at the end: avatar, bio, credentials. Credentials matter for trust on
legal/financial content — make them prominent.

END BLOCK: newsletter capture, then "Related reading" (3 cards), then "Decode
this document type" linking to the matching /for/ page.

MOBILE: TOC collapses into a dropdown pinned under the navbar; rails move inline;
share becomes a floating action button.
```

---

### 8. `/security` — Security & Trust

**Goal:** kill the single biggest objection — *"am I really uploading my IRS letter to a website?"*

```
[STYLE PREAMBLE]

Design the PaperLens security page. This page must feel like it was written by
engineers, not marketers. Restrained, dense, precise. Slightly cooler and more
technical than the rest of the site — more mono, more hairlines, fewer gradients.

HERO: Instrument Serif "You're about to upload the most sensitive document you
own. Here's exactly what happens to it." No hype, no shield-with-a-checkmark
cliché.

DATA JOURNEY DIAGRAM: the hero visual — an interactive horizontal flow showing
the document's full lifecycle: your device → TLS 1.3 → ingest → in-memory
processing → model inference (no retention) → encrypted storage only if you vault
it → auto-deletion. Each node is clickable and expands to a technical detail
panel with the actual mechanism named. Show what is NOT stored as clearly as what
is.

CONTROLS GRID: 8 cards, each with a line icon, a plain-English claim, and the
technical implementation underneath in Geist Mono — AES-256-GCM at rest ·
TLS 1.3 in transit · zero-retention inference · row-level security · scoped
access tokens · automatic deletion policy · encrypted vault with per-user keys ·
full audit logging.

"WE DO NOT" SECTION: a deliberately blunt list with strike-through-red X icons —
we do not train models on your documents · we do not sell or share your data ·
we do not allow employee access to your files · we do not retain documents after
analysis unless you explicitly vault them.

COMPLIANCE ROW: GDPR, CCPA, SOC 2 (mark status honestly — "in progress" if it is),
DPA available, sub-processor list, data residency options. Monochrome badges.

VULNERABILITY DISCLOSURE: a panel with the security contact, PGP key in mono,
scope, and response-time commitment.

YOUR CONTROLS: what the user can do — export everything, delete everything in one
click, revoke sessions, see access history. Each with a screenshot-style visual.

SECURITY FAQ accordion. Closing CTA that is quieter than elsewhere on the site —
"Try it with a document you're comfortable with first."

MOBILE: the data journey becomes a vertical timeline; grids to single column.
```

---

### 9. `/about` — About

**Goal:** turn a tool into a company people root for.

```
[STYLE PREAMBLE]

Design the PaperLens about page. Editorial, human, confident — but no
stock-photo-team energy.

HERO: Instrument Serif "We started PaperLens because a letter shouldn't be able
to ruin your month." A single, specific founding story told in 3 short
paragraphs at 20px — a real document, a real deadline missed, a real consequence.
Specificity is the trust mechanism; keep it concrete.

MISSION PANEL: full-bleed surface-2 with one large Instrument Serif statement and
three supporting principles as hairline-divided rows — Plain English is a right,
not a feature · Your documents are yours · Clarity without false confidence
(we tell you when to get a lawyer).

BY THE NUMBERS: four mono stat tiles counting up — documents decoded, languages,
deadlines caught, average time to clarity.

HOW WE BUILD: three columns — Accuracy (how outputs are evaluated and what the
error handling looks like), Privacy (link to /security), Honesty (we say "I'm not
sure" instead of guessing). Each with a line icon and a short paragraph.

TEAM: a grid of member cards — monochrome portrait that colorizes on hover, name,
role, and a one-line "the document that made me care about this". If the team is
small, lean into it — "Six people, one problem" reads stronger than fake scale.

BACKERS / ADVISORS: monochrome wordmark row, if applicable.

TIMELINE: a vertical rail of milestones with mono dates and short entries.

CAREERS TEASER: a panel with open-roles count and a CTA.

Closing CTA band.

MOBILE: everything to single column, team grid to 2 columns, timeline stays
vertical with a thinner rail.
```

---

### 10. `/faq` — FAQ

**Goal:** remove every remaining objection without a support ticket.

```
[STYLE PREAMBLE]

Design the PaperLens FAQ page. Utility-first but still premium.

HERO: Instrument Serif "Questions, answered." with a large prominent search field
that live-filters questions as you type, highlighting matched terms.

LAYOUT: sticky left sidebar with category navigation (active item gets a gradient
left-border), content column on the right. Categories: Getting started · How the
analysis works · Accuracy & limitations · Privacy & security · Pricing & billing ·
Documents & file types · Languages · Account & data · API & business.

ACCORDIONS: hairline-divided rows, generous 20px padding, plus-to-minus icon
morph, 240ms height animation. Answers support rich content — links, mono
document excerpts, callout boxes, and step lists. Each answer ends with a subtle
"Was this helpful? 👍/👎" as text buttons (no emoji — use line icons).

POPULAR QUESTIONS strip at the top: 6 chips that jump to the most-asked items.

INLINE CONVERSION: after the "How the analysis works" category, a raised panel —
"Easier to just see it" + upload CTA.

STILL STUCK panel at the bottom: three routes — search the docs, email support
with the response-time commitment, or check status. Links to /support.

MOBILE: sidebar becomes a horizontally scrolling pill row that sticks under the
navbar; search stays pinned.
```

---

### 11. `/support` — Support / Contact

**Goal:** make help feel fast and human; capture qualified sales leads.

```
[STYLE PREAMBLE]

Design the PaperLens support page.

HERO: Instrument Serif "Get help." with a response-time commitment stated plainly
in mono — "Median first reply: 3h 12m · Pro: under 1h" — and a live status chip
(green dot, "All systems operational") linking to the status page.

THREE ROUTE CARDS at the top, equal weight:
  · Search the help center — with an inline search field
  · Email support — opens the form below
  · Talk to sales — for business/API enquiries, links to a qualification form

HELP CENTER PREVIEW: a 6-card grid of top articles with categories, plus
"Browse all articles →".

CONTACT FORM: a well-crafted two-column form on a raised panel — name, email, a
topic select (Billing / Technical / Privacy request / Accuracy report / Business
& API / Something else), a document-type field that appears conditionally, a
message textarea with a character counter, and an optional file attachment zone
with a clear privacy note about what happens to attachments. Inline validation
with helpful, non-scolding error messages. A clear success state showing the
ticket reference in mono.

ESCALATION PATHS panel: security disclosures → security@ · privacy/GDPR requests
→ privacy@ · press → press@ · legal → legal@. Each with the expected response
window.

COMMUNITY / STATUS row: status page, changelog, and API docs links.

MOBILE: route cards stack, form goes single-column with 44px+ inputs and a sticky
submit button.
```

---

### 12–14. `/privacy`, `/terms`, `/cookies` — Legal Template

**Goal:** legally complete but genuinely readable — legibility here is a trust signal.

```
[STYLE PREAMBLE]

Design the PaperLens legal document TEMPLATE, used for /privacy, /terms and
/cookies. Most companies make these ugly. Making them beautiful and readable is a
direct trust signal for a product that handles legal documents — the irony would
be fatal.

HEADER: Instrument Serif title, a mono "Last updated 3 August 2026" chip, an
estimated read time, and a "Download PDF" ghost button.

PLAIN-ENGLISH SUMMARY — the signature move. Directly beneath the header, a raised
panel titled "The short version" with 5–7 bullets summarizing the entire document
in genuinely plain language, plus a clearly worded disclaimer that the full text
below is what legally governs. This is PaperLens doing to its own legal docs what
it does for users — lean into it hard.

LAYOUT: sticky left TOC with nested sub-sections and active-section highlighting;
68ch content column; a small "back to top" pill that appears after scrolling.

CONTENT STYLING: numbered sections with mono section numbers, 17px/1.7 body,
hairline dividers, defined terms rendered in a distinct style with a hover
tooltip giving the definition, tables for data categories and retention periods,
and callout boxes for the parts users most need to notice.

For /privacy specifically: include a data-inventory table (what we collect · why ·
how long · legal basis), a sub-processor table, and a "Your rights" section with
an actionable button per right (export, delete, correct, object).

For /cookies specifically: include a live cookie table (name · purpose · duration ·
type) and an embedded preference panel with the same toggles as the consent
banner, so users can change settings without leaving the page.

FOOTER of the doc: contact block for the DPO/legal, plus links to the sibling
legal pages and a version history list.

MOBILE: TOC becomes a collapsible dropdown; tables scroll horizontally inside
their own container so the page body never scrolls sideways.
```

---

### 15. `/share/[token]` — Public Shared Analysis

**Goal:** the viral loop. A non-user sees the product's full value on someone else's document and signs up.

```
[STYLE PREAMBLE]

Design the PaperLens public shared-analysis page. Someone was sent this link by a
friend, a family member, or a client. They are NOT logged in. This page is the
product's best advertisement — it must showcase real output quality and convert.

TOP BANNER: a slim bar — "Shared analysis · Read-only · Expires in 6 days" in
mono, with a lock icon, plus a right-aligned "Analyze your own document" CTA.
Make clear this is a private link, not public content.

DOCUMENT HEADER: document type chip, an overall risk score as a radial meter with
the risk color, the analysis date in mono, and a prominent deadline countdown if
the document has one.

MAIN LAYOUT, two columns on desktop:
  LEFT (sticky) — the rendered document preview with clickable clause hotspots,
  a page navigator, and zoom controls. Redaction indicators show clearly where
  the sharer chose to hide personal information.
  RIGHT (scrollable) — the analysis:
    · "In one sentence" summary card, raised, largest text on the page
    · Key findings list, each with a risk chip, plain-English explanation, and
      the original clause quoted in Geist Mono, expandable
    · Deadlines & actions checklist with mono countdown chips
    · Questions to ask
    · Amounts & dates extracted into a clean mono table

LOCKED / TEASED ELEMENTS: the "Ask a follow-up question" panel and the
"Re-analyze" action render in a visually complete but disabled state with a
tasteful lock overlay and the line "Ask your own questions about this document —
free". This is the conversion mechanism: show the capability, gate the action,
never hide it.

CONVERSION BLOCK at the natural end of the analysis: raised panel — "Got a
document like this? Decode it free in 20 seconds." + upload CTA + reassurance.

FOOTER of the analysis: the disclaimer that this is informational and not legal
advice, plus a "Report this share" link.

EXPIRED / INVALID TOKEN STATE: design this too — a centered card explaining the
link expired or was revoked, with a CTA to analyze your own document. Calm, not
alarming.

MOBILE: document preview becomes a collapsible top panel with a "View document"
toggle; the analysis is the primary scroll; sticky CTA at the bottom.
```

---

### 16. `/order-failed` — Checkout Cancelled

**Goal:** recover the sale without shaming.

```
[STYLE PREAMBLE]

Design the PaperLens checkout-cancelled page. The user backed out of Stripe
checkout. Tone: completely non-judgmental, genuinely helpful. No confirm-shaming,
no guilt, no "are you sure you want to miss out".

Centered card on a dark canvas with a very subtle ambient wash. A muted caution
icon (never red — nothing bad happened). Instrument Serif "No charge was made."
Supporting line: "Your checkout was cancelled. Nothing was billed and your
account is unchanged."

THREE RECOVERY ROUTES, presented as equal-weight cards:
  · Try again — returns to checkout, primary button
  · Keep using Free — restates what Free includes (10 documents/month), so
    leaving still feels like a win
  · Something go wrong? — links to support with a pre-filled billing topic

Below, a quiet reassurance row: accepted payment methods as monochrome icons,
"Secured by Stripe", "Cancel anytime", "14-day refund".

Optional, subtle: a single-line inline question — "Mind telling us why?" — with
four one-tap chips (Too expensive · Payment issue · Just exploring · Changed my
mind). One tap submits and shows a plain thank-you. No modal, no required field.

Small link back to /pricing and to the landing page.

MOBILE: cards stack, primary CTA full-width in the thumb zone.
```

---

## PART 5 — CROSS-CUTTING REQUIREMENTS

*(Append to any screen prompt if Stitch drifts.)*

```
Apply to every screen:

RESPONSIVE — design at 390px, 768px, 1024px, 1440px. Mobile is not a
compressed desktop: reorder for thumb reach, put primary CTAs in the bottom third,
convert side rails to accordions or bottom sheets, make wide tables and diagrams
scroll inside their own container so the page body never scrolls horizontally.
Minimum 44px tap targets. Test the navbar, the sticky CTA, and every form.

BOTH THEMES — dark and light are equally finished. Dark uses borders and inset
highlights for depth; light uses soft wide shadows. The theme toggle cross-fades
without a flash. Every risk color must clear 4.5:1 against both canvases.

STATES — for every component and data surface, design: default, hover, focus-
visible, active, loading (skeleton, never a spinner), empty, error, and success.

CONVERSION MECHANICS present site-wide:
  · Value before signup — anyone can analyze a document without an account; the
    account gates saving, history and follow-up questions.
  · One primary CTA per viewport. Never two competing primaries.
  · Reassurance micro-copy under every CTA (no card · deleted after analysis ·
    never trained on).
  · Sticky CTA appears after 60% scroll, always dismissible, never re-appears
    after dismissal in the session.
  · Social proof within one scroll of every primary CTA.
  · Anchoring on /pricing: three tiers, middle highlighted, annual savings shown
    as real months saved.
  · Risk reversal stated explicitly wherever money is mentioned.
  · Every long-form page (blog, /for/, FAQ) carries two contextual inline
    conversion units, matched to that page's document type.
  · Internal linking is a design element: /for/ ↔ /blog ↔ /use-cases cross-link
    visibly, not just in the footer.

ETHICS — all urgency comes from the real deadline on the user's real document.
No fabricated countdowns, no fake viewer counts, no confirm-shaming, no
pre-checked upsells, no dark patterns of any kind. This is a trust product; the
design must be more honest than it needs to be.
```

---

## Appendix — Screen Checklist

| # | Route | Prompt | Priority |
|---|---|---|---|
| — | Navbar / Footer / 404 / Cookie banner | Part 3 | Build first |
| 1 | `/` | Part 4.1 | P0 |
| 2 | `/pricing` | Part 4.2 | P0 |
| 3 | `/how-it-works` | Part 4.3 | P0 |
| 4 | `/use-cases` | Part 4.4 | P1 |
| 5 | `/for/[slug]` ×27 | Part 4.5 | P0 (SEO engine) |
| 6 | `/blog` | Part 4.6 | P1 |
| 7 | `/blog/[slug]` ×56 | Part 4.7 | P1 |
| 8 | `/security` | Part 4.8 | P0 (objection killer) |
| 9 | `/about` | Part 4.9 | P2 |
| 10 | `/faq` | Part 4.10 | P1 |
| 11 | `/support` | Part 4.11 | P2 |
| 12 | `/privacy` | Part 4.12–14 | P2 |
| 13 | `/terms` | Part 4.12–14 | P2 |
| 14 | `/cookies` | Part 4.12–14 | P2 |
| 15 | `/share/[token]` | Part 4.15 | P1 (viral loop) |
| 16 | `/order-failed` | Part 4.16 | P2 |
