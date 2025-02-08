import React, { useEffect, useRef, useState } from 'react';
import { getProviders } from "next-auth/react";
import Link from 'next/link';
import { X } from 'lucide-react';
import AuthProviderBlock from "@/lib/components/auth/AuthProviderBlock";
import PhantomConnect from '../phantom/PhantomConnect';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose }) => {
  const [providers, setProviders] = useState<any>({});
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadProviders = async () => {
      const providers = await getProviders();
      setProviders(providers ?? {});
    };
    
    if (isOpen) {
      loadProviders();
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 " />
      
      <div className="flex items-center justify-center min-h-screen p-4">
        <div 
          ref={modalRef}
          className="bg-primary-900 border border-accent/20 rounded-lg shadow-lg w-full max-w-md relative animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 rounded-lg hover:bg-accent/10 transition-colors duration-200 text-primary-200"
          >
            <X size={20} />
          </button>

          <div className="p-6">
            <div className="flex flex-col items-center space-y-6">
              <h2 className="text-2xl font-semibold text-secondary-500">Welcome Back</h2>
              <p className="text-primary-200 text-center">
                Sign in to your account to continue
               </p>

              <div className="w-full space-y-3">
                <PhantomConnect />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInModal;