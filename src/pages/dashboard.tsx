import { useCallback, useState, useEffect } from "react";
import { Message, Conversation } from "@/lib/db/types";
import toast from "react-hot-toast";
import { DashboardLayout } from '@/lib/layouts';
import { ChatInterface } from "@/lib/components/dashboard/ChatInterface";
import { useSession } from "next-auth/react";
import { handleToolCalls } from "@/lib/solana/solana";

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | undefined>(undefined);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { data: session } = useSession();
  const walletAddress = session?.user.walletAddress;

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
      console.log('Sending message to API:', messageContent);
      
      const truncatedUserMessage = { role: 'user' as const, content: messageContent };

      const response = await fetch('/api/model/handler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionMessages: currentConversation 
            ? [...messages, truncatedUserMessage] 
            : [truncatedUserMessage],
          conversationId: currentConversation?._id,
          walletAddress
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }

      const data = await response.json();
      
      if(data.messages && data.messages[data.messages.length - 1].role === 'tool') {
        const toolArguments = JSON.parse((JSON.parse(data.messages[data.messages.length - 1].content)))[0];
      
        console.log('Tool arguments:', toolArguments);
        const toolArgumentResults = JSON.parse(toolArguments.result);


        if(toolArguments.tool === 'transferSol') {
          try {
            const response = await handleToolCalls([{
              name: 'transferSol', 
              arguments: {
                recipient: toolArgumentResults.recipient,
                amount: toolArgumentResults.amount,
                network: toolArgumentResults.network || 'devnet'
              }
            }]);

            console.log("Response from tool call:", response);
      
            // Handle the response
            if (response[0].result) {
              toast.success('Transaction successful!');
              // Add success message to chat
              setMessages(prevMessages => [...prevMessages, {
                _id: `system-${Date.now()}` as any,
                role: 'system',
                content: response[0].result,
                conversationId: currentConversation?._id || ('' as any),
                userId: '' as any,
                createdAt: new Date(),
              } as Message]);
            } else if (response[0].error) {
              throw new Error(response[0].error);
            }
          } catch (error) {
            console.error('Transaction error:', error);
            toast.error(error instanceof Error ? error.message : 'Transaction failed');
            // Add error message to chat
            setMessages(prevMessages => [...prevMessages, {
              _id: `system-${Date.now()}` as any,
              role: 'system',
              content: `Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              conversationId: currentConversation?._id || ('' as any),
              userId: '' as any,
              createdAt: new Date(),
            } as Message]);
          }
        }
      }
      
      if (currentConversation) {
        setMessages(data.messages);
        setConversations(prevConversations => prevConversations.map(conv => 
          conv._id.toString() === currentConversation._id.toString() 
            ? {
                ...conv,
                messageCount: data.messages.length,
                lastMessageAt: new Date()
              }
            : conv
        ));
      } else {
        setCurrentConversation(data.conversation);
        setMessages(data.messages);
        setConversations(prevConversations => [{
          ...data.conversation,
          messageCount: data.messages.length,
          lastMessageAt: new Date()
        }, ...prevConversations]);
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
        />
      </div>
    </DashboardLayout>
  );
}