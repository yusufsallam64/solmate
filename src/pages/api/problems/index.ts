// pages/api/problems/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { DatabaseService } from '@/lib/db/service';
import { ObjectId } from 'mongodb';
import { getUserId } from '@/lib/helpers';
import { authenticateRequest } from '../problemsets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = await authenticateRequest(req, res);
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  switch (req.method) {
    case 'POST':
      try {
        const { problemSetId, title, description } = req.body;
        
        if (!problemSetId) {
          return res.status(400).json({ error: 'Problem set ID is required' });
        }

        // Verify the problem set exists and belongs to the user
        const problemSet = await DatabaseService.getProblemSet(new ObjectId(problemSetId));
        if (!problemSet || problemSet.userId.toString() !== userId) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        // Create the problem
        const problemId = await DatabaseService.createProblem({
          problemSetId: new ObjectId(problemSetId),
          userId: new ObjectId(userId),
          title: title || 'New Problem',
          description: description || '',
          status: 'unsolved'
        });

        // Fetch the created problem to return complete problem object
        const problem = await DatabaseService.getProblem(problemId);
        if (!problem) {
          throw new Error('Failed to fetch created problem');
        }

        // Return the complete problem object
        res.status(201).json({ problem });
      } catch (error) {
        console.error('Error creating problem:', error);
        res.status(500).json({ error: 'Failed to create problem' });
      }
      break;

    case 'GET':
      try {
        const problems = await DatabaseService.getProblemsByUserId(new ObjectId(userId));
        res.status(200).json(problems);
      } catch (error) {
        console.error('Error fetching problems:', error);
        res.status(500).json({ error: 'Failed to fetch problems' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}