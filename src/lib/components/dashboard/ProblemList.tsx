// lib/components/ProblemList.tsx
import React from 'react';
import { Plus, Menu, MessageSquare, Clock, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import type { Problem } from '@/lib/db/types';
import { formatDistanceToNow } from 'date-fns';

const StatusIcon = ({ status }: { status: Problem['status'] }) => {
  switch (status) {
    case 'solved':
      return <CheckCircle size={16} className="text-green-500" />;
    case 'unsolved':
      return <XCircle size={16} className="text-red-500" />;
    case 'in_progress':
      return <Clock size={16} className="text-yellow-500" />;
    case 'needs_review':
      return <HelpCircle size={16} className="text-blue-500" />;
  }
};

interface ProblemListProps {
  problems: Problem[];
  onSelectProblem: (problem: Problem) => void;
  onClose: () => void;
}

export const ProblemList: React.FC<ProblemListProps> = ({ problems, onSelectProblem, onClose }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {problems.map((problem, index) => (
          <button
            key={problem._id.toString()}
            onClick={() => onSelectProblem(problem)}
            className="w-full p-4 rounded-lg bg-primary-900/50 hover:bg-primary-900/70 border border-accent/10 
                     hover:border-accent/20 transition-all duration-200 group text-left"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {/* <StatusIcon status={problem.status} /> */}
                <span className='text-accent'>{index + 1}.</span>
                <span className="text-primary-100 group-hover:text-primary-200 font-medium">
                  {problem.title}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary-300">
                <div className="flex items-center gap-1">
                  <MessageSquare size={14} />
                  <span>{Math.floor(problem.messageCount)}</span>
                </div>
                <span className="text-primary-300/50">·</span>
                <span>{formatDistanceToNow(new Date(problem.lastMessageAt), { addSuffix: true })}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

interface ProblemHeaderProps {
  currentProblem?: Problem;
  onNewProblem: () => void;
  onToggleOverview: () => void;
  viewState: 'chat' | 'problems';
}

export const ProblemHeader: React.FC<ProblemHeaderProps> = ({
  currentProblem,
  onNewProblem,
  onToggleOverview, 
  viewState
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-accent/10">
      <h2 className="text-lg font-semibold text-primary-100">
        {viewState === 'problems' ? "Problems" : (currentProblem?.title || "New Chat")}
      </h2>
      <div className="flex items-center gap-2">
        <button
          onClick={onNewProblem}
          className="p-2 rounded-lg hover:bg-accent/10 transition-colors duration-200 text-primary-100 
                   hover:text-accent flex items-center gap-2"
          title="New Chat"
        >
          <Plus size={20} />
        </button>
        <button
          onClick={onToggleOverview}
          className="p-2 rounded-lg hover:bg-accent/10 transition-colors duration-200 text-primary-100 
                   hover:text-accent"
          title="View All Problems"
        >
          <Menu size={20} />
        </button>
      </div>
    </div>
  );
};