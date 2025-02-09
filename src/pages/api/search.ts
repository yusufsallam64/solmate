// pages/api/search.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';
import { pipeline } from '@xenova/transformers';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, limit = 3 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    await client.connect();
    const db = client.db('rag_db');
    const collection = db.collection('documents');

    // Generate embedding
    const queryEmbedding = await getEmbedding(query);
    console.log('Generated embedding length:', queryEmbedding.length);

    // Perform vector search using the correct MongoDB syntax
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
          score: { $meta: "vectorSearchScore" }  // Note: changed from searchScore to vectorSearchScore
        }
      }
    ];

    const results = await collection.aggregate(searchPipeline).toArray();
    console.log('Search results count:', results.length);
    
    return res.status(200).json({
      query,
      results,
      totalResults: results.length,
      embeddingSize: queryEmbedding.length
    });

  } catch (error) {
    console.error('Detailed error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    await client.close();
  }
}