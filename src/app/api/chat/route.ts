import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { requireSession } from '@/server/bootstrap';
import { prisma } from '@/server/db/prisma';

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const { messages, documentId } = await req.json();

    if (!documentId) {
      return new Response('Missing documentId', { status: 400 });
    }

    // Verify ownership
    const docAnalysis = await prisma.documentAnalysis.findFirst({
      where: { id: documentId, ownerId: session.userId }
    });

    if (!docAnalysis) {
      return new Response('Document not found', { status: 404 });
    }

    // Upsert a chat session
    const chatSession = await prisma.chatSession.findFirst({
      where: { documentId, userId: session.userId }
    });

    let currentSessionId = chatSession?.id;

    if (!currentSessionId) {
      const newSession = await prisma.chatSession.create({
        data: {
          userId: session.userId,
          documentId
        }
      });
      currentSessionId = newSession.id;
    }

    const lastUserMessage = messages[messages.length - 1];

    if (lastUserMessage.role === 'user') {
      await prisma.chatMessage.create({
        data: {
          sessionId: currentSessionId,
          role: 'user',
          content: lastUserMessage.content,
        }
      });
    }

    // Provide context to the AI (extract flags as context)
    const flagsContext = docAnalysis.flags ? JSON.stringify(docAnalysis.flags, null, 2) : 'No risks found.';
    const systemPrompt = `You are a Legal AI Copilot for a platform called PaperLens. 
Your goal is to answer questions about a user's document and the risks flagged in it. 
Be professional, concise, and do not provide binding legal advice (always remind them you are an AI assistant if they ask for legal representation).
Here are the risks flagged in the document for your context:\n\n${flagsContext}

Here is the RAW FULL TEXT of the document:\n\n${docAnalysis.rawText}`;

    const result = streamText({
      model: google('gemini-1.5-pro'),
      system: systemPrompt,
      messages,
      async onFinish({ text }) {
        // Save the assistant's response to the database
        await prisma.chatMessage.create({
          data: {
            sessionId: currentSessionId!,
            role: 'assistant',
            content: text,
          }
        });
      }
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response(error.message || 'Internal Server Error', { status: 500 });
  }
}
