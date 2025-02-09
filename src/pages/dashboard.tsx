import { useCallback, useState, useEffect } from "react";
import { Message, Conversation } from "@/lib/db/types";
import toast from "react-hot-toast";
import { DashboardLayout } from '@/lib/layouts';
import { ChatInterface } from "@/lib/components/dashboard/ChatInterface";
import { useSession } from "next-auth/react";
import { sendMessage } from "@/lib/chat/message-handler";

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
      const response = await sendMessage(
        messageContent,
        messages,
        currentConversation?._id,
        walletAddress
      );

      if (response.error) {
        throw new Error(response.error);
      }

      setMessages(response.messages);
      
      if (response.conversation) {
        handleConversationUpdate(response);
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
          view={view}
          onViewToggle={handleViewToggle}
        />
      </div>
    </DashboardLayout>
  );
}