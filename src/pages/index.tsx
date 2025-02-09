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
    <div className="min-h-screen w-screen bg-background-950 overflow-x-hidden">
      {/* Hero Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          preserveAspectRatio="xMidYMid slice"
          viewBox="0 0 1200 800" 
          className="w-full h-full scale-150"
        >
          <defs>
            <linearGradient id="horizonGlow" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5"/>
              <stop offset="40%" stopColor="#6366f1" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="horizonAccent" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4"/>
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
            </linearGradient>
            <radialGradient id="sphereGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3"/>
              <stop offset="70%" stopColor="#6366f1" stopOpacity="0.1"/>
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
            </radialGradient>
            <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="#6366f1" fillOpacity="0.2"/>
            </pattern>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Background grid */}
          <rect width="1200" height="800" fill="url(#grid)" opacity="0.2"/>
          
          {/* Glowing horizon base */}
          <path 
            d="M-200 500 Q 300 380 600 350 T 1400 500 L 1400 900 L -200 900 Z" 
            fill="url(#horizonGlow)" 
            opacity="0.7"
          />
          
          {/* Secondary horizon glow */}
          <path 
            d="M-200 520 Q 300 400 600 370 T 1400 520" 
            stroke="url(#horizonAccent)" 
            strokeWidth="4" 
            fill="none" 
            filter="url(#glow)"
          />
          
          {/* Luminous spheres */}
          <circle cx="900" cy="300" r="200" fill="url(#sphereGradient)" filter="blur(40px)"/>
          <circle cx="300" cy="250" r="150" fill="url(#sphereGradient)" filter="blur(30px)" opacity="0.7"/>
          
          {/* Dynamic lines */}
          <g opacity="0.3" filter="url(#glow)">
            {Array.from({length: 15}).map((_, i) => (
              <path 
                key={i}
                d={`M-200 ${480 + i * 18} Q ${300 + i * 20} ${400 + i * 10} ${600 + i * 15} ${380 + i * 12} T 1400 ${480 + i * 18}`}
                stroke={i % 3 === 0 ? "#10b981" : i % 2 === 0 ? "#8b5cf6" : "#6366f1"}
                strokeWidth={2 - (i * 0.1)} 
                fill="none"
                opacity={1 - (i * 0.05)}
              />
            ))}
          </g>
          
          {/* Accent lines */}
          <g opacity="0.4">
            <path 
              d="M-200 460 Q 300 340 600 310 T 1400 460" 
              stroke="#8b5cf6" 
              strokeWidth="2" 
              fill="none" 
              filter="url(#glow)"
            />
            <path 
              d="M-200 440 Q 300 320 600 290 T 1400 440" 
              stroke="#6366f1" 
              strokeWidth="1.5" 
              fill="none" 
              filter="url(#glow)"
            />
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
                SolMate
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
                className="px-6 py-2 bg-accent-600 text-white rounded-xl hover:bg-accent-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-300"
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
              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight relative drop-shadow-2xl [text-shadow:_0_1px_15px_rgb(255_255_255_/_20%)]">
                Your AI-Powered
                <span className="block bg-gradient-to-r from-accent-400 via-accent-500 to-secondary-300 text-transparent bg-clip-text [text-shadow:_0_1px_20px_rgb(99_102_241_/_30%)]">
                  Crypto Assistant
                </span>
              </h1>
              <p className="text-xl text-text-300 drop-shadow-lg [text-shadow:_0_1px_10px_rgb(255_255_255_/_10%)]">
                Trade crypto, set alerts, and manage your portfolio through natural conversations. 
                Let Agentic AI handle the complexity while you focus on strategy.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                <button
                  onClick={handleGetStarted}
                  className="px-8 py-3 bg-accent-600 text-white rounded-xl hover:bg-accent-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-300 text-lg font-medium"
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