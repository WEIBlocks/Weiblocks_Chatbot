import { connectDB } from './mongodb';
import KnowledgeChunk from '@/models/KnowledgeChunk';
import { getEmbedding } from './embeddings';

export interface RelevantChunk {
  url: string;
  title: string;
  content: string;
  score: number;
}

/**
 * Find the most relevant knowledge chunks for a given query.
 *
 * Uses MongoDB Atlas Vector Search if the index exists (production).
 * Falls back to cosine similarity in-memory if no vector index yet (dev/testing).
 */
export async function findRelevantChunks(
  query: string,
  topK = 4
): Promise<RelevantChunk[]> {
  await connectDB();

  const queryEmbedding = await getEmbedding(query);

  // ── Try MongoDB Atlas Vector Search first ──────────────────────────────────
  try {
    const results = await KnowledgeChunk.aggregate([
      {
        $vectorSearch: {
          index: 'knowledge_vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: topK * 10,
          limit: topK,
        },
      },
      {
        $project: {
          url: 1, title: 1, content: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ]);

    if (results.length > 0) {
      return results.map((r: { url: string; title: string; content: string; score: number }) => ({
        url: r.url, title: r.title, content: r.content, score: r.score,
      }));
    }
  } catch {
    // Vector index not set up yet — fall through to cosine fallback
    console.warn('[vectorSearch] Atlas Vector Search unavailable, using cosine fallback');
  }

  // ── Cosine similarity fallback (works without Atlas Vector Search index) ───
  const allChunks = await KnowledgeChunk.find({}, { url: 1, title: 1, content: 1, embedding: 1 }).lean();

  if (allChunks.length === 0) return [];

  const scored = allChunks.map(chunk => ({
    url: chunk.url as string,
    title: chunk.title as string,
    content: chunk.content as string,
    score: cosineSimilarity(queryEmbedding, chunk.embedding as number[]),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).filter(c => c.score > 0.3);
}

/** Cosine similarity between two vectors */
function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/** Format retrieved chunks into a system prompt injection block */
export function formatRagContext(chunks: RelevantChunk[]): string {
  if (chunks.length === 0) return '';

  const sections = chunks.map(c =>
    `[Source: ${c.title || c.url}]\n${c.content}`
  ).join('\n\n---\n\n');

  return `\n\n## LIVE WEBSITE CONTEXT (retrieved from weiblocks.io)\nUse the following up-to-date content from the website to answer accurately. Prioritize this over your general knowledge:\n\n${sections}\n\n---`;
}
