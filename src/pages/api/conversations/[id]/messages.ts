import type { NextApiRequest, NextApiResponse } from 'next';
import { DatabaseService } from '@/lib/db/service';
import { ObjectId } from 'mongodb';
import { authenticateRequest } from '..';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('🚀 Message API Request received:');
  console.log('📍 Method:', req.method);
  console.log('🔍 Query:', req.query);
  console.log('📦 Body:', JSON.stringify(req.body, null, 2));

  const userId = await authenticateRequest(req, res);
  console.log('👤 Authenticated userId:', userId);
  
  if (!userId) {
    console.log('❌ Unauthorized - No userId');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  console.log('🎯 Conversation ID from query:', id);
  
  if (!id || typeof id !== 'string') {
    console.log('❌ Invalid conversation ID:', id);
    return res.status(400).json({ error: 'Conversation ID is required' });
  }

  // Verify conversation ownership
  const conversation = await DatabaseService.getConversation(new ObjectId(id));
  console.log('📝 Found conversation:', conversation ? 'yes' : 'no');
  console.log('🔐 Conversation userId:', conversation?.userId.toString());
  console.log('🔑 Request userId:', userId);
  
  if (!conversation || conversation.userId.toString() !== userId) {
    console.log('❌ Forbidden - Conversation ownership mismatch');
    return res.status(403).json({ error: 'Forbidden' });
  }

  switch (req.method) {
    case 'GET':
      try {
        console.log('📥 Fetching messages for conversation:', id);
        const messages = await DatabaseService.getConversationMessages(new ObjectId(id));
        console.log('✅ Found messages:', messages.length);
        res.status(200).json(messages);
      } catch (error) {
        console.error('❌ Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
      }
      break;

    case 'POST':
      try {
        const { role, content, metadata } = req.body;
        console.log('📨 Creating message:');
        console.log('- Role:', role);
        console.log('- Content:', content);
        console.log('- Metadata:', metadata);

        if (!role || !content) {
          console.log('❌ Missing required fields - role or content');
          return res.status(400).json({ error: 'Role and content are required' });
        }

        const messageId = await DatabaseService.createMessage({
          conversationId: new ObjectId(id),
          userId: new ObjectId(userId),
          role,
          content,
          metadata
        });
        console.log('✅ Created message:', messageId.toString());

        // Fetch the created message to return it
        const message = await DatabaseService.getMessage(messageId);
        console.log('📤 Returning message:', message);
        res.status(201).json({ message });
      } catch (error) {
        console.error('❌ Error creating message:', error);
        res.status(500).json({ error: 'Failed to create message' });
      }
      break;

    default:
      console.log('❌ Method not allowed:', req.method);
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}