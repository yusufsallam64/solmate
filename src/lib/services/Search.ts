// lib/search/utils.ts
import { MongoClient } from 'mongodb';
import { pipeline } from '@xenova/transformers';

let embeddingPipeline = null;

async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/bge-large-en-v1.5');
  }
  return embeddingPipeline;
}

async function getEmbedding(text: string): Promise<number[]> {
  try {
    const pipe = await getEmbeddingPipeline();
    const result = await pipe(text, {
      pooling: 'mean',
      normalize: true,
    });
    return Array.from(result.data);
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

export async function performSemanticSearch(query: string, limit: number = 3) {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('rag_db');
    const collection = db.collection('documents');

    const queryEmbedding = await getEmbedding(query);

    const searchPipeline = [
      {
        $vectorSearch: {
          index: "vector_search_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: limit * 10,
          limit: limit
        }
      },
      {
        $project: {
          _id: 1,
          url: 1,
          title: 1,
          source: 1,
          date: 1,
          content: 1,
          chunk_index: 1,
          total_chunks: 1,
          score: { $meta: "vectorSearchScore" }
        }
      }
    ];

    return await collection.aggregate(searchPipeline).toArray();
  } finally {
    await client.close();
  }
}

export function formatSearchResultsAsContext(results: any[]): string {
  return results.map(result => {
    // Clean up the content by removing metadata-like patterns
    const cleanContent = result.content
      .replace(/By.*?(?:mins|hours|days).*?read/g, '')  // Remove author and read time
      .replace(/Market Musing-g/g, '')  // Remove section headers
      .replace(/\s{2,}/g, ' ')  // Remove extra spaces
      .trim();
    
    return `[Source: ${result.title || result.source}]\n${cleanContent}`;
  }).join('\n\n');
}