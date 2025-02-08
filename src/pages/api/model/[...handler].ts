import type { NextApiRequest, NextApiResponse } from "next";
import { run, generateTitle } from "@/lib/model/worker";
import { DatabaseService } from "@/lib/db/service";
import { ObjectId } from 'mongodb';
import type { Message } from "@/lib/db/types";
import { authenticateRequest } from '../conversations';

if(!process.env.OPENAI_API_KEY) {
  throw new Error("Missing required environment variable: OPENAI_API_KEY");
}

type Data = {
  modelResponse: string;
  title?: string;
  conversation?: any;
  messages?: Message[];
};

const CONVERSATION_MASTER_PROMPT = "\
  You are a helpful assistant engaging in a conversation with the user. \
  Answer in the same language that the user is using. \
  Be concise but thorough in your responses."

async function createConversationAndMessages(
  title: string,
  userMessage: { role: 'user', content: string },
  assistantMessage: { role: 'assistant', content: string },
  userId: string
): Promise<{ conversation: any, messages: Message[] }> {
  // Create new conversation
  const conversationId = await DatabaseService.createConversation({
    userId: new ObjectId(userId),
    title,
    status: 'active'
  });

  // Create user message
  const userMessageId = await DatabaseService.createMessage({
    conversationId,
    userId: new ObjectId(userId),
    ...userMessage
  });

  // Create assistant message
  const assistantMessageId = await DatabaseService.createMessage({
    conversationId,
    userId: new ObjectId(userId),
    ...assistantMessage
  });

  // Fetch the created conversation and messages
  const [conversation, messages] = await Promise.all([
    DatabaseService.getConversation(conversationId),
    DatabaseService.getConversationMessages(conversationId)
  ]);

  if (!conversation) throw new Error("Failed to create conversation");

  return { conversation, messages };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  console.log('🚀 Model API Request received:');
  console.log('📍 Method:', req.method);
  console.log('🔍 Query:', req.query);
  console.log('📦 Body:', JSON.stringify(req.body, null, 2));

  if (!req.method || req.method !== "POST") {
    console.log('❌ Method not allowed:', req.method);
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ modelResponse: "Method not allowed" });
  }

  const userId = await authenticateRequest(req, res);
  console.log('👤 Authenticated userId:', userId);

  if (!userId) {
    console.log('❌ Unauthorized - No userId');
    return res.status(401).json({ modelResponse: "Unauthorized" });
  }

  if (!req.body || !req.body.interactionMessages) {
    console.log('❌ Bad request - Missing required fields');
    return res.status(400).json({ modelResponse: "Bad request" });
  }

  const { interactionMessages } = req.body;
  const isFirstMessage = interactionMessages.length === 1;
  
  try {
    console.log('🎯 Processing conversation request');
    const { modelResponse } = await run(CONVERSATION_MASTER_PROMPT, interactionMessages);

    if (isFirstMessage) {
      console.log('📝 Processing first message');
      const title = await generateTitle(CONVERSATION_MASTER_PROMPT, interactionMessages[0]);
      
      const { conversation, messages } = await createConversationAndMessages(
        title,
        interactionMessages[0] as { role: 'user', content: string },
        { role: 'assistant', content: modelResponse },
        userId
      );

      console.log('✅ Created new conversation and messages');
      return res.status(200).json({ 
        modelResponse, 
        title,
        conversation,
        messages
      });
    } else {
      console.log('📝 Processing follow-up message');
      const conversationId = new ObjectId(req.body.conversationId);
      
      // Verify conversation ownership
      const conversation = await DatabaseService.getConversation(conversationId);
      if (!conversation || conversation.userId.toString() !== userId) {
        return res.status(403).json({ modelResponse: "Forbidden" });
      }
      
      // Create user message
      const userMessageId = await DatabaseService.createMessage({
        conversationId,
        userId: new ObjectId(userId),
        role: 'user',
        content: interactionMessages[interactionMessages.length - 1].content
      });

      // Create assistant message
      const assistantMessageId = await DatabaseService.createMessage({
        conversationId,
        userId: new ObjectId(userId),
        role: 'assistant',
        content: modelResponse
      });

      // Fetch all messages for the conversation
      const messages = await DatabaseService.getConversationMessages(conversationId);
      
      console.log('✅ Created follow-up messages');
      return res.status(200).json({ 
        modelResponse,
        messages 
      });
    }
  } catch (error) {
    console.error('❌ Error in handler:', error);
    return res.status(500).json({ 
      modelResponse: "Internal server error" 
    });
  }
}