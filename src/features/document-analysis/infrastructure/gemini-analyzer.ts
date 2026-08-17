import 'server-only';

import { attempt } from '@/core/errors/boundaries';
import { uuid } from '@/shared/utils/id';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

import { 
  CLAUSE_CATEGORIES, 
  type AnalysisRequest, 
  type ClauseCategory, 
  type DocumentAnalyzer, 
  type RiskFlag, 
  type RiskLevel 
} from '../domain';

const SYSTEM_PROMPT = `You are PaperLens AI — an expert legal and document intelligence engine. 
Your task is to analyze the provided document and extract any potentially risky or notable clauses.

You MUST output an array of flags. For each flag, provide:
1. category: The closest matching category from the allowed list.
2. level: 'critical', 'caution', or 'safe'.
3. title: A short, plain-language headline (e.g., "Renews automatically").
4. excerpt: An EXACT, verbatim quote from the document text that contains the clause. This must be a perfect substring match.
5. explanation: Why it matters in simple terms.
6. recommendation: What the user should do about it (optional).

Be highly selective. Only flag clauses that represent a genuine restriction, penalty, or abnormal obligation.

You MUST also provide a high-level assessment of the document:
- summary: A precise, 2-3 sentence summary of what the document is, highlighting the most critical facts and any key dates or monetary amounts found.
- actionPlan: An array of 1 to 4 actionable steps the user should take. If no action is needed, include a step saying to keep it for their records.
- urgency: The overall urgency of the document: 'critical', 'medium', or 'low'.
- entities: Extract key entities (Names, companies, monetary amounts, important dates) with an iconHint (e.g. 'building', 'user', 'currency', 'calendar').
- legitimacy & confidence: Analyze the document for phishing, scam markers, or abnormal structure. Output legitimacy ('VERIFIED_FORMAT', 'UNVERIFIABLE', 'SUSPICIOUS') and confidence ('HIGH', 'MEDIUM', 'LOW').
- suggestedQuestions: Provide exactly 4 highly contextual questions the user could ask a Copilot about this document.

CRITICAL INSTRUCTION: If the provided file (audio, video, document, or image) contains NO discernible textual content, speech, or clauses (e.g. it is pure noise, an empty file, or an unrelated image), YOU MUST SET the \`isValidDocument\` boolean field to \`false\` and provide an \`invalidReason\` string explaining why. Otherwise, set \`isValidDocument\` to \`true\`.`;

const RISK_FLAG_SCHEMA = z.object({
  flags: z.array(z.object({
    category: z.enum([
      'auto_renewal', 'arbitration', 'liability_cap', 'unilateral_change',
      'termination_penalty', 'data_sharing', 'late_fee', 'indemnity',
      'non_compete', 'jurisdiction'
    ] as const),
    level: z.enum(['critical', 'caution', 'safe']),
    title: z.string(),
    excerpt: z.string().describe("Exact verbatim quote from the text. Must be an exact substring of the document."),
    explanation: z.string(),
    recommendation: z.string().optional(),
  })),
  summary: z.string().describe('A 2-3 sentence summary of the document, including key dates and monetary amounts if present.'),
  actionPlan: z.array(z.string()).describe('1-4 actionable steps for the user.'),
  urgency: z.enum(['critical', 'medium', 'low']),
  entities: z.array(z.object({
    label: z.string().describe('The type of entity (e.g., Effective Date, Counterparty)'),
    value: z.string().describe('The value (e.g., 2024-01-01, Acme Corp)'),
    iconHint: z.string().describe('A lucide-react icon name hint (e.g., calendar, user, building, currency, file-text)')
  })).describe('Key entities extracted from the document.'),
  legitimacy: z.enum(['VERIFIED_FORMAT', 'UNVERIFIABLE', 'SUSPICIOUS']),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  suggestedQuestions: z.array(z.string()).length(4).describe('Exactly 4 questions the user could ask the copilot about this document.'),
  transcription: z.string().optional().describe('If the input is an image or media file without text, provide the fully transcribed text (OCR) here so the user can read what you analyzed. If text was already provided, leave this empty.'),
  timeline: z.array(z.object({
    timestamp: z.string().describe('The timestamp in the video or audio (e.g., "12:04")'),
    riskLevel: z.enum(['critical', 'caution', 'safe']),
    description: z.string().describe('A brief description of what was discussed or agreed upon at this timestamp.')
  })).optional().describe('For video or audio files, map identified risks or key topics to specific timestamps.'),
  isValidDocument: z.boolean().default(true).describe('Set to false if the file contains no discernible text, clauses, or speech.'),
  invalidReason: z.string().optional().describe('If isValidDocument is false, explain why.'),
});

export function createGeminiAnalyzer(): DocumentAnalyzer {
  return {
    name: 'gemini-v1',

    async analyze(request: AnalysisRequest) {
      return attempt(async () => {
        const { text, documentType, media } = request;

        const promptContent: any[] = [
          { type: 'text', text: `Analyze the following document (Type: ${documentType}). Extract the risk flags.\n\nDocument text:\n${text || '[See attached media]'}` }
        ];

        if (media) {
          // Send image/media inline to Gemini
          promptContent.push({
            type: 'file',
            data: media.data,
            mimeType: media.mimeType, // newer ai sdk versions
            mediaType: media.mimeType, // older ai sdk versions
          } as any);
        }

        const { object } = await generateObject({
          model: google('gemini-2.5-flash'),
          system: SYSTEM_PROMPT,
          schema: RISK_FLAG_SCHEMA,
          messages: [
            {
              role: 'user',
              content: promptContent,
            }
          ],
          temperature: 0.1,
        });

        if (object.isValidDocument === false) {
          throw new Error(object.invalidReason || 'The uploaded file does not contain any discernible textual content or speech.');
        }

        const found: RiskFlag[] = [];
        const seen = new Set<ClauseCategory>();

        for (const flag of object.flags) {
          // Prevent spamming the same category multiple times
          if (seen.has(flag.category)) continue;
          seen.add(flag.category);

          let charStart = text.indexOf(flag.excerpt);
          let charEnd = 0;
          
          if (charStart === -1) {
            // Fallback: If AI hallucinates the exact wording, try to find a partial match
            // or default to 0 if completely hallucinated.
            const snippet = flag.excerpt.slice(0, 30);
            charStart = text.indexOf(snippet);
            if (charStart === -1) charStart = 0;
          }
          
          charEnd = charStart + flag.excerpt.length;

          found.push({
            id: uuid(),
            category: flag.category,
            level: flag.level,
            title: flag.title,
            excerpt: flag.excerpt,
            explanation: flag.explanation,
            recommendation: flag.recommendation,
            charStart,
            charEnd,
          });
        }

        return {
          flags: found as readonly RiskFlag[],
          summary: object.summary,
          actionPlan: object.actionPlan,
          urgency: object.urgency,
          entities: object.entities,
          legitimacy: object.legitimacy,
          confidence: object.confidence,
          suggestedQuestions: object.suggestedQuestions,
          transcription: object.transcription,
          timeline: object.timeline,
        };
      });
    },
  };
}
