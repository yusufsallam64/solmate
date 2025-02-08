import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions, verifyToken } from '../auth/[...nextauth]';
import { DatabaseService } from '@/lib/db/service';
import { ObjectId } from 'mongodb';
import { getUserId } from '@/lib/helpers';

export async function authenticateRequest(req: NextApiRequest, res: NextApiResponse): Promise<string | null> {
  // attempt web auth
  const session = await getServerSession(req, res, authOptions);
  if (session) {
    const userId = getUserId(session);
    if (userId) return userId;
  }

  // attempt jwt auth
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      return decoded.userId;
    } catch (error) {
      return null;
    }
  }

  return null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = await authenticateRequest(req, res);
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const problemSets = await DatabaseService.getUserProblemSets(new ObjectId(userId));
        res.status(200).json(problemSets);
      } catch (error) {
        console.error('Error fetching problem sets:', error);
        res.status(500).json({ error: 'Failed to fetch problem sets' });
      }
      break;

    case 'POST':
      try {
        const { 
          title = 'New Problem Set', 
          description = '', 
          subject = '', 
          topic = '',
          icon = 'general' 
        } = req.body;
        
        const problemSetId = await DatabaseService.createProblemSet({
          userId: new ObjectId(userId),
          title,
          description,
          subject,
          topic,
          icon,
          status: 'active'
        });
        res.status(201).json({ problemSetId });
      } catch (error) {
        console.error('Error creating problem set:', error);
        res.status(500).json({ error: 'Failed to create problem set' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
