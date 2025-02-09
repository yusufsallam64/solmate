import { useCallback, useState, useEffect } from "react";
import { Message, Conversation } from "@/lib/db/types";
import toast from "react-hot-toast";
import { DashboardLayout } from '@/lib/layouts';
import { ChatInterface } from "@/lib/components/dashboard/ChatInterface";
import { useSession } from "next-auth/react";
import { handleToolCalls as handleTransferToolCalls } from "@/lib/solana/transfer";
import { Connection, VersionedTransaction } from '@solana/web3.js';
import { SOLANA_CONFIG } from '@/lib/solana/tools';
import { isValid } from "date-fns";

async function handleSwap(toolArgumentResults: any) {
  console.log('Starting handleSwap with arguments:', toolArgumentResults);

  const phantom = (window as any).solana;
  if (!phantom) {
    throw new Error('Phantom wallet is not available');
  }

  try {
    // Connect to wallet if not already connected
    const connection = await phantom.connect();
    const userPublicKey = connection.publicKey.toString();

    // Validate the required data exists
    if (!toolArgumentResults?.quoteResponse) {
      console.error('Invalid tool arguments:', toolArgumentResults);
      throw new Error('Invalid swap arguments received - missing quote response');
    }

    // Get swap transaction from Jupiter
    const swapResponse = await fetch('/api/execute-swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quoteResponse: toolArgumentResults.quoteResponse,
        userPublicKey
      }),
    });

    if (!swapResponse.ok) {
      const error = await swapResponse.json();
      throw new Error(error.error || 'Failed to create swap transaction');
    }

    const swapData = await swapResponse.json();
    console.log('Swap data received:', swapData);

    // Check for errors in swap data
    if (swapData.error) {
      throw new Error(swapData.error);
    }

    if (!swapData.swapTransaction) {
      throw new Error('No swap transaction received from API');
    }

    // Deserialize transaction
    const transaction = VersionedTransaction.deserialize(
      Buffer.from(swapData.swapTransaction, 'base64')
    );

    console.log('Transaction deserialized, requesting signature...');

    // Sign transaction with Phantom
    const signedTransaction = await phantom.signTransaction(transaction);
    console.log('Transaction signed successfully');

    // Send transaction
    const rpcConnection = new Connection(SOLANA_CONFIG.rpcUrl, 'confirmed');
    const signature = await rpcConnection.sendRawTransaction(
      signedTransaction.serialize(),
      {
        skipPreflight: true,
        maxRetries: 3,
        preflightCommitment: 'confirmed'
      }
    );

    console.log('Transaction sent, signature:', signature);

    // Wait for confirmation
    const confirmation = await rpcConnection.confirmTransaction({
      signature,
      blockhash: swapData.blockhash || toolArgumentResults.quoteResponse.blockhash,
      lastValidBlockHeight: swapData.lastValidBlockHeight
    });

    if (confirmation.value.err) {
      throw new Error('Transaction failed to confirm');
    }

    console.log('Transaction confirmed successfully');

    return {
      success: true,
      signature,
      inputToken: toolArgumentResults.inputToken,
      outputToken: toolArgumentResults.outputToken,
      inputAmount: toolArgumentResults.amount,
      estimatedOutput: toolArgumentResults.estimated
    };

  } catch (error) {
    console.error('Error in handleSwap:', error);
    throw error;
  }
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | undefined>(undefined);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  // Add new view state
  const [view, setView] = useState<'chat' | 'alternate'>('chat');
  const { data: session } = useSession();
  const walletAddress = session?.user.walletAddress;

  // Add view toggle handler
  const handleViewToggle = useCallback(() => {
    setView(current => current === 'chat' ? 'alternate' : 'chat');
  }, []);


  // Load conversations on mount
  useEffect(() => {
    async function loadConversations() {
      try {
        const response = await fetch('/api/conversations');
        if (!response.ok) throw new Error('Failed to fetch conversations');

        const conversationsData: Conversation[] = await response.json();
        setConversations(conversationsData);
      } catch (error) {
        console.error('Error loading conversations:', error);
        toast.error('Failed to load conversations');
      }
    }
    loadConversations();
  }, []);

  const handleConversationChange = async (conversationId: string) => {
    console.log('Changing conversation to:', conversationId);
    try {
      const response = await fetch(`/api/conversations/${conversationId}`);
      if (!response.ok) throw new Error('Failed to fetch conversation');

      const data = await response.json();
      console.log('Loaded conversation data:', data);

      setCurrentConversation(data.conversation);
      setMessages(data.messages);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      toast.error('Failed to load conversation');
    }
  };

  const handleNewChat = useCallback(() => {
    console.log('Starting new chat');
    setCurrentConversation(undefined);
    setMessages([]);
    setMessage("");
  }, []);

  // In dashboard.tsx - Updated handleSubmit function

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    setError("");

    const messageContent = message.trim();
    setMessage("");

    const userMessage: Message = {
      _id: `temp-${Date.now()}` as any,
      role: 'user',
      content: messageContent,
      conversationId: currentConversation?._id || ('' as any),
      userId: '' as any,
      createdAt: new Date(),
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);

    try {
      const response = await fetch('/api/model/handler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionMessages: currentConversation
            ? [...messages, { role: 'user', content: messageContent }]
            : [{ role: 'user', content: messageContent }],
          conversationId: currentConversation?._id,
          walletAddress
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }

      const data = await response.json();
      console.log('API data response (dashboard):', data);

      // Handle tool calls if present
      if (typeof data?.response === 'string') {
        try {
          // First, try to parse as JSON (for tool calls)
          let parsedResponse;
          try {
            parsedResponse = JSON.parse(data.response);
          } catch (e) {
            // If parsing fails, it's a regular text response - not an error
            console.log('Regular text response received:', data.response);
            // Continue with updating messages and conversation
            if (data.messages) {
              setMessages(data.messages);
              if (data.conversation) {
                handleConversationUpdate(data);
              }
            }
            return; // Exit early for text responses
          }

          // If we got here, we successfully parsed JSON (tool calls)
          console.log('Parsed response:', parsedResponse);

          if (Array.isArray(parsedResponse) && parsedResponse.length > 0) {
            for (const toolCall of parsedResponse) {
              if (!toolCall.result) continue;

              const toolResult = JSON.parse(toolCall.result);
              console.log('Tool result:', toolResult);

              switch (toolCall.tool) {
                case 'swapTokens': {
                  try {
                    const swapResult = await handleSwap(toolResult);

                    if (swapResult.success) {
                      toast.success('Swap successful!');
                      setMessages(prevMessages => [...prevMessages, {
                        _id: `system-${Date.now()}` as any,
                        role: 'system',
                        content: `Successfully swapped ${swapResult.inputAmount} ${swapResult.inputToken} for approximately ${swapResult.estimatedOutput} ${swapResult.outputToken}. Transaction ID: ${swapResult.signature}`,
                        conversationId: currentConversation?._id || ('' as any),
                        userId: '' as any,
                        createdAt: new Date(),
                      }]);
                    }
                  } catch (error) {
                    console.error('Swap execution error:', error);
                    toast.error(error instanceof Error ? error.message : 'Swap failed');
                    setMessages(prevMessages => [...prevMessages, {
                      _id: `system-${Date.now()}` as any,
                      role: 'system',
                      content: `Swap failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                      conversationId: currentConversation?._id || ('' as any),
                      userId: '' as any,
                      createdAt: new Date(),
                    }]);
                  }
                  break;
                }

                case 'transferSol': {
                  if (toolResult.type === 'PENDING_TRANSACTION') {
                    try {
                      const response = await handleTransferToolCalls([{
                        name: 'transferSol',
                        arguments: {
                          recipient: toolResult.recipient,
                          amount: toolResult.amount,
                          network: toolResult.network || 'devnet'
                        }
                      }]);

                      console.log("Transfer response:", response);

                      if (response[0].result) {
                        toast.success('Transfer successful!');
                        setMessages(prevMessages => [...prevMessages, {
                          _id: `system-${Date.now()}` as any,
                          role: 'system',
                          content: response[0].result,
                          conversationId: currentConversation?._id || ('' as any),
                          userId: '' as any,
                          createdAt: new Date(),
                        }]);
                      } else if (response[0].error) {
                        throw new Error(response[0].error);
                      }
                    } catch (error) {
                      console.error('Transfer error:', error);
                      toast.error(error instanceof Error ? error.message : 'Transfer failed');
                      setMessages(prevMessages => [...prevMessages, {
                        _id: `system-${Date.now()}` as any,
                        role: 'system',
                        content: `Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        conversationId: currentConversation?._id || ('' as any),
                        userId: '' as any,
                        createdAt: new Date(),
                      }]);
                    }
                  }
                  break;
                }
              }
            }
          }
        } catch (e) {
          console.error('Error handling tool response:', e);
          // Don't throw here, as we still want to update messages
        }
      }

      // Update conversation and messages
      if (data.messages) {
        setMessages(data.messages);
        if (data.conversation) {
          handleConversationUpdate(data);
        }
      }

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      toast.error('Failed to send message');
      setMessages(prevMessages => prevMessages.filter(msg => msg._id !== userMessage._id));
      setMessage(messageContent);
    } finally {
      setIsLoading(false);
    }
  }, [message, messages, currentConversation, isLoading, walletAddress]);

  // Helper function to handle conversation updates
  const handleConversationUpdate = (data: any) => {
    if (currentConversation) {
      setConversations(prevConversations => prevConversations.map(conv =>
        conv._id === data.conversation._id
          ? {
            ...conv,
            messageCount: data.messages.length,
            lastMessageAt: new Date()
          }
          : conv
      ));
    } else {
      setCurrentConversation(data.conversation);
      setConversations(prevConversations => [{
        ...data.conversation,
        messageCount: data.messages.length,
        lastMessageAt: new Date()
      }, ...prevConversations]);
    }
  };

  return (
    <DashboardLayout
      conversations={conversations}
      onConversationChange={handleConversationChange}
      currentConversation={currentConversation}
      onNewChat={handleNewChat}
    >
      <div className="h-[calc(100vh-4rem)] p-6">
        <ChatInterface
          currentConversation={currentConversation}
          messages={messages}
          message={message}
          setMessage={setMessage}
          error={error}
          isLoading={isLoading}
          handleSubmit={handleSubmit}
          view={view}
          onViewToggle={handleViewToggle}
        />
      </div>
    </DashboardLayout>
  );
}