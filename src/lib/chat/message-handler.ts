// message-handler.ts
import { Message } from '../db/types';
import { executeToolResponse } from './tool-executor';
import { toast } from 'react-hot-toast';

export interface MessageResponse {
  messages: Message[];
  conversation?: any;
  error?: string;
}

export const handleModelResponse = async (
  data: any,
  currentConversationId?: string,
): Promise<MessageResponse> => {
  if (!data.response) {
    throw new Error('No response received from model');
  }

  try {
    // Try to parse as JSON for tool calls
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(data.response);
    } catch (e) {
      // If parsing fails, it's a regular text response
      console.log('Regular text response received:', data.response);
      return {
        messages: data.messages || [],
        conversation: data.conversation
      };
    }

    // Handle tool calls
    if (Array.isArray(parsedResponse) && parsedResponse.length > 0) {
      const newMessages: Message[] = [...(data.messages || [])];

      for (const toolCall of parsedResponse) {
        const result = await executeToolResponse(
          toolCall,
          currentConversationId || ''
        );

        if (result.success) {
          newMessages.push(result.message);
        } else {
          toast.error(result.error || 'Operation failed');
          newMessages.push(result.message);
        }
      }

      return {
        messages: newMessages,
        conversation: data.conversation
      };
    }

    // If response was JSON but not tool calls, return the messages from the API
    return {
      messages: data.messages || [],
      conversation: data.conversation
    };

  } catch (error) {
    console.error('Error handling model response:', error);
    return {
      messages: data.messages || [],
      conversation: data.conversation,
      error: error instanceof Error ? error.message : 'Error processing response'
    };
  }
};

export const sendMessage = async (
  messageContent: string,
  messages: Message[],
  currentConversationId?: string,
  walletAddress?: string
): Promise<MessageResponse> => {
  const response = await fetch('/api/model/handler', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      interactionMessages: currentConversationId
        ? [...messages, { role: 'user', content: messageContent }]
        : [{ role: 'user', content: messageContent }],
      conversationId: currentConversationId,
      walletAddress
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get response from server');
  }

  const data = await response.json();
  console.log('API data response:', data);

  return handleModelResponse(data, currentConversationId);
};