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

  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const problemSets = await DatabaseService.getUserProblemSets(new ObjectId(userId));
    console.log('Deleting problemSets:', problemSets);
    
    // (this will cascade delete all problems and messages)
    for (const problemSet of problemSets) {
      await DatabaseService.deleteProblemSet(problemSet._id);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting user data:', error);
    res.status(500).json({ error: 'Failed to delete user data' });
  }
}