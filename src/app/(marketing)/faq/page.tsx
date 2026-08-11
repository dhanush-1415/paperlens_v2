import type { Metadata } from 'next';
import Link from 'next/link';

import {
  LandingClosingCta,
  MarketingPageIntro,
  FaqAccordion,
} from '@/features/marketing';
import { ROUTES } from '@/shared/constants';

export const metadata: Metadata = {
  title: 'FAQ — Frequently Asked Questions',
  description: 'Everything you need to know about PaperLens — pricing, privacy, AI accuracy, supported document types, and how the Vault works.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/faq' },
};

/* --- FAQ data -------------------------------------------------------------- */

const FAQ_CATEGORIES = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    items: [
      {
        q: 'What is PaperLens?',
        a: 'PaperLens reads confusing documents for you. Got a letter from the IRS, your landlord, or your insurance company and have no idea what it means? Upload it — AI reads every line and tells you in plain English: what the document is, what you owe (if anything), the deadline, and exactly what to do next. No lawyer, no guessing.',
      },
      {
        q: 'Do I need to create an account?',
        a: "No. Just go to the homepage and upload your document — no sign-up, no credit card. You'll get a full AI summary in about 10 seconds. Create a free account if you want to save documents, chat with the AI, or set deadline reminders.",
      },
      {
        q: 'What kinds of documents can I upload?',
        a: "Pretty much anything that comes in an envelope and stresses you out. IRS and tax notices, medical bills, lease agreements, insurance denials, parking tickets, court letters, eviction notices, debt collection letters, student loan notices, employment contracts, and more. If it looks scary and official, PaperLens can decode it.",
      },
      {
        q: 'How do I upload a document?',
        a: "Four ways — pick whichever is easiest: (1) take a photo with your camera, (2) upload a file from your device (PDF, JPG, PNG, or WebP), (3) paste a URL if the document is online, or (4) paste the text directly. Hit Analyze and you'll get a plain-English breakdown in around 10 seconds.",
      },
      {
        q: "My photo isn't great — will it still work?",
        a: "Yes, as long as you can read the text yourself, PaperLens can too. Just keep the document flat and make sure there's decent light. Blurry photos or heavy shadows can reduce accuracy — a second shot in better light is worth it for important documents.",
      },
      {
        q: 'What do I get after uploading?',
        a: 'You get: a plain-English headline ("You owe $340 by March 15"), an urgency level (Critical / High / Moderate / Low), the exact deadline if there is one, and a clear action — pay, respond, file, or archive. No fluff, no lawyer speak.',
      },
    ],
  },
  {
    id: 'pricing',
    label: 'Pricing & Plans',
    items: [
      {
        q: 'Is PaperLens free?',
        a: 'Yes — the Free plan gives you 5 document uploads and 20 AI chat messages every month at no cost. No credit card required, ever. Upgrade to Pro only if you need more uploads, permanent document storage, or email deadline reminders.',
      },
      {
        q: 'What does Pro include?',
        a: "Pro Monthly ($4.99/mo) gives you 60 uploads, 200 AI chat messages, permanent Vault storage, results in 26 languages, folder organization, and email deadline reminders. Pro Yearly ($39/yr — just $3.25/month) bumps uploads to 75 and chat to 300, plus priority AI and early access to new features. That's less than the cost of one late fee.",
      },
      {
        q: 'Can I try before paying?',
        a: 'Yes. The free plan is permanent — not a trial. You get 5 uploads and 20 chat messages every month, forever, at no cost. When you want more, upgrade anytime.',
      },
      {
        q: 'Can I cancel anytime?',
        a: 'Yes. Cancel from account settings — no hoops, no phone calls. You keep Pro access until the end of the billing period you already paid for, then the subscription simply stops.',
      },
    ],
  },
  {
    id: 'privacy',
    label: 'Privacy & Security',
    items: [
      {
        q: 'Is my document safe to upload?',
        a: "Yes. Your document is sent over an encrypted connection, analyzed by AI, and the result is returned to you. We don't read it ourselves. All stored data is encrypted at rest. We don't sell your data, ever.",
      },
      {
        q: 'Do you keep a copy of my document?',
        a: "Only if you choose to save it to your Vault. Without an account, your document is analyzed and discarded — nothing is stored on our servers after the upload. With a free account, documents are temporarily saved and auto-deleted. Pro users get permanent Vault storage.",
      },
      {
        q: 'Is my document used to train AI?',
        a: "No. Your documents are never used to train any AI model — ours or anyone else's. They're used only to generate the analysis you asked for, then that's it.",
      },
      {
        q: 'How do I delete my account?',
        a: 'Go to Settings → Danger Zone → Delete Account. Your account is queued for permanent deletion within 48 hours. After 48 hours, everything is gone — documents, analysis, account — permanently.',
      },
      {
        q: 'My document has my SSN or bank number on it. Should I upload it?',
        a: "If you're privacy-conscious, cover those specific numbers with your finger or a sticky note before photographing. PaperLens doesn't need your full SSN to decode what a letter means. We're also building on-device redaction that will blur sensitive numbers before anything leaves your phone.",
      },
    ],
  },
  {
    id: 'ai-accuracy',
    label: 'AI & Accuracy',
    items: [
      {
        q: 'How accurate is it?',
        a: "Very accurate for standard printed documents — IRS letters, medical bills, lease agreements, etc. The AI reads the full document, not just snippets. That said, always double-check the original before taking action on legal or financial matters. PaperLens is your first read, not your last.",
      },
      {
        q: 'What languages does PaperLens support?',
        a: 'PaperLens can read documents in any language and give you the summary in your language. Supported output languages include English, Spanish, French, German, Hindi, Arabic, Korean, Thai, Tamil, Telugu, Bengali, Japanese, Chinese, and 13 more.',
      },
      {
        q: 'What if the AI gets something wrong?',
        a: 'It can happen, especially with unusual formatting or faded text. Always compare the summary with your original document. For anything with legal or financial consequences — verify directly or consult a professional.',
      },
      {
        q: 'Is this legal advice?',
        a: "No. PaperLens explains what a document says — it doesn't tell you what you're legally required to do. For anything involving a court, a lawsuit, or a significant financial penalty, talk to a lawyer or CPA.",
      },
    ],
  },
  {
    id: 'features',
    label: 'Features',
    items: [
      {
        q: 'What is the Vault?',
        a: 'Your Vault is a private, encrypted library of every document you\'ve uploaded and saved. Each document keeps its full AI summary, urgency rating, deadline, and action — all searchable, all accessible from any device.',
      },
      {
        q: 'How do email reminders work?',
        a: "After uploading a document with a deadline, set a reminder with one tap. On that date, you'll get an email with a quick recap of what the document says and what you need to do — no app to open, no notification to configure. Email reminders are a Pro feature.",
      },
      {
        q: 'Can I ask the AI questions about my document?',
        a: 'Yes — after uploading, open the chat tab and ask anything. "Do I actually owe this?" "What happens if I miss the deadline?" "Is there a way to dispute this?" The AI answers based on your exact document, not generic knowledge.',
      },
      {
        q: 'Can I export my data?',
        a: "Yes. Go to account settings and export all your vault data as a JSON file anytime — it's your data.",
      },
    ],
  },
];

