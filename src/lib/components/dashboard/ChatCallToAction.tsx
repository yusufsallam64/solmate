import React from 'react';
import { Plus, MessageSquare } from 'lucide-react';
import Logo from '../Logo';

const ChatCallToAction = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center space-y-8 text-center p-8">
      <div className="relative">
        <Logo size={72} className="text-accent-400 opacity-50" />
        <div className="absolute inset-0 bg-primary-200/30 blur-xl animate-pulse-slow" />
      </div>
      
      <div className="space-y-6 max-w-lg">
        <div>
          <h2 className="text-2xl font-title text-accent-400 mb-3 font-bold">Welcome to SolMate</h2>
          <p className="text-primary-200 text-lg">Experience a new way to interact with Solana</p>
        </div>
        
        <div className="grid grid-cols-1 gap-4 mt-6">
          <div className="group p-4 rounded-xl border border-accent-500/20 bg-accent-500/5 hover:bg-accent-500/10 hover:border-accent-500/30 transition-all duration-300">
            <div className="flex items-center gap-3 text-accent-400 group-hover:text-accent-300">
              <MessageSquare size={20} />
              <span className="font-medium">Start chatting to interact with your wallet</span>
            </div>
          </div>
          
          <div className="group p-4 rounded-xl border border-secondary-500/20 bg-secondary-500/5 hover:bg-secondary-500/10 hover:border-secondary-500/30 transition-all duration-300">
            <div className="flex items-center gap-3 text-secondary-400 group-hover:text-secondary-300">
              <Plus size={20} />
              <span className="font-medium">Type your message below to begin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatCallToAction;