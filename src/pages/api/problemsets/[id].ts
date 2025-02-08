import type { NextApiRequest, NextApiResponse } from 'next';
import { DatabaseService } from '@/lib/db/service';
import { ObjectId } from 'mongodb';
import { authenticateRequest } from '.';

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
    return res.status(400).json({ error: 'Invalid problem set ID' });
  }

  switch (req.method) {
    case 'GET':
      try {
        // We would need to add this method to DatabaseService
        const problemSet = await DatabaseService.getProblemSet(new ObjectId(id));
        if (!problemSet) {
          return res.status(404).json({ error: 'Problem set not found' });
        }
        // Verify ownership
        if (problemSet.userId.toString() !== userId) {
          return res.status(403).json({ error: 'Forbidden' });
        }
        res.status(200).json(problemSet);
      } catch (error) {
        console.error('Error fetching problem set:', error);
        res.status(500).json({ error: 'Failed to fetch problem set' });
      }
      break;

    case 'DELETE':
      try {
        // Get the problem set first to verify ownership
        const problemSet = await DatabaseService.getProblemSet(new ObjectId(id));
        if (!problemSet) {
          return res.status(404).json({ error: 'Problem set not found' });
        }
        // Verify ownership
        if (problemSet.userId.toString() !== userId) {
          return res.status(403).json({ error: 'Forbidden' });
        }
        
        await DatabaseService.deleteProblemSet(new ObjectId(id));
        res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error deleting problem set:', error);
        res.status(500).json({ error: 'Failed to delete problem set' });
      }
      break;

    case 'PATCH':
      try {
        const { title, description, subject, topic, status } = req.body;
        
        // Get the problem set first to verify ownership
        const problemSet = await DatabaseService.getProblemSet(new ObjectId(id));
        if (!problemSet) {
          return res.status(404).json({ error: 'Problem set not found' });
        }
        // Verify ownership
        if (problemSet.userId.toString() !== userId) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        // Update the problem set
        await DatabaseService.updateProblemSet(new ObjectId(id), {
          title,
          description,
          subject,
          topic,
          status
        });
        
        res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error updating problem set:', error);
        res.status(500).json({ error: 'Failed to update problem set' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'DELETE', 'PATCH']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}