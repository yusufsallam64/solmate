import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { MessageSquare, Bell, Wallet2 } from 'lucide-react';
import SignInModal from '@/lib/components/landing/SignInModal';
import Logo from '@/lib/components/Logo';

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
    <div className="min-h-screen bg-background-950 overflow-hidden">
      {/* Hero Background */}
      <div className="fixed inset-0 z-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" className="w-full h-full">
          <defs>
            <linearGradient id="horizonGlow" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
            </linearGradient>
            <radialGradient id="sphereGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
            </radialGradient>
            <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="#6366f1" fillOpacity="0.2"/>
            </pattern>
          </defs>
          <rect width="1200" height="800" fill="url(#grid)" opacity="0.3"/>
          <path d="M0 400 Q 600 300 1200 400 Q 600 100 0 400" fill="url(#horizonGlow)" opacity="0.5"/>
          <circle cx="900" cy="300" r="200" fill="url(#sphereGradient)" filter="blur(30px)"/>
          <g opacity="0.2">
            {Array.from({length: 10}).map((_, i) => (
              <path 
                key={i}
                d={`M0 ${450 + i * 20} Q 600 ${350 + i * 15} 1200 ${450 + i * 20}`} 
                stroke="#6366f1" 
                strokeWidth="1" 
                fill="none"
              />
            ))}
          </g>
        </svg>
      </div>

      {/* Header */}
      <header className={`fixed w-full z-30 transition-all duration-300 ${scrolled ? 'backdrop-blur-xl bg-background-950/80 border-b border-primary-200/30' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Logo size={40} />
              <span className="text-2xl font-bold bg-gradient-to-r from-accent-400 via-accent-500 to-secondary-300 text-transparent bg-clip-text font-title">
                SolanaChat
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSignInModalOpen(true)}
                className="px-6 py-2 text-primary-100 border border-primary-200/30 rounded-xl hover:bg-accent-500/10 hover:border-accent-500/30 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all duration-300"
              >
                Sign In
              </button>
              <button
                onClick={handleGetStarted}
                className="px-6 py-2 bg-accent-500 text-white rounded-xl hover:bg-accent-600 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-300"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight relative">
                Your AI-Powered
                <span className="block bg-gradient-to-r from-accent-400 via-accent-500 to-secondary-300 text-transparent bg-clip-text">
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
                  className="px-8 py-3 bg-accent-500 text-white rounded-xl hover:bg-accent-600 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-300 text-lg font-medium"
                >
                  Start Trading
                </button>
                <button className="px-8 py-3 border border-primary-200/30 text-primary-100 rounded-xl hover:bg-accent-500/10 hover:border-accent-500/30 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all duration-300 text-lg font-medium">
                  Watch Demo
                </button>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-accent-500/5 rounded-2xl filter blur-3xl" />
              <div className="relative bg-background-900/40 backdrop-blur-xl border border-primary-200/30 rounded-2xl p-6 space-y-6 shadow-lg">
                {[
                  { icon: MessageSquare, text: '"Sell 500 SOL when it hits $120"' },
                  { icon: Bell, text: '"Alert me if ETH drops below $2000"' },
                  { icon: Wallet2, text: '"What\'s my current portfolio value?"' }
                ].map((item, i) => (
                  <div key={i} className="group relative">
                    <div className="absolute inset-0 bg-accent-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 filter blur-lg" />
                    <div className="relative flex items-center gap-4 text-primary-100">
                      <div className="p-2 rounded-lg bg-accent-500/10 text-accent-400 group-hover:text-accent-300 transition-colors duration-200">
                        <item.icon className="w-6 h-6" />
                      </div>
                      <span className="text-lg">{item.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-20 px-6 z-10">
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
            <div 
              key={i} 
              className="relative p-6 rounded-xl bg-background-900/40 backdrop-blur-xl border border-primary-200/30 hover:border-accent-500/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all duration-300 group"
            >
              <div className="p-2 rounded-lg bg-accent-500/10 text-accent-400 group-hover:text-accent-300 transition-colors duration-200 w-fit">
                <feature.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-primary-100 mt-4 mb-2">{feature.title}</h3>
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