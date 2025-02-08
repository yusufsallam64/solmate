import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import UserDropdown from './UserDropdown';
import UserAvatar from './UserAvatar';
import Sidebar from './Sidebar';
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
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 h-16 bg-primary-900 border-b border-accent/10 px-4 flex items-center justify-between z-10">
        <div className="flex items-center">
          <div className="px-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-xl font-bold bg-linear-to-r from-accent-400 via-accent-500 to-secondary-500 text-transparent bg-clip-text hover:opacity-80 transition-opacity duration-200 justify-center items-center flex gap-2"
            >
              <img src="/logo-dark.png" alt="Logo" className="h-8 w-auto" />
              <span className="hidden sm:inline">Your App Name</span>
            </button>
          </div>
          <div className="flex flex-row gap-6">
          <div className="flex flex-row gap-6">
            <div className="h-6 w-px bg-accent/10" />
            {currentConversation && (
              <h2 className="text-lg font-semibold text-primary-100 truncate max-w-[300px]">
                {currentConversation.title}
              </h2>
            )}
          </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <UserAvatar session={session} onClick={handleUserAvatarClick} />
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
        <main className="flex-1 transition-all duration-300 ease-in-out overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Header;
