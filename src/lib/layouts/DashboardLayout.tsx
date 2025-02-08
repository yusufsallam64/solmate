import React from 'react';
import Header from '../components/header';
import { ProblemSet } from '../db/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  onProblemSetChange?: (problemSetId: string) => void;
  currentProblemSetId?: string | null;
  problemSet: ProblemSet | null;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  problemSet,
  children,
  onProblemSetChange,
  currentProblemSetId,
}) => {
  return (
    <Header
      problemSet={problemSet}
      onProblemSetChange={onProblemSetChange}
      currentProblemSetId={currentProblemSetId}
    >
      {children}
    </Header>
  );
};

export default DashboardLayout;