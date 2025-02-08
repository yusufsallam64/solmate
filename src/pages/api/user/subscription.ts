import { NextApiRequest, NextApiResponse } from 'next';
import { DatabaseService } from '@/lib/db/service';
import { authenticateRequest } from '../problemsets';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log("subscription: ", req.headers.authorization);
  const userId = await authenticateRequest(req, res);
  if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
      const user = await DatabaseService.getUserById(new ObjectId(userId));
      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      const subscription = await DatabaseService.getUserSubscription(user._id);
      res.json(subscription);
  } catch (error) {
      console.error('Error fetching subscription:', error);
      res.status(500).json({ error: 'Failed to fetch subscription' });
  }
}