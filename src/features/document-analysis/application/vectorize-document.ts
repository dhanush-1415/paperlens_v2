import 'server-only';
import { google } from '@ai-sdk/google';
import { embedMany } from 'ai';
import { prisma } from '@/server/db/prisma';

export async function vectorizeDocument(analysisId: string, rawText: string) {
  try {
    if (!rawText || rawText.length < 50) return; // Too short to matter

    // 1. Chunk the text
    const chunkSize = 1500;
    const overlap = 200;
    const chunks: string[] = [];

    let i = 0;
    while (i < rawText.length) {
      chunks.push(rawText.slice(i, i + chunkSize));
      i += chunkSize - overlap;
    }

    // 2. Generate embeddings using AI SDK
    const { embeddings } = await embedMany({
      model: google.textEmbeddingModel('text-embedding-004'),
      values: chunks,
    });

    // 3. Store in database
    // Prisma with pgvector requires raw SQL for the Unsupported vector type right now,
    // or we can use the prisma extension.
    // Since we enabled `postgresqlExtensions`, we can insert them using raw queries.
    for (let index = 0; index < chunks.length; index++) {
      const textContent = chunks[index];
      const embedding = embeddings[index];

      if (!embedding) continue;

      // Formatting the array into the postgres vector format: '[0.1, 0.2, ...]'
      const vectorLiteral = `[${embedding.join(',')}]`;

      await prisma.$executeRaw`
        INSERT INTO document_content (id, analysis_id, chunk_index, text_content, embedding)
        VALUES (
          gen_random_uuid(),
          ${analysisId}::uuid,
          ${index},
          ${textContent},
          ${vectorLiteral}::vector
        )
      `;
    }

    console.log(`Vectorized document ${analysisId} into ${chunks.length} chunks.`);
  } catch (err) {
    console.error('Failed to vectorize document:', err);
    // Non-fatal error, background task
  }
}
