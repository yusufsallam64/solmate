import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { DatabaseService } from '@/lib/db/service';
import { ObjectId } from 'mongodb';
import { getUserId } from '@/lib/helpers';
import type { Problem, Message } from '@/lib/db/types';
import { authenticateRequest } from '../problemsets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = await authenticateRequest(req, res);
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid problem ID' });
  }

  switch (req.method) {
    case 'GET':
      try {
        // First verify the problem exists and belongs to the user
        const problemSetId = await DatabaseService.getProblemSetIdForProblem(new ObjectId(id));
        if (!problemSetId) {
          return res.status(404).json({ error: 'Problem not found' });
        }

        // Get the problem set to verify ownership
        const problemSet = await DatabaseService.getProblemSet(problemSetId);
        if (!problemSet || problemSet.userId.toString() !== userId) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        // Get the problem and its messages
        const problem = await DatabaseService.getProblem(new ObjectId(id));
        const messages = await DatabaseService.getProblemMessages(new ObjectId(id));

        res.status(200).json({ problem, messages });
      } catch (error) {
        console.error('Error fetching problem:', error);
        res.status(500).json({ error: 'Failed to fetch problem' });
      }
      break;

    case 'PATCH':
      try {
        const { title, description, status } = req.body;

        // First verify the problem exists and belongs to the user
        const problemSetId = await DatabaseService.getProblemSetIdForProblem(new ObjectId(id));
        if (!problemSetId) {
          return res.status(404).json({ error: 'Problem not found' });
        }

        // Get the problem set to verify ownership
        const problemSet = await DatabaseService.getProblemSet(problemSetId);
        if (!problemSet || problemSet.userId.toString() !== userId) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        // Update the problem
        await DatabaseService.updateProblem(new ObjectId(id), {
          title,
          description,
          status
        });

        res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error updating problem:', error);
        res.status(500).json({ error: 'Failed to update problem' });
      }
      break;

    case 'POST':
      // This endpoint handles adding new messages to a problem
      try {
        const { content, role } = req.body;

        // First verify the problem exists and belongs to the user
        const problemSetId = await DatabaseService.getProblemSetIdForProblem(new ObjectId(id));
        if (!problemSetId) {
          return res.status(404).json({ error: 'Problem not found' });
        }

        // Get the problem set to verify ownership
        const problemSet = await DatabaseService.getProblemSet(problemSetId);
        if (!problemSet || problemSet.userId.toString() !== userId) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        // Create the message
        const messageId = await DatabaseService.createMessage({
          problemId: new ObjectId(id),
          userId: new ObjectId(userId),
          content,
          role
        });

        res.status(201).json({ messageId });
      } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).json({ error: 'Failed to create message' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PATCH', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}