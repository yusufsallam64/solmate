import type { NextApiRequest, NextApiResponse } from 'next';
import { DatabaseService } from '@/lib/db/service';
import { ObjectId } from 'mongodb';
import { authenticateRequest } from '..';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = await authenticateRequest(req, res);
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query; // This is the problem set ID

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid problem set ID' });
  }

  switch (req.method) {
    case 'GET':
      try {
        // First verify the problem set exists and belongs to the user
        const problemSet = await DatabaseService.getProblemSet(new ObjectId(id));
        if (!problemSet) {
          return res.status(404).json({ error: 'Problem set not found' });
        }

        // Verify ownership
        if (problemSet.userId.toString() !== userId) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        // Get all problems in the set
        const problems = await DatabaseService.getProblemsInSet(new ObjectId(id));
        res.status(200).json(problems);
      } catch (error) {
        console.error('Error fetching problems:', error);
        res.status(500).json({ error: 'Failed to fetch problems' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}