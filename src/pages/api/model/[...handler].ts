// [...handler].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { DatabaseService } from "@/lib/db/service";
import { ObjectId } from 'mongodb';
import { authenticateRequest } from '../conversations';
import { AVAILABLE_TOOLS, SYSTEM_PROMPT, handleToolCalls } from '@/lib/solana/tools';
import { performSemanticSearch, formatSearchResultsAsContext } from '@/lib/services/Search';

if (!process.env.CF_API_TOKEN || !process.env.CF_ACCOUNT_ID) {
  throw new Error("Missing required environment variables: CF_API_TOKEN or CF_ACCOUNT_ID");
}

async function storeMessage(conversationId: ObjectId, userId: string, role: string, content: string) {
  return DatabaseService.createMessage({
    conversationId,
    userId: new ObjectId(userId),
    role,
    content
  });
}

type ModelResponse = {
  response: string | null;
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

function validateMessage(message: any) {
  if (!message.role) {
    throw new Error(`Message missing role: ${JSON.stringify(message)}`);
  }
  if (!['user', 'assistant', 'system', 'tool'].includes(message.role)) {
    throw new Error(`Invalid role: ${message.role}`);
  }
  if (typeof message.content !== 'string') {
    throw new Error(`Content must be string, got: ${typeof message.content}`);
  }
  return {
    role: message.role,
    content: message.content
  };
}

async function runModel(messages: any[], tools = AVAILABLE_TOOLS) {
  try {
    // Only validate messages that will be sent to the model
    const validatedMessages = messages
      .filter(msg => msg.content != null)  // Skip messages with null content
      .map(validateMessage);
    
    const payload = {
      messages: validatedMessages.map(m => ({
        role: m.role === 'system' ? 'assistant' : m.role,
        content: m.content
      })),
      stream: false
    };

    // Add tools if provided
    if (tools && tools.length > 0) {
      payload['tools'] = tools;
    }

    console.log('Sending payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast`,
      {
        headers: { 
          Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify(payload)
      }
    );

    const result = await response.json();
    console.log('API Response:', JSON.stringify(result));
    
    if (!result.success) {
      console.error('Full API Response:', result);
      throw new Error(result.errors?.[0]?.message || 'Cloudflare API request failed');
    }

    return result.result as ModelResponse;
  } catch (error) {
    console.error('Error in runModel:', error);
    throw error;
  }
}

async function generateTitle(userMessage: string): Promise<string> {
  try {
    const titlePrompt = `Based on this initial message, generate a short, descriptive title (max 6 words): "${userMessage}"`;
    const result = await runModel([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: titlePrompt }
    ]);
    return result?.response?.replace(/["']/g, '').trim() || 'New Conversation';
  } catch (error) {
    console.error('Error generating title:', error);
    return 'New Conversation';
  }
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

  const { interactionMessages, conversationId, walletAddress, isGuruMode } = req.body;

  console.log("GURU MODE:", isGuruMode);
  if (!interactionMessages?.length) {
    return res.status(400).json({ error: 'Messages are required' });
  }

  try {
    let currentConversationId: ObjectId;

    // Handle conversation ID creation
    if (!conversationId) {
      currentConversationId = await DatabaseService.createConversation({
        userId: new ObjectId(userId),
        title: 'Wallet Interaction',
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
    const userMessage = interactionMessages[interactionMessages.length - 1].content;
    await storeMessage(
      currentConversationId, 
      userId, 
      'user', 
      userMessage
    );

    // Prepare messages for the model
    const fullMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // If guru mode is enabled, perform semantic search and add context
    if (isGuruMode) {
      try {
        const searchResults = await performSemanticSearch(userMessage);
        if (searchResults.length > 0) {
          const contextString = formatSearchResultsAsContext(searchResults);
          fullMessages.push({
            role: 'system',
            content: `Here is some relevant context for the user's question:\n\n${contextString}\n\nPlease use this information to provide a more informed response.`
          });
        }
      } catch (error) {
        console.error('Error in semantic search:', error);
        // Continue without context if search fails
      }
    }

    // Add conversation messages and wallet address
    fullMessages.push(
      ...interactionMessages.map(msg => ({
        role: msg.role,
        content: String(msg.content)
      })),
      { role: 'system', content: `Connected wallet address: ${walletAddress}` }
    );

    // Get initial response
    const initialResponse = await runModel(fullMessages);

    let responseToStore: string;

    // Handle tool calls if present
    if (initialResponse.tool_calls?.length) {
      const toolResults = await handleToolCalls(initialResponse.tool_calls, runModel);
      if (toolResults) {
        responseToStore = toolResults;
      }
    }

    // If no tool results, use the model's response
    if (!responseToStore && initialResponse.response) {
      responseToStore = initialResponse.response;
    }

    // Fallback response if neither tool results nor model response
    if (!responseToStore) {
      responseToStore = "I'm here to help with your Solana wallet. Is there something specific you'd like to know?";
    }

    // Store the assistant's response
    if (!responseToStore.startsWith('[{') || !responseToStore.endsWith('}]')) {
      await storeMessage(
        currentConversationId,
        userId,
        'assistant',
        responseToStore
      );
    }

    // Return the response
    return res.status(200).json({
      response: responseToStore,
      messages: await DatabaseService.getConversationMessages(currentConversationId),
      conversation: await DatabaseService.getConversation(currentConversationId),
      usage: initialResponse.usage
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

