import React, { useState } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
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
    <div className={`md:static top-16 bg-primary-900 border-r border-accent/10 transition-all duration-300 h-[calc(100vh-4rem)] ${isOpen ? 'w-full md:w-64' : 'w-0 overflow-hidden'}`}>
      <div className="h-full flex flex-col min-w-[16rem]">
        <div className="flex-none flex items-center justify-between p-4 border-b border-accent/10">
          <h2 className="text-lg font-semibold text-primary-100">Conversations</h2>
          <button
            onClick={onNewChat}
            className="p-2 rounded-lg hover:bg-accent/10 transition-colors duration-200 text-accent"
            title="New Chat"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {conversations.length === 0 ? (
            <div className="text-center p-4 text-primary-200">
              <p>No conversations yet</p>
              <button
                onClick={onNewChat}
                className="mt-2 text-sm text-accent hover:text-accent-500 transition-colors duration-200"
              >
                Start a new chat
              </button>
            </div>
          ) : (
            <>
              {conversations.slice(0, displayCount).map((conversation) => (
                <button
                  key={conversation._id.toString()}
                  onClick={() => handleConversationClick(conversation._id.toString())}
                  className={`w-full p-3 text-left rounded-lg transition-colors duration-200 group
                    ${currentConversation?._id.toString() === conversation._id.toString()
                      ? 'bg-accent/20 hover:bg-accent/25'
                      : 'hover:bg-accent/10'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare size={16} className="text-accent" />
                      <span className="text-primary-100 group-hover:text-primary-200 truncate">
                        {conversation.title}
                      </span>
                    </div>
                    <span className="text-xs text-primary-300">
                      {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                    </span>
                  </div>
                  {conversation.messageCount > 0 && (
                    <div className="mt-1 text-xs text-primary-300">
                      {conversation.messageCount} message{conversation.messageCount !== 1 ? 's' : ''}
                    </div>
                  )}
                </button>
              ))}
              
              {conversations.length > displayCount && (
                <button
                  onClick={() => setDisplayCount(prev => prev + conversationCount)}
                  className="w-full mt-2 py-1 text-center text-sm text-accent hover:text-accent/80 transition-colors duration-200"
                >
                  Show More
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;