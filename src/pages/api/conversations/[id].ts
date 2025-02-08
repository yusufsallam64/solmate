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
    return res.status(400).json({ error: 'Invalid conversation ID' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const conversation = await DatabaseService.getConversation(new ObjectId(id));
        if (!conversation) {
          return res.status(404).json({ error: 'Conversation not found' });
        }
        
        // Verify ownership
        if (conversation.userId.toString() !== userId) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        // Get messages for this conversation
        const messages = await DatabaseService.getConversationMessages(new ObjectId(id));
        
        res.status(200).json({ conversation, messages });
      } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({ error: 'Failed to fetch conversation' });
      }
      break;

    case 'DELETE':
      try {
        const conversation = await DatabaseService.getConversation(new ObjectId(id));
        if (!conversation) {
          return res.status(404).json({ error: 'Conversation not found' });
        }
        
        // Verify ownership
        if (conversation.userId.toString() !== userId) {
          return res.status(403).json({ error: 'Forbidden' });
        }
        
        await DatabaseService.deleteConversation(new ObjectId(id));
        res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({ error: 'Failed to delete conversation' });
      }
      break;

    case 'PATCH':
      try {
        const { title, status } = req.body;
        
        const conversation = await DatabaseService.getConversation(new ObjectId(id));
        if (!conversation) {
          return res.status(404).json({ error: 'Conversation not found' });
        }
        
        // Verify ownership
        if (conversation.userId.toString() !== userId) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        await DatabaseService.updateConversation(new ObjectId(id), {
          title,
          status
        });
        
        res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error updating conversation:', error);
        res.status(500).json({ error: 'Failed to update conversation' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'DELETE', 'PATCH']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}