/* --- JSON-LD -------------------------------------------------------------- */

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_CATEGORIES.flatMap(({ items }) =>
    items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    }))
  ),
};

export default function FaqPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <MarketingPageIntro
        eyebrow="Help & Support"
        heading="Frequently Asked Questions"
        lede="Everything you need to know about PaperLens — from how the AI works to how we protect your data. Can't find what you're looking for? Reach out to support."
      />

      <section className="w-full py-24 relative overflow-hidden bg-canvas">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(var(--brand-primary-rgb),0.06),transparent_80%)] pointer-events-none" />
        
        <div className="w-[95%] md:w-[90%] lg:w-[80%] mx-auto relative z-10 flex flex-col gap-24">
          
          {/* Categories Nav */}
          <nav
            aria-label="FAQ categories"
            className="flex flex-wrap justify-center gap-3"
          >
            {FAQ_CATEGORIES.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className="inline-flex cursor-pointer items-center rounded-full border border-border-strong bg-surface-1/30 backdrop-blur-md px-6 py-2.5 text-sm font-bold text-text-secondary transition-all duration-300 hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary/30 shadow-sm"
              >
                {label}
              </a>
            ))}
          </nav>

          {/* FAQ Sections */}
          <div className="w-full max-w-4xl mx-auto space-y-24">
            {FAQ_CATEGORIES.map(({ id, label, items }) => (
              <section key={id} id={id} className="scroll-mt-32">
                <div className="flex items-center gap-6 mb-10">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-text-primary whitespace-nowrap">{label}</h2>
                  <div className="h-px w-full bg-gradient-to-r from-border-strong to-transparent" />
                </div>
                <FaqAccordion items={items} />
              </section>
            ))}
          </div>
          
        </div>
      </section>

      <LandingClosingCta
        ctaLabel="Analyze a document"
        reassurance="No card required · Deleted after analysis · Never used for training"
      />
    </>
  );
}
