import React from 'react';
import { User, CreditCard, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut, useSession } from 'next-auth/react';
import UserAvatar from '@/lib/components/header/UserAvatar';
import UserDropdown from '@/lib/components/header/UserDropdown';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({ children }) => {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const { data: session } = useSession();
  const currentPath = router.pathname;

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

  const navItems = [
    { href: '/settings/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-950 to-background-950">
      <header className="fixed top-0 left-0 right-0 h-16 bg-primary-900 border-b border-accent/10 px-4 flex items-center justify-between z-10">
        <div className="flex items-center">
          <div className="px-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xl font-bold bg-linear-to-r from-accent-400 via-accent-500 to-secondary-500 text-transparent bg-clip-text hover:opacity-80 transition-opacity duration-200 justify-center items-center flex gap-2"
            >
              <img src="/logo-dark.png" alt="Logo" className="h-8 w-auto" />
              <span className="hidden sm:inline">SolanaBot</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <UserAvatar
            session={session}
            onClick={() => setIsDropdownOpen(prev => !prev)}
          />
          <UserDropdown
            isOpen={isDropdownOpen}
            onClose={() => setIsDropdownOpen(false)}
          />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 mt-9">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="col-span-12 md:col-span-3">
            <div className="bg-background-800/40 backdrop-blur-lg rounded-2xl p-4">
              <nav className="space-y-2">
                {navItems.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-200 ${currentPath === href
                      ? 'bg-accent/20 text-accent-400'
                      : 'text-primary-100 hover:bg-accent/10'
                      }`}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </Link>
                ))}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-200 bg-red-500/10 text-red-500 hover:bg-red-500/20"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-12 md:col-span-9">
            <div className="bg-background-800/40 backdrop-blur-lg rounded-2xl p-4">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;