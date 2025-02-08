import React from 'react';
import Header from '../components/header';
import { ProblemSet } from '../db/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  onProblemSetChange?: (problemSetId: string) => void;
  currentProblemSetId?: string | null;
  onOpenScreenCapture: () => void;
  problemSet: ProblemSet | null;
  stopScreenShare: () => void;  
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  problemSet,
  children,
  onProblemSetChange,
  currentProblemSetId,
  onOpenScreenCapture,
  stopScreenShare
}) => {
  return (
    <Header
      problemSet={problemSet}
      onProblemSetChange={onProblemSetChange}
      currentProblemSetId={currentProblemSetId}
      onOpenScreenCapture={onOpenScreenCapture}
      stopScreenShare={stopScreenShare}
    >
      {children}
    </Header>
  );
};

export default DashboardLayout;