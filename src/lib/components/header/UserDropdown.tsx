import React, { useRef, useEffect } from 'react';
import { Settings, LogOut, MessageSquare } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/router';

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ isOpen, onClose }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSignOut = async () => {
    try {
      await signOut({
        redirect: false,
        callbackUrl: '/'
      });
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      window.location.href = '/';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-background-950/10 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={dropdownRef}
        className="absolute right-0 top-14 w-48 z-40 animate-in fade-in slide-in-from-top-2 duration-200"
      >
        {/* Glow effect */}
        <div className="absolute -inset-0.5 bg-accent-500/20 opacity-0 group-hover:opacity-100 rounded-xl blur transition duration-300" />
        
        {/* Dropdown content */}
        <div className="relative rounded-xl bg-background-900/40 backdrop-blur-xl border border-primary-200/30 shadow-[0_0_20px_rgba(99,102,241,0.15)] overflow-hidden">
          <div className="py-1">
            <button
              className="w-full px-4 py-2.5 text-left text-primary-100 hover:bg-accent-500/10 flex items-center gap-2.5 transition-all duration-200 group"
              onClick={() => {router.push('/dashboard'); onClose();}}
            >
              <MessageSquare size={16} className="text-accent-400 group-hover:text-accent-300 transition-colors duration-200" />
              <span>Back to Chat</span>
            </button>
            
            <div className="h-px bg-primary-200/30 my-1" />

            <button
              className="w-full px-4 py-2.5 text-left text-primary-100 hover:bg-accent-500/10 flex items-center gap-2.5 transition-all duration-200 group"
              onClick={() => {router.push('/settings/profile'); onClose();}}
            >
              <Settings size={16} className="text-accent-400 group-hover:text-accent-300 transition-colors duration-200" />
              <span>Settings</span>
            </button>
            <button
              className="w-full px-4 py-2.5 text-left text-primary-100 hover:bg-accent-500/10 flex items-center gap-2.5 transition-all duration-200 group"
              onClick={handleSignOut}
            >
              <LogOut size={16} className="text-accent-400 group-hover:text-accent-300 transition-colors duration-200" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserDropdown;