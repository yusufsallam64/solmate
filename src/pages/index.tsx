import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Command, MessageSquare, Bell, Wallet2 } from 'lucide-react';
import SignInModal from '@/lib/components/landing/SignInModal';

export default function Splash() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGetStarted = () => {
    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/auth/signup');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background-950 via-background-900 to-accent-950">
      {/* Header */}
      <header className={`fixed w-full z-30 transition-all duration-300 ${scrolled ? 'backdrop-blur bg-background-950/80 border-b border-accent-500/10' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Command className="w-8 h-8 text-accent-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-accent-400 to-accent-500 text-transparent bg-clip-text font-title">
                CryptoChat AI
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSignInModalOpen(true)}
                className="px-6 py-2 text-accent-400 border border-accent-500/20 rounded-lg hover:bg-accent-500/10 transition-all duration-300"
              >
                Sign In
              </button>
              <button
                onClick={handleGetStarted}
                className="px-6 py-2 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-lg hover:opacity-90 transition-all duration-300"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                Your AI-Powered
                <span className="block bg-gradient-to-r from-accent-400 to-accent-500 text-transparent bg-clip-text">
                  Crypto Assistant
                </span>
              </h1>
              <p className="text-xl text-text-300">
                Trade crypto, set alerts, and manage your portfolio through natural conversations. 
                Let AI handle the complexity while you focus on strategy.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleGetStarted}
                  className="px-8 py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-lg hover:opacity-90 transition-all duration-300 text-lg font-medium"
                >
                  Start Trading
                </button>
                <button className="px-8 py-3 border border-accent-500/20 text-accent-400 rounded-lg hover:bg-accent-500/10 transition-all duration-300 text-lg font-medium">
                  Watch Demo
                </button>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-accent-500/20 to-secondary-500/20 rounded-2xl blur-3xl" />
              <div className="relative bg-background-900/50 backdrop-blur border border-accent-500/10 rounded-2xl p-6 space-y-6">
                <div className="flex items-center gap-4 text-text-200">
                  <MessageSquare className="w-6 h-6 text-accent-400" />
                  <span className="text-lg">"Sell 500 SOL when it hits $120"</span>
                </div>
                <div className="flex items-center gap-4 text-text-200">
                  <Bell className="w-6 h-6 text-accent-400" />
                  <span className="text-lg">"Alert me if ETH drops below $2000"</span>
                </div>
                <div className="flex items-center gap-4 text-text-200">
                  <Wallet2 className="w-6 h-6 text-accent-400" />
                  <span className="text-lg">"What's my current portfolio value?"</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="py-20 px-6 bg-background-950/50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Natural Language Trading",
              description: "Execute trades using simple conversational commands",
              icon: MessageSquare,
            },
            {
              title: "Smart Alerts",
              description: "Set price alerts and automated trading rules effortlessly",
              icon: Bell,
            },
            {
              title: "Portfolio Management",
              description: "Track and manage your crypto assets through chat",
              icon: Wallet2,
            },
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-xl bg-background-900/50 border border-accent-500/10 hover:border-accent-500/30 transition-all duration-300">
              <feature.icon className="w-12 h-12 text-accent-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-text-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
    </div>
  );
}