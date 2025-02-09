import { useCallback, useState, useEffect } from "react";
import { Message, Conversation } from "@/lib/db/types";
import toast from "react-hot-toast";
import { DashboardLayout } from '@/lib/layouts';
import { ChatInterface } from "@/lib/components/dashboard/ChatInterface";
import { useSession } from "next-auth/react";
import { sendMessage } from "@/lib/chat/message-handler";
import { useVoice } from "@/lib/components/voice/VoiceContextProvider";

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | undefined>(undefined);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [view, setView] = useState<'chat' | 'voice'>('chat');
  const [isInitializingVoice, setIsInitializingVoice] = useState(false);
  const { data: session } = useSession();
  const walletAddress = session?.user.walletAddress;

  const [useElevenLabs, setUseElevenLabs] = useState(false);
  const { voiceId } = useVoice();

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
      // Only reset to chat view if we're changing conversations
      if (currentConversation?._id !== conversationId) {
        setView('chat');
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      toast.error('Failed to load conversation');
    }
  };

  const handleNewChat = useCallback(() => {
    setCurrentConversation(undefined);
    setMessages([]);
    setMessage("");
    setView('chat');
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

  const handleSubmit = useCallback(async (e: React.FormEvent, messageOverride?: string, isGuruMode: boolean = false) => {
    e.preventDefault();
  
    const messageToSend = messageOverride || message;
    console.log('Handling submit with message:', messageToSend, 'isGuruMode:', isGuruMode);
    
    if (!messageToSend.trim() || isLoading) return;
  
    setIsLoading(true);
    setError("");
  
    const messageContent = messageToSend.trim();
    setMessage("");
  
    const userMessage: Message = {
      _id: `temp-${Date.now()}` as any,
      role: 'user',
      content: messageContent,
      conversationId: currentConversation?._id || ('' as any),
      userId: '' as any,
      createdAt: new Date(),
    };
  
    // Add user message to the messages array
    setMessages(prevMessages => [...prevMessages, userMessage]);
  
    try {
      // Get the current messages to include in the API call
      const currentMessages = [...(messages || [])];
      
      const response = await sendMessage(
        messageContent,
        currentMessages,
        currentConversation?._id,
        walletAddress,
        isGuruMode  // Add this parameter
      );
  
      // ... rest of your existing code
      if (response.error) {
        throw new Error(response.error);
      }
  
      // Add only the new assistant message to the existing conversation
      const assistantMessage = response.messages[response.messages.length - 1];
      setMessages(prevMessages => {
        // Remove any temporary messages
        const withoutTemp = prevMessages.filter(msg => msg._id !== userMessage._id);
        // Add the permanent user message and the new assistant message
        return [...withoutTemp, 
          { ...userMessage, _id: response.messages[response.messages.length - 2]._id }, // Use permanent ID
          assistantMessage
        ];
      });
      
      if (response.conversation) {
        handleConversationUpdate(response);
      }
  
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      toast.error('Failed to send message');
      // Remove only the failed message
      setMessages(prevMessages => prevMessages.filter(msg => msg._id !== userMessage._id));
      setMessage(messageContent);
    } finally {
      setIsLoading(false);
    }
  }, [message, messages, currentConversation, isLoading, walletAddress, handleConversationUpdate]);
  
  const handleViewToggle = useCallback(async () => {
    if (isInitializingVoice) return;

    const newView = view === 'chat' ? 'voice' : 'chat';
    console.log('Attempting to toggle view from:', view, 'to:', newView);

    if (newView === 'voice') {
      setIsInitializingVoice(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setView(newView);
        setUseElevenLabs(true); // Enable ElevenLabs when switching to voice mode
      } catch (error) {
        console.error('Failed to initialize voice mode:', error);
        toast.error('Could not enable voice mode. Please check microphone permissions.');
        return;
      } finally {
        setIsInitializingVoice(false);
      }
    } else {
      setView(newView);
      setUseElevenLabs(false); // Disable ElevenLabs when switching to chat mode
    }
  }, [view, isInitializingVoice]);



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
          useElevenLabs={useElevenLabs}
          voiceId={voiceId ?? "21m00Tcm4TlvDq8ikWAM"}
        />
      </div>
    </DashboardLayout>
  );
}