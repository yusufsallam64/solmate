import { useRef, useEffect, useState, useCallback } from 'react';
import { Message, Conversation } from "@/lib/db/types";
import MessageInput from './MessageInput';
import { Plus, Wallet, Mic, MicOff } from 'lucide-react';
import Logo from '../Logo';
import ViewToggleButton from '@/lib/components/header/ViewToggleButton';
import { VoiceHandler } from '@/lib/components/voice/VoiceHandler';
import { AutoplayResponse } from '@/lib/components/voice/AutoplayResponse';
import toast from 'react-hot-toast';

interface ChatInterfaceProps {
  currentConversation: Conversation | undefined;
  messages: Message[] | undefined;
  message: string;
  setMessage: (message: string) => void;
  error: string;
  isLoading: boolean;
  handleSubmit: (e: React.FormEvent, messageOverride?: string) => Promise<void>;
  view: 'chat' | 'voice';
  onViewToggle: () => void;
  useElevenLabs: boolean;
  voiceId: string;
}

export const ChatInterface = ({
  currentConversation,
  messages,
  message,
  setMessage,
  error,
  isLoading,
  handleSubmit,
  view,
  onViewToggle,
  useElevenLabs,
  voiceId,
}: ChatInterfaceProps) => {
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleVoiceMessage = useCallback(async (transcript: string) => {
    console.log('Processing voice message:', transcript);
    if (!transcript.trim() || isProcessing) return;

    try {
      setIsProcessing(true);
      
      const submitEvent = {
        preventDefault: () => {},
      } as React.FormEvent;
      
      setMessage(transcript);
      await handleSubmit(submitEvent, transcript);
      
      console.log('LLM processing complete');
    } catch (error) {
      console.error('Error processing voice message:', error);
      toast.error('Failed to process voice message');
    } finally {
      setIsProcessing(false);
    }
  }, [handleSubmit, setMessage, isProcessing]);

  // Handle new messages for voice output
  useEffect(() => {
    if (messages?.length && useElevenLabs) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        console.log('New assistant response:', lastMessage.content);
        setLastResponse(lastMessage.content);
      }
    }
  }, [messages, useElevenLabs]);

  // Reset states when view changes
  useEffect(() => {
    if (view !== 'voice') {
      setIsListening(false);
      setIsProcessing(false);
      setLastResponse(null);
    }
  }, [view]);

  const handleSpeakComplete = useCallback(() => {
    console.log('Speech completed');
    setIsSpeaking(false);
    setLastResponse(null);
  }, []);

  const toggleListening = useCallback(() => {
    if (isProcessing) {
      console.log('Cannot toggle while processing');
      return;
    }
    console.log('Toggling listening state:', !isListening);
    setIsListening(!isListening);
  }, [isListening, isProcessing]);

  // Handle new messages
  useEffect(() => {
    if (view === 'voice' && messages?.length) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        console.log('New assistant response:', lastMessage.content);
        setLastResponse(lastMessage.content);
        setIsSpeaking(true);
      }
    }
  }, [messages, view]);

  // Debug log when message or isLoading changes
  useEffect(() => {
    console.log('Message or loading state changed:', { message, isLoading });
  }, [message, isLoading]);

  return (
    <div className="h-full flex flex-col bg-background-900/30 backdrop-blur-xl rounded-2xl border border-primary-200/30 shadow-lg overflow-hidden max-w-4xl mx-auto">
      {view === 'voice' && (
        <VoiceHandler
          isListening={isListening}
          setIsListening={setIsListening}
          onMessageReceived={handleVoiceMessage}
          onSpeakComplete={handleSpeakComplete}
        />
      )}
      
      <div className="flex items-center justify-between px-6 py-4 border-b border-primary-200/30 bg-gradient-to-r from-background-900/50 to-background-950/50">
        <div className="flex items-center gap-4 flex-row place-content-between w-full">
          <h2 className="text-lg font-title text-secondary-500">
            {currentConversation?.title || "New Conversation"}
          </h2>
          <div className="flex items-center gap-4">
            {view === 'voice' && (
              <button
                onClick={toggleListening}
                disabled={isSpeaking || isProcessing}
                className={`p-2 rounded-lg transition-colors ${
                  isListening
                    ? 'bg-accent-500 text-white hover:bg-accent-600'
                    : 'bg-primary-800 text-primary-200 hover:bg-primary-700'
                } ${(isSpeaking || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isListening ? 'Stop listening' : 'Start listening'}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            )}
            <ViewToggleButton 
              view={view} 
              onToggle={onViewToggle}
            />
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <div
            ref={messageContainerRef}
            className="h-[calc(100%-4rem)] overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-primary-200/30 scrollbar-track-transparent"
          >
            {messages?.map((msg, index) => (
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
            ))}
          </div>
          
          {/* Input Section */}
          {view !== 'voice' ? (
            <MessageInput
              message={message}
              setMessage={setMessage}
              error={error}
              isLoading={isLoading}
              onSubmit={handleSubmit}
            />
          ) : (
            <div className="h-16 flex items-center justify-center bg-background-950/30">
              {isListening ? (
                <div className="px-4 py-2 bg-accent-500 text-white rounded-full animate-pulse">
                  Listening... (Click mic to stop)
                </div>
              ) : isProcessing ? (
                <div className="px-4 py-2 bg-primary-800 text-white rounded-full animate-pulse">
                  Processing your message...
                </div>
              ) : isSpeaking ? (
                <div className="px-4 py-2 bg-secondary-500 text-white rounded-full">
                  Speaking response...
                </div>
              ) : (
                <div className="text-primary-300">
                  Click the microphone icon to start speaking
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isSpeaking && lastResponse && view === 'voice' && (
        <AutoplayResponse
          text={lastResponse}
          onComplete={handleSpeakComplete} 
          voiceId={'cgSgspJ2msm6clMCkdW9'}        />
      )}
    </div>
  );
};