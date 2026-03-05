import { GoogleGenerativeAI } from '@google/generative-ai';
import { connectDB } from './mongodb';
import KnowledgeChunk from '@/models/KnowledgeChunk';
import { ScrapedPage, chunkText } from './scraper';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Google's free embedding model — 3072 dimensions
const EMBEDDING_MODEL = 'gemini-embedding-001';

/** Get embedding vector for a single text string */
export async function getEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

/** Get embeddings for multiple texts in batches (respects rate limits) */
async function getBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  const BATCH_SIZE = 10; // Google allows 100/min, use 10 at a time to be safe

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(t => getEmbedding(t)));
    embeddings.push(...results);

    // Pause 1s between batches to stay well within rate limits
    if (i + BATCH_SIZE < texts.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  return embeddings;
}

/** Embed all scraped pages and upsert into MongoDB */
export async function embedAndStore(pages: ScrapedPage[]): Promise<{ stored: number; pages: number }> {
  await connectDB();

  let totalStored = 0;

  for (const page of pages) {
    const chunks = chunkText(page.content);
    if (chunks.length === 0) continue;

    console.log(`[embeddings] Embedding ${chunks.length} chunks for ${page.url}`);

    const embeddings = await getBatchEmbeddings(chunks);

    // Upsert each chunk (replace if already exists for this url+chunkIndex)
    const ops = chunks.map((content, idx) => ({
      updateOne: {
        filter: { url: page.url, chunkIndex: idx },
        update: {
          $set: {
            url: page.url,
            title: page.title,
            content,
            embedding: embeddings[idx],
            chunkIndex: idx,
            syncedAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    await KnowledgeChunk.bulkWrite(ops);

    // Delete stale chunks from previous syncs (if page now has fewer chunks)
    await KnowledgeChunk.deleteMany({ url: page.url, chunkIndex: { $gte: chunks.length } });

    totalStored += chunks.length;
  }

  console.log(`[embeddings] Done. Stored ${totalStored} chunks across ${pages.length} pages.`);
  return { stored: totalStored, pages: pages.length };
}
