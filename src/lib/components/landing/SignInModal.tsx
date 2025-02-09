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
      <div className="absolute inset-0 bg-background-950/60 backdrop-blur-sm" />
      
      {/* Ambient Light Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent-500/10 rounded-full filter blur-[100px] opacity-30" />
      </div>

      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          ref={modalRef}
          className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Background blur and border effect */}
          <div className="absolute inset-0 bg-background-900/40 backdrop-blur-xl rounded-2xl border border-primary-200/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]" />

          {/* Content */}
          <div className="relative p-8">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 rounded-lg text-primary-200 hover:bg-accent-500/10 hover:text-accent-400 transition-all duration-200"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center space-y-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-accent-400 to-accent-500 text-transparent bg-clip-text">
                Welcome Back
              </h2>
              <p className="text-primary-100/80 text-center">
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
