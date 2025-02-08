import React from 'react';
import Header from '../components/header';
import { Conversation } from '../db/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  conversations: Conversation[];
  onConversationChange: (conversationId: string) => void;
  currentConversation?: Conversation;
  onNewChat: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  conversations,
  onConversationChange,
  currentConversation,
  onNewChat
}) => {
  return (
    <Header
      conversations={conversations}
      onConversationChange={onConversationChange}
      currentConversation={currentConversation}
      onNewChat={onNewChat}
    >
      {children}
    </Header>
  );
};

export default DashboardLayout;