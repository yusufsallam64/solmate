import React, { useRef, useEffect } from 'react';
import { Settings, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/router';

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  stopScreenShare?: () => void;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ isOpen, onClose, stopScreenShare }) => {
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

  if (!isOpen) return null;

  const handleSignOut = async () => {
    try {
      stopScreenShare?.();
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

  return (
    <>
      <div 
        className="fixed inset-0 z-30"
        onClick={onClose}
      />
      <div 
        ref={dropdownRef}
        className="absolute right-0 top-14 w-48 rounded-lg bg-primary-900 border border-accent/20 shadow-lg overflow-hidden z-40"
      >
        <div className="py-1">
          <button 
            className="w-full px-4 py-2 text-left text-primary-100 hover:bg-accent/10 flex items-center gap-2 transition-colors duration-200"
            onClick={() => {router.push('/settings/profile'); onClose(); stopScreenShare?.();}}
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
          <button 
            className="w-full px-4 py-2 text-left text-primary-100 hover:bg-accent/10 flex items-center gap-2 transition-colors duration-200"
            onClick={handleSignOut}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default UserDropdown;