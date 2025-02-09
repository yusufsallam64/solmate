import { useRef, useEffect } from 'react';
import { Message, Conversation } from "@/lib/db/types";
import MessageInput from './MessageInput';
import { Plus, Wallet } from 'lucide-react';
import Logo from '../Logo';

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
    <div className="h-full flex flex-col bg-background-900/30 backdrop-blur-xl rounded-2xl border border-primary-200/30 shadow-lg overflow-hidden max-w-4xl mx-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-primary-200/30 bg-gradient-to-r from-background-900/50 to-background-950/50">
        <h2 className="text-lg font-title text-secondary-500">
          {currentConversation?.title || "New Transaction"}
        </h2>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <div
            ref={messageContainerRef}
            className="h-[calc(100%-4rem)] overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-primary-200/30 scrollbar-track-transparent"
          >
            {!messages?.length ? (
              <div className="h-full flex flex-col items-center justify-center space-y-6 text-center p-8">
                <div className="relative">
                  <Logo size={72} className="text-accent-400 opacity-50" />
                  <div className="absolute inset-0 bg-primary-200/30 blur-xl animate-pulse-slow" />
                </div>
                <div>
                  <h2 className="text-2xl font-title text-accent-400 mb-2 font-bold">Welcome to SolanaChat</h2>
                  <p className="text-primary-300">Start a new transaction by sending a message</p>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`group p-4 rounded-xl backdrop-blur-sm transition-all duration-300 ${
                    msg.role === 'user'
                      ? 'ml-auto w-fit max-w-[80%] bg-accent-500/10 border border-accent-500/20 hover:border-accent-500/30'
                      : 'mr-auto w-fit max-w-[80%] bg-secondary-500/10 border border-secondary-500/20 hover:border-secondary-500/30'
                  }`}
                >
                  <p className={`text-sm font-medium mb-2 ${
                    msg.role === 'user' 
                      ? 'text-accent-400 group-hover:text-accent-300' 
                      : 'text-secondary-400 group-hover:text-secondary-300'
                  }`}>
                    {msg.role === 'user' ? 'You' : 'Assistant'}
                  </p>
                  <p className="text-text-50 group-hover:text-primary-50 whitespace-pre-wrap leading-relaxed">
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