import type { NextApiRequest, NextApiResponse } from "next";
import { DatabaseService } from "@/lib/db/service";
import { ObjectId } from 'mongodb';
import { authenticateRequest } from '../conversations';
import { AVAILABLE_TOOLS, SYSTEM_PROMPT, handleToolCalls } from '@/lib/solana/tools';

if (!process.env.CF_API_TOKEN || !process.env.CF_ACCOUNT_ID) {
  throw new Error("Missing required environment variables: CF_API_TOKEN or CF_ACCOUNT_ID");
}

type ModelResponse = {
  response: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  tool_calls?: {
    name: string;
    arguments: Record<string, any>;
  }[];
};

async function runModel(messages: any[], tools = AVAILABLE_TOOLS) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast`,
    {
      headers: { 
        Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      method: "POST",
      body: JSON.stringify({
        messages,
        tools,
        temperature: 0.7,
        max_tokens: 1024
      })
    }
  );

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.errors?.[0]?.message || 'Cloudflare API request failed');
  }

  return result.result as ModelResponse;
}

async function generateTitle(userMessage: string): Promise<string> {
  const titlePrompt = `Based on this initial message, generate a short, descriptive title (max 6 words): "${userMessage}"`;
  
  const result = await runModel([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: titlePrompt }
  ]);

  return result.response.replace(/["']/g, '').trim();
}

async function storeMessage(conversationId: ObjectId, userId: string, role: string, content: string) {
  return DatabaseService.createMessage({
    conversationId,
    userId: new ObjectId(userId),
    role,
    content
  });
}

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await authenticateRequest(req, res);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { interactionMessages, conversationId } = req.body;
  if (!interactionMessages?.length) {
    return res.status(400).json({ error: 'Messages are required' });
  }

  try {
    const fullMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...interactionMessages
    ];

    let currentConversationId: ObjectId;

    // Handle conversation creation or verification
    if (!conversationId) {
      const title = await generateTitle(interactionMessages[0].content);
      currentConversationId = await DatabaseService.createConversation({
        userId: new ObjectId(userId),
        title,
        status: 'active'
      });
    } else {
      currentConversationId = new ObjectId(conversationId);
      const conversation = await DatabaseService.getConversation(currentConversationId);
      if (!conversation || conversation.userId.toString() !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    // Store user's message
    await storeMessage(
      currentConversationId, 
      userId, 
      'user', 
      interactionMessages[interactionMessages.length - 1].content
    );

    // Get initial assistant response
    const initialResponse = await runModel(fullMessages);

    // Store assistant's initial response
    await storeMessage(
      currentConversationId,
      userId,
      'assistant',
      initialResponse.response
    );

    let finalResponse = initialResponse;

    // Handle tool calls if present
    if (initialResponse.tool_calls?.length) {
      const toolResults = await handleToolCalls(initialResponse.tool_calls);
      
      // Store tool results as message
      await storeMessage(
        currentConversationId,
        userId,
        'tool',
        JSON.stringify(toolResults)
      );

      // Get final response after tool execution
      const updatedMessages = [
        ...fullMessages,
        { role: 'assistant', content: initialResponse.response },
        { role: 'tool', content: JSON.stringify(toolResults) }
      ];

      finalResponse = await runModel(updatedMessages);

      // Store assistant's final response after tool execution
      await storeMessage(
        currentConversationId,
        userId,
        'assistant',
        finalResponse.response
      );
    }

    // Get all messages for the conversation
    const storedMessages = await DatabaseService.getConversationMessages(currentConversationId);
    const conversation = await DatabaseService.getConversation(currentConversationId);

    return res.status(200).json({
      response: finalResponse.response,
      messages: storedMessages,
      conversation,
      usage: finalResponse.usage
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}