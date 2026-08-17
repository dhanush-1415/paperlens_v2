import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/server/bootstrap';
import { prisma } from '@/server/db/prisma';
import { streamText, embed } from 'ai';
import { google } from '@ai-sdk/google';

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    
    // 1. Convert the user's query into an embedding
    const { embedding } = await embed({
      model: google.textEmbeddingModel('embedding-001'),
      value: lastMessage.content,
    });
    const vectorLiteral = `[${embedding.join(',')}]`;

    // 2. Query pgvector for the most semantically relevant chunks across the user's vault
    const chunks = await prisma.$queryRaw<Array<{ text_content: string, title: string }>>`
      SELECT c.text_content, a.title 
      FROM document_content c
      JOIN document_analyses a ON c.analysis_id = a.id
      WHERE a.owner_id = ${session.userId}::uuid AND a.deleted_at IS NULL
      ORDER BY c.embedding <=> ${vectorLiteral}::vector
      LIMIT 6
    `;

    // 3. Inject context into the system prompt
    const contextStr = chunks.map((c, i) => `[Source: ${c.title || 'Untitled'}]\n${c.text_content}`).join('\n\n');
    
    const systemPrompt = `You are PaperLens Vault AI, a highly intelligent legal and corporate document assistant.
You have access to the user's entire document vault through Semantic Search.
Use the retrieved context below to answer the user's query accurately.
If the answer is not in the context, clearly state that you cannot find it in their vault.
Always cite the Source name when quoting or referencing specific information.

Retrieved Context:
${contextStr ? contextStr : 'No relevant documents found.'}
`;

    // 4. Stream response
    const result = streamText({
      model: google('gemini-1.5-pro'),
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.2,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error('Vault Chat error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
