import { useRef, useEffect, useCallback } from 'react';
import { Message, Problem } from "@/lib/db/types";
import Latex from "react-latex-next";
import toast from "react-hot-toast";
import { ProblemList, ProblemHeader } from "@/lib/components/dashboard/ProblemList";
import MessageInput from './MessageInput';

type ViewState = 'chat' | 'problems';

interface ChatInterfaceProps {
  problems: Problem[];
  currentProblem: Problem | undefined;
  currentProblemSetId: string | null;
  messages: Message[] | undefined;
  message: string;
  setMessage: (message: string) => void;
  error: string;
  isLoading: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  setCurrentProblem: (problem: Problem | undefined) => void;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  viewState: ViewState;
  setViewState: (state: ViewState) => void;
}

export const ChatInterface = ({
  problems,
  currentProblem,
  currentProblemSetId,
  messages,
  message,
  setMessage,
  error,
  isLoading,
  handleSubmit,
  setCurrentProblem,
  setMessages,
  viewState,
  setViewState,
}: ChatInterfaceProps) => {
  const messageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (problems.length > 0 && !currentProblem) {
      setViewState('problems');
    } else if (problems.length === 0) {
      setViewState('chat');
    }
  }, [currentProblemSetId, problems.length, currentProblem, setViewState]);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = useCallback(async (problemId: string) => {
    try {
      const response = await fetch(`/api/problems/${problemId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const messages = await response.json();
      setMessages(messages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
      setMessages([]);
    }
  }, [setMessages]);

  const handleNewChat = useCallback(() => {
    setCurrentProblem(undefined);
    setMessages([]);
    setMessage("");
    setViewState('chat');
  }, [setCurrentProblem, setMessages, setMessage, setViewState]);

  const handleViewStateChange = (newState: ViewState) => {
    if (newState === 'problems' && (!problems || problems.length === 0)) {
      toast.error('Start a chat first to create a problem', { duration: 2000 });
      return;
    }
    setViewState(newState);
  };

  return (
    <div className="h-full flex flex-col bg-primary/30 backdrop-blur-md rounded-2xl border border-accent/10 shadow-lg overflow-hidden max-w-4xl mx-auto">
      <ProblemHeader
        currentProblem={currentProblem}
        onNewProblem={handleNewChat}
        onToggleOverview={() => handleViewStateChange(viewState === 'problems' ? 'chat' : 'problems')}
        viewState={viewState}
      />

      <div className="relative flex-1 overflow-hidden">
        <div
          className={`absolute inset-0 transition-all duration-300 ease-in-out transform ${
            viewState === 'problems' ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
          }`}
        >
          <ProblemList
            problems={problems}
            onSelectProblem={(problem) => {
              loadMessages(problem._id.toString());
              setCurrentProblem(problem);
              handleViewStateChange('chat');
            }}
            onClose={() => handleViewStateChange('chat')}
          />
        </div>

        <div
          className={`absolute inset-0 transition-all duration-300 ease-in-out transform ${
            viewState === 'chat' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          }`}
        >
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
                (messages || [])
                  .filter(msg => msg.role !== 'system' && msg.content !== 'NULL' && msg.content.split("\n")[0] !== 'SCREENSHOTINFORMATION')
                  .map((msg, index) => (
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
                        <Latex>{msg.content}</Latex>
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
    </div>
  );
};