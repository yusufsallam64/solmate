import React, { useState } from 'react';
import { MessageSquare, Plus, Wallet } from 'lucide-react';
import { useRouter } from 'next/router';
import { Conversation } from '@/lib/db/types';
import { formatDistanceToNow } from 'date-fns';

interface SidebarProps {
  isOpen: boolean;
  conversations: Conversation[];
  currentConversation?: Conversation;
  onConversationSelect?: (conversationId: string) => void;
  onNewChat: () => void;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  conversations,
  currentConversation,
  onConversationSelect,
  onNewChat,
  setIsOpen
}) => {
  const router = useRouter();
  const conversationCount = 8;
  const [displayCount, setDisplayCount] = useState(conversationCount);

  const handleConversationClick = (conversationId: string) => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setIsOpen(false);
    }
    if (onConversationSelect) {
      onConversationSelect(conversationId);
    }
  };

  return (
    <div className={`md:static top-16 bg-background-900/30 backdrop-blur-xl border-r border-primary-200/30 shadow-lg transition-all duration-300 h-[calc(100vh-4rem)] ${isOpen ? 'w-full md:w-72' : 'w-0 overflow-hidden'}`}>
      <div className="h-full flex flex-col min-w-[18rem]">
        <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-primary-200/30 bg-gradient-to-r from-background-900/50 to-background-950/50">
          <h2 className="text-lg font-title text-secondary-500">Transactions</h2>
          <button
            onClick={onNewChat}
            className="p-2 rounded-lg bg-accent-500/10 hover:bg-accent-500/20 transition-all duration-200 text-accent-400 hover:text-accent-300 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:border hover:border-accent-500/30"
            title="New Transaction"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-primary-200/30 scrollbar-track-transparent">
          {conversations.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-6 text-center p-8">
              <div className="relative">
                <Wallet size={64} className="text-accent-400 opacity-50" />
                <div className="absolute inset-0 bg-primary-200/30 blur-xl animate-pulse-slow" />
              </div>
              <div>
                <h2 className="text-2xl font-title text-accent-400 mb-2">No transactions yet</h2>
                <p className="text-primary-300 mb-4">Start your first transaction</p>
                <button
                  onClick={onNewChat}
                  className="px-4 py-2 rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-all duration-200 font-medium shadow-md hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                >
                  New Transaction
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              {conversations.slice(0, displayCount).map((conversation) => (
                <button
                  key={conversation._id.toString()}
                  onClick={() => handleConversationClick(conversation._id.toString())}
                  className={`group w-full p-4 text-left rounded-xl backdrop-blur-sm transition-all duration-300 border
                    ${currentConversation?._id.toString() === conversation._id.toString()
                      ? 'bg-accent-500/10 border-accent-500/20 hover:border-accent-500/30 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                      : 'bg-background-950/50 border-secondary-500/20 hover:border-secondary-500/30 hover:shadow-[0_0_15px_rgba(148,163,184,0.2)] hover:bg-background-900/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-accent-500/10 text-accent-400 group-hover:text-accent-300 transition-colors duration-200">
                      <MessageSquare size={14} />
                    </div>
                    <span className="text-text-50 group-hover:text-primary-50 truncate font-medium">
                      {conversation.title}
                    </span>
                  </div>
                </button>
              ))}
              
              {conversations.length > displayCount && (
                <button
                  onClick={() => setDisplayCount(prev => prev + conversationCount)}
                  className="w-full py-2 text-center text-sm text-accent-400 hover:text-accent-300 transition-all duration-200 rounded-lg bg-background-950/50 hover:bg-accent-500/20 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] border border-secondary-500/20 hover:border-accent-500/30"
                >
                  Show More
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;