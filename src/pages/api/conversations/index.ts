import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { DatabaseService } from '@/lib/db/service';
import { ObjectId } from 'mongodb';
import { getUserId } from '@/lib/helpers';

// Exported for use in other routes
export async function authenticateRequest(req: NextApiRequest, res: NextApiResponse): Promise<string | null> {
  // attempt web auth
  const session = await getServerSession(req, res, authOptions);
  if (session) {
    const userId = getUserId(session);
    if (userId) return userId;
  }

  // attempt token auth if you have token-based auth
  // If you don't have token-based auth, you can remove this part
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      // You'll need to implement your own token verification logic here
      // For example:
      // const token = authHeader.substring(7);
      // const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // return decoded.userId;

      console.log('***URGENT: REMEMBER TO IMPLEMENT TOKEN VERIFICATION LOGIC***');
      return null;
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
        const conversations = await DatabaseService.getUserConversations(new ObjectId(userId));
        res.status(200).json(conversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
      }
      break;

    case 'POST':
      try {
        const { title = 'New Conversation' } = req.body;
        
        const conversationId = await DatabaseService.createConversation({
          userId: new ObjectId(userId),
          title,
          status: 'active'
        });

        const conversation = await DatabaseService.getConversation(conversationId);
        res.status(201).json({ conversation });
      } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ error: 'Failed to create conversation' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}