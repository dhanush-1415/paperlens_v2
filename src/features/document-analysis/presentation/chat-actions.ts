'use server';

import { prisma } from '@/server/db/prisma';
import { requireSession } from '@/server/bootstrap';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export async function generateSuggestionsAction(documentId: string): Promise<string[]> {
  try {
    const session = await requireSession();

    // Verify ownership
    const docAnalysis = await prisma.documentAnalysis.findFirst({
      where: { id: documentId, ownerId: session.userId },
    });

    if (!docAnalysis) {
      return [];
    }

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: `You are an AI assistant. Based on the following document context, generate 3 short, specific questions a user might want to ask about it.
      Return ONLY a JSON array of strings, with no other text or markdown formatting.
      Document Summary: ${docAnalysis.summary || 'None'}
      Risks: ${docAnalysis.flags ? JSON.stringify(docAnalysis.flags) : 'None'}`,
    });

    try {
      const suggestions = JSON.parse(text);
      if (Array.isArray(suggestions)) {
        return suggestions.slice(0, 3).map((s) => String(s).trim());
      }
    } catch (e) {
      console.error('Failed to parse suggestions:', e);
    }
    return [];
  } catch (error) {
    console.error('Suggestions generation failed:', error);
    return [];
  }
}
