import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import UserDropdown from './UserDropdown';
import UserAvatar from './UserAvatar';
import Sidebar from './Sidebar';
import Logo from '../Logo';
import type { Conversation } from '@/lib/db/types';

interface HeaderProps {
  children: React.ReactNode;
  conversations: Conversation[];
  onConversationChange: (conversationId: string) => void;
  currentConversation?: Conversation;
  onNewChat: () => void;
}

const Header: React.FC<HeaderProps> = ({
  children,
  conversations,
  onConversationChange,
  currentConversation,
  onNewChat
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  const handleUserAvatarClick = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-background-950">
      <header className="fixed top-0 left-0 right-0 h-16 bg-background-950/95 backdrop-blur-xl border-b border-primary-200/30 px-4 flex items-center justify-between z-10">
        <div className="flex items-center">
          <div className="px-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-xl font-title hover:opacity-80 transition-all duration-200 flex items-center gap-3"
            >
              <Logo size={32} />
              <span className="hidden sm:inline font-bold bg-gradient-to-r from-accent-400 via-accent-500 to-secondary-300 text-transparent bg-clip-text">
                SolanaChat
              </span>
            </button>
          </div>
          <div className="flex flex-row gap-6">
            <div className="h-6 w-px bg-accent-500/20" />
            {currentConversation && (
              <h2 className="text-lg font-semibold text-primary-100 truncate max-w-[300px]">
                {currentConversation.title}
              </h2>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <UserAvatar
              session={session}
              onClick={handleUserAvatarClick}
            />
            <UserDropdown
              isOpen={isDropdownOpen}
              onClose={() => setIsDropdownOpen(false)}
            />
          </div>
        </div>
      </header>
      <div className="flex pt-16 min-h-screen md:flex">
        <Sidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          conversations={conversations}
          currentConversation={currentConversation}
          onConversationSelect={onConversationChange}
          onNewChat={onNewChat}
        />
        <main className="flex-1 transition-all duration-300 ease-in-out overflow-x-hidden bg-gradient-to-b from-background-950 to-background-900">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Header;