import { useCallback, useState, useEffect } from "react";
import { Message, Problem, ProblemSet } from "@/lib/db/types";
import toast from "react-hot-toast";
import { DashboardLayout } from '@/lib/layouts';
import { ChatInterface } from "@/lib/components/dashboard/ChatInterface";
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { DatabaseService } from "@/lib/db/service";
import ScreenCaptureModal from '@/lib/components/screen-capture/ScreenCaptureModal';

type ViewState = 'chat' | 'problems';
interface MessageData {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentProblem, setCurrentProblem] = useState<Problem | undefined>(undefined);
  const [currentProblemSetId, setCurrentProblemSetId] = useState<string | null>(null);
  const [currentProblemSet, setCurrentProblemSet] = useState<ProblemSet | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [viewState, setViewState] = useState<ViewState>('chat');
  const [isScreenCaptureOpen, setIsScreenCaptureOpen] = useState(false);
  const [screenCaptureStream, setScreenCaptureStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const stopScreenShare = useCallback(() => {
    if (screenCaptureStream) {
      screenCaptureStream.getTracks().forEach(track => track.stop());
      setScreenCaptureStream(null);
      setIsScreenSharing(false);
    }
  }, [screenCaptureStream]);

  useEffect(() => {
    return () => {
      stopScreenShare();
    };
  }, [stopScreenShare]);

  // Load problem sets on mount
  useEffect(() => {
    async function loadProblemSets() {
      try {
        const response = await fetch('/api/problemsets');
        if (!response.ok) throw new Error('Failed to fetch problem sets');

        const sets: ProblemSet[] = await response.json();

        if (sets.length > 0 && !currentProblemSetId) {
          const firstSetId = sets[0]._id.toString();
          setCurrentProblemSetId(firstSetId);
          setCurrentProblemSet(sets[0]);
          await loadProblemsForSet(firstSetId);
        }
      } catch (error) {
        console.error('Error loading problem sets:', error);
        toast.error('Failed to load problem sets');
      }
    }
    loadProblemSets();
  }, []);

  useEffect(() => {
    if (!currentProblemSetId) return;

    async function loadProblems() {
      try {
        const response = await fetch(`/api/problemsets/${currentProblemSetId}/problems`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch problems');
        }

        const problemsData = await response.json();
        setProblems(problemsData);
      } catch (error) {
        console.error('Error loading problems:', error);
        toast.error('Failed to load problems');
      }
    }

    loadProblems();
  }, [currentProblemSetId]);

  const handleProblemSetChange = async (problemSetId: string) => {
    setCurrentProblemSetId(problemSetId);
    setCurrentProblem(undefined);
    setMessages([]);

    try {
      const response = await fetch(`/api/problemsets/${problemSetId}`);
      if (!response.ok) throw new Error('Failed to fetch problem set');
      const problemSet = await response.json();
      setCurrentProblemSet(problemSet);
    } catch (error) {
      console.error('Error fetching problem set:', error);
      toast.error('Failed to load problem set');
    }

    await loadProblemsForSet(problemSetId);
  };

  const loadProblemsForSet = useCallback(async (problemSetId: string, state?: ViewState) => {
    try {
      const response = await fetch(`/api/problemsets/${problemSetId}/problems`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch problems');
      }

      const problemsData = await response.json();
      setProblems(problemsData);
      setViewState((problemsData.length > 0) ? 'problems' : 'chat');
      if (state) {
        setViewState(state);
      }
    } catch (error) {
      console.error('Error loading problems:', error);
      toast.error('Failed to load problems');
      setProblems([]);
      setViewState('chat');
    }
  }, []);

  const handleScreenshot = useCallback(async (screenshot: string) => {
    if (viewState !== 'chat') {
      toast.error('Please select a problem', { duration: 3000 });
      return;
    }
    try {
      
      const response = await fetch('/api/screenshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          screenshot,
          problemSetId: currentProblemSetId
        }),
      });

      if (!response.ok) throw new Error('Failed to process screenshot');

      const { problem, messages: newMessages } = await response.json();

      if (problem && newMessages) {
        setCurrentProblem(problem);
        setMessages(newMessages);
        
        if (currentProblemSetId) {
          await loadProblemsForSet(currentProblemSetId, 'chat');
        }
      } else {
        toast.error('No problem/solution found on screen. Please try again.');
      }
    } catch (error) {
      toast.error('Failed to process screenshot');
      console.error('Error processing screenshot:', error);
      setError('Failed to process screenshot');
    }
  }, [currentProblemSetId, loadProblemsForSet, viewState]);

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
      problemId: currentProblem?._id || ('' as any),
      userId: '' as any, // This will be set by the server
      createdAt: new Date(),
    };
    // Immediately update the UI with the user's message
    if (currentProblem) {
      setMessages(prevMessages => [...prevMessages, userMessage]);
    } else {
      setMessages([userMessage]);
    }
  
    try {      
      const truncatedUserMessage = { role: 'user' as const, content: messageContent };

      const response = await fetch('/api/model/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionMessages: currentProblem 
            ? [...messages, truncatedUserMessage] 
            : [truncatedUserMessage],
          problemSetId: currentProblemSetId,
          ...(currentProblem && { problemId: currentProblem._id })
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }
  
      const data = await response.json();
  
      if (currentProblem) {
        setMessages(data.messages);
        setProblems(prevProblems => prevProblems.map(problem => 
          problem._id.toString() === currentProblem._id.toString() 
            ? {
                ...problem,
                messageCount: data.messages.length,
                lastMessageAt: new Date()
              }
            : problem
        ));
      } else {
        setCurrentProblem(data.problem);
        setMessages(data.messages);
        setProblems(prevProblems => [{
          ...data.problem,
          messageCount: data.messages.length,
          lastMessageAt: new Date()
        }, ...prevProblems]);
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
  }, [message, messages, currentProblem, isLoading, currentProblemSetId]);

  return (
    <DashboardLayout
      problemSet={currentProblemSet}
      onProblemSetChange={handleProblemSetChange}
      currentProblemSetId={currentProblemSetId}
      onOpenScreenCapture={() => setIsScreenCaptureOpen(true)}
      stopScreenShare={stopScreenShare}
    >
      <div className="h-[calc(100vh-4rem)] p-6">
        <ChatInterface
          problems={problems}
          currentProblem={currentProblem}
          currentProblemSetId={currentProblemSetId}
          messages={messages}
          message={message}
          setMessage={setMessage}
          error={error}
          isLoading={isLoading}
          handleSubmit={handleSubmit}
          setCurrentProblem={setCurrentProblem}
          setMessages={setMessages}
          viewState={viewState}
          setViewState={setViewState}
          handleScreenshot={() => handleScreenshot('')}  
          isScreenSharing={isScreenSharing}
        />
      </div>

      <ScreenCaptureModal
        isOpen={isScreenCaptureOpen}
        onClose={() => setIsScreenCaptureOpen(false)}
        onCapture={handleScreenshot}
        externalStream={screenCaptureStream}
        onStreamChange={setScreenCaptureStream}
        isExternallySharing={isScreenSharing}
        onSharingChange={setIsScreenSharing}
      />
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