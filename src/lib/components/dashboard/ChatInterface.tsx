import { useRef, useEffect } from 'react';
import { Message, Conversation } from "@/lib/db/types";
import MessageInput from './MessageInput';
import { Plus } from 'lucide-react';

interface ChatInterfaceProps {
  currentConversation: Conversation | undefined;
  messages: Message[] | undefined;
  message: string;
  setMessage: (message: string) => void;
  error: string;
  isLoading: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export const ChatInterface = ({
  currentConversation,
  messages,
  message,
  setMessage,
  error,
  isLoading,
  handleSubmit,
}: ChatInterfaceProps) => {
  const messageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-primary/30 backdrop-blur-md rounded-2xl border border-accent/10 shadow-lg overflow-hidden max-w-4xl mx-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-accent/10">
        <h2 className="text-lg font-semibold text-primary-100">
          {currentConversation?.title || "New Chat"}
        </h2>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <div
            ref={messageContainerRef}
            className="h-[calc(100%-4rem)] overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-accent/20 scrollbar-track-transparent"
          >
            {!messages?.length ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4 text-center">
                <img src="/logo-dark.png" alt="Logo" className="w-24 h-24" />
                <h2 className="text-2xl font-semibold text-primary-100/50">Welcome to Your Chat</h2>
                <p className="text-primary-100/30">Send a message to start a new conversation</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`group p-4 rounded-xl backdrop-blur-xs transition-all duration-300 ${
                    msg.role === 'user'
                      ? 'ml-auto w-fit max-w-[80%] bg-accent/10 border border-accent/20 hover:border-accent/30'
                      : 'mr-auto w-fit max-w-[80%] bg-secondary/10 border border-secondary/20 hover:border-secondary/30'
                  }`}
                >
                  <p className={`text-sm font-medium mb-2 ${msg.role === 'user' ? 'text-accent' : 'text-secondary'}`}>
                    {msg.role === 'user' ? 'You' : 'Assistant'}
                  </p>
                  <p className="text-primary-100 whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              ))
            )}
          </div>

          <MessageInput
            message={message}
            setMessage={setMessage}
            error={error}
            isLoading={isLoading}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};