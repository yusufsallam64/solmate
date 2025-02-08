import { useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import SignInModal from '@/lib/components/landing/SignInModal';

import { motion } from 'framer-motion';

export default function Splash() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  const handleGetStarted = () => {
    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/auth/signup');
    }
  }

  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory bg-linear-180 from-secondary-950 to-accent-900">
      {/* Simplified Header */}
      <header className="fixed w-5/6 left-1/2 -translate-x-1/2 mt-4 rounded-xl px-6 py-4 z-30 backdrop-blur-md bg-accent-900/10 border border-accent-500/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src="/logo-dark.png" alt="Logo" className="h-8 w-auto" />
            <h1 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-accent-400 to-accent-500 text-transparent bg-clip-text font-title">
                Solana Bot
              </span>
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSignInModalOpen(true)}
              className="py-2 px-6 text-blue-100 transition-all duration-300 border border-blue-400/20 rounded-lg hover:bg-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 font-medium"
            >
              Sign In
            </button>
            <button
              onClick={handleGetStarted}
              className="py-2 px-6 text-white bg-blue-500 rounded-lg transition-all duration-300 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 font-medium"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
    </div>
  );
}