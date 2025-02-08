import { useCallback, useState, useEffect } from "react";
import { Message, Conversation } from "@/lib/db/types";
import toast from "react-hot-toast";
import { DashboardLayout } from '@/lib/layouts';
import { ChatInterface } from "@/lib/components/dashboard/ChatInterface";
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { DatabaseService } from "@/lib/db/service";
import { useSession } from "next-auth/react";

interface MessageData {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

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
    try {
      const response = await fetch(`/api/conversations/${conversationId}`);
      if (!response.ok) throw new Error('Failed to fetch conversation');
      
      const data = await response.json();
      setCurrentConversation(data.conversation);
      setMessages(data.messages);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      toast.error('Failed to load conversation');
    }
  };

  const handleNewChat = useCallback(() => {
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

    // Create the user message object
    const userMessage: Message = {
      _id: `temp-${Date.now()}` as any, // temporary ID for optimistic update
      role: 'user',
      content: messageContent,
      conversationId: currentConversation?._id || ('' as any),
      userId: '' as any, // This will be set by the server
      createdAt: new Date(),
    };

    // Immediately update the UI with the user's message
    setMessages(prevMessages => [...prevMessages, userMessage]);
  
    try {      
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
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      toast.error('Failed to send message');
      setMessages(prevMessages => prevMessages.filter(msg => msg._id !== userMessage._id));
      setMessage(messageContent);
    } finally {
      setIsLoading(false);
    }
  }, [message, messages, currentConversation, isLoading]);

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

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user?.email) {
    return {
      redirect: {
        destination: '/auth/signup',
        permanent: false
      }
    };
  }

  return { props: {} };
}