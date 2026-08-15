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

    // Provide context to the AI
    const flagsContext = docAnalysis.flags ? JSON.stringify(docAnalysis.flags, null, 2) : 'No risks found.';
    
    const systemParts = [
      'You are PaperLens, an elite legal and bureaucratic assistant.',
      'Below is the metadata AND the full raw text of the user\'s document.',
      'You must answer questions based on the FULL TEXT. Do not say you only have a summary.',
      'Be concise. Use plain language that a non-lawyer can understand.',
      'If the answer is genuinely not covered by the document, say so honestly.',
      'LANGUAGE MATCHING: Reply in the same language as the document summary. If the user writes in a different language, reply in that language instead.',
      '',
      '--- DOCUMENT METADATA ---',
      `Title: ${docAnalysis.title}`,
      `Summary: ${docAnalysis.summary || 'None'}`,
      `Urgency: ${docAnalysis.urgency || 'None'}`,
      `Deadline: ${docAnalysis.deadlineDate ? docAnalysis.deadlineDate.toISOString() : 'None'}`,
      `Flags/Risks: ${flagsContext}`,
      '--- END METADATA ---',
      '',
      '--- FULL DOCUMENT TEXT ---',
      docAnalysis.rawText || 'No text extracted.',
      '--- END FULL TEXT ---'
    ];

    const systemInstruction = systemParts.join('\n');

    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: systemInstruction,
      messages,
      async onFinish({ text }) {
        try {
          await prisma.chatMessage.create({
            data: {
              sessionId: currentSessionId!,
              role: 'assistant',
              content: text,
            }
          });
        } catch (dbErr) {
          console.error('[chat-stream] Database message insert failed:', dbErr);
        }
      }
    });

    const ERROR_SENTINEL = '__CHAT_ERROR__';
    const encoder = new TextEncoder();
    const safeStream = new ReadableStream({
      async start(controller) {
        const reader = result.textStream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(encoder.encode(value));
          }
        } catch (streamErr: any) {
          const errMsg  = streamErr?.message || String(streamErr);
          const isQuota = /429|rate.?limit|quota|resource.?exhausted/i.test(errMsg);
          const isPolicy = /safety|policy|blocked/i.test(errMsg);
          controller.enqueue(
            encoder.encode(`${ERROR_SENTINEL}:${isPolicy ? 'CONTENT_POLICY' : isQuota ? 'RATE_LIMIT' : 'GENERAL'}`)
          );
        } finally {
          reader.releaseLock();
          controller.close();
        }
      },
    });

    return new Response(safeStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response(error.message || 'Internal Server Error', { status: 500 });
  }
}
