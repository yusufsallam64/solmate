import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import { useRouter } from 'next/router';
import { ProblemSet, SubjectIcon } from '@/lib/db/types';
import toast from 'react-hot-toast';
import { SUBJECT_OPTIONS } from './subject-icons';
import { CreateProblemSetModal } from './CreateProblemSetModal';

interface SidebarProps {
  isOpen: boolean;
  onProblemSetSelect?: (problemSetId: string) => void;
  currentProblemSetId?: string | null;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onProblemSetSelect,
  currentProblemSetId,
  setIsOpen
}) => {
  const router = useRouter();
  const problemSetCount = 8;
  const [problemSets, setProblemSets] = useState<ProblemSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [displayCount, setDisplayCount] = useState(problemSetCount);

  // Reset display count when problem sets change
  useEffect(() => {
    setDisplayCount(problemSetCount);
  }, [problemSets.length]);

  const handleProblemSetClick = useCallback((problemSetId: string) => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setIsOpen(false);
    }
    if (onProblemSetSelect) {
      onProblemSetSelect(problemSetId);
    }
    router.push(`/dashboard?problemSet=${problemSetId}`);
  }, [onProblemSetSelect, router, setIsOpen]);

  const fetchProblemSets = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/problemsets');
      if (!response.ok) throw new Error('Failed to fetch problem sets');
      const data = await response.json();
      setProblemSets(data);
    } catch (err) {
      console.error('Error fetching problem sets:', err);
      toast.error('Failed to load problem sets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch effect
  useEffect(() => {
    fetchProblemSets();
  }, [fetchProblemSets]);

  // Event listener effect
  useEffect(() => {
    const handleProblemSetUpdate = () => {
      fetchProblemSets();
    };

    const handleProblemSetDeleted = (event: CustomEvent<{ problemSetId: string }>) => {
      setProblemSets(prevSets => {
        const updatedSets = prevSets.filter(set =>
          set._id.toString() !== event.detail.problemSetId
        );

        if (event.detail.problemSetId === currentProblemSetId) {
          if (updatedSets.length > 0) {
            handleProblemSetClick(updatedSets[0]._id.toString());
          } else {
            router.push('/dashboard');
          }
        }

        return updatedSets;
      });
    };

    window.addEventListener('problemSetUpdated', handleProblemSetUpdate);
    window.addEventListener('problemSetDeleted', handleProblemSetDeleted as EventListener);

    return () => {
      window.removeEventListener('problemSetUpdated', handleProblemSetUpdate);
      window.removeEventListener('problemSetDeleted', handleProblemSetDeleted as EventListener);
    };
  }, [currentProblemSetId, fetchProblemSets, handleProblemSetClick, router]);

  return (
    <>
      <div className={`md:static top-16 bg-primary-900 border-r border-accent/10 transition-all duration-300 h-[calc(100vh-4rem)] ${isOpen ? 'w-full md:w-64' : 'w-0 overflow-hidden'}`}>
        <div className="h-full flex flex-col min-w-[16rem]">
          <div className="flex-none flex items-center justify-between p-4 border-b border-accent/10">
            <h2 className="text-lg font-semibold text-primary-100">Problem Sets</h2>
            <button
              onClick={() => setShowModal(true)}
              className="p-2 rounded-lg hover:bg-accent/10 transition-colors duration-200 text-accent"
              title="New Problem Set"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {isLoading ? (
              <LoadingState />
            ) : problemSets.length === 0 ? (
              <EmptyState onCreateNew={() => setShowModal(true)} />
            ) : (
              <ProblemSetList
                problemSets={problemSets}
                currentProblemSetId={currentProblemSetId}
                onProblemSetSelect={handleProblemSetClick}
                displayCount={displayCount}
                setDisplayCount={setDisplayCount}
                problemSetCount={problemSetCount}
              />
            )}
          </div>
        </div>
      </div>

      <CreateProblemSetModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onProblemSetCreated={(id) => {
          fetchProblemSets();
          handleProblemSetClick(id);
        }}
      />
    </>
  );
};

// LoadingState component remains the same
const LoadingState: React.FC = () => (
  <div className="flex items-center justify-center h-32">
    <div className="w-6 h-6 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
  </div>
);

// EmptyState component remains the same
interface EmptyStateProps {
  onCreateNew: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onCreateNew }) => (
  <div className="text-center p-4 text-primary-200">
    <p>No problem sets yet</p>
    <button
      onClick={onCreateNew}
      className="mt-2 text-sm text-accent hover:text-accent-500 transition-colors duration-200"
    >
      Create your first set
    </button>
  </div>
);

interface ProblemSetListProps {
  problemSets: ProblemSet[];
  currentProblemSetId?: string | null;
  onProblemSetSelect: (id: string) => void;
  displayCount: number;
  setDisplayCount: React.Dispatch<React.SetStateAction<number>>;
  problemSetCount: number;
}

const ProblemSetList: React.FC<ProblemSetListProps> = ({
  problemSets,
  currentProblemSetId,
  onProblemSetSelect,
  displayCount,
  setDisplayCount,
  problemSetCount
}) => {
  const getIconComponent = (icon?: SubjectIcon) => {
    if (!icon || icon === 'general') {
      return { Icon: SUBJECT_OPTIONS[0].Icon, color: SUBJECT_OPTIONS[0].color };
    }
    const option = SUBJECT_OPTIONS.find(opt => opt.value === icon);
    return option 
      ? { Icon: option.Icon, color: option.color }
      : { Icon: SUBJECT_OPTIONS[0].Icon, color: SUBJECT_OPTIONS[0].color };
  };

  return (
    <>
      {problemSets.slice(0, displayCount).map((problemSet) => {
        const { Icon, color } = getIconComponent(problemSet.icon);
        
        return (
          <button
            key={problemSet._id.toString()}
            onClick={() => onProblemSetSelect(problemSet._id.toString())}
            className={`w-full p-3 text-left rounded-lg transition-colors duration-200 group
              ${currentProblemSetId === problemSet._id.toString()
                ? 'bg-accent/20 hover:bg-accent/25'
                : 'hover:bg-accent/10'}`}
          >
            <div className="flex items-center gap-3">
              <Icon 
                size={16} 
                style={{ color }} 
                className="shrink-0 transition-colors group-hover:opacity-80" 
              />
              <span className="text-primary-100 group-hover:text-primary-200 truncate">
                {problemSet.title}
              </span>
            </div>
          </button>
        );
      })}
      
      {problemSets.length > displayCount && (
        <button
          onClick={() => setDisplayCount(prev => prev + problemSetCount)}
          className="w-full mt-2 py-1 text-center text-sm text-accent hover:text-accent/80 transition-colors duration-200"
        >
          Show More
        </button>
      )}
    </>
  );
};

export default Sidebar;