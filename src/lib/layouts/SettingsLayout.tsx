import React from 'react';
import { User, CreditCard, LogOut, LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut, useSession } from 'next-auth/react';
import UserAvatar from '@/lib/components/header/UserAvatar';
import UserDropdown from '@/lib/components/header/UserDropdown';
import Logo from '@/lib/components/Logo';

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
    { href: '/settings/alias', label: 'Aliases', icon: LinkIcon },
  ];

  return (
    <div className="min-h-screen bg-background-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-background-950/95 backdrop-blur-xl border-b border-primary-200/30 px-4 flex items-center justify-between z-10">
        <div className="flex items-center">
          <div className="px-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xl font-title hover:opacity-80 transition-all duration-200 flex items-center gap-3"
            >
              <Logo size={32} />
              <span className="hidden sm:inline font-bold bg-gradient-to-r from-accent-400 via-accent-500 to-secondary-300 text-transparent bg-clip-text">
                SolMate
              </span>
            </button>
          </div>
          <div className="flex flex-row gap-6">
            <div className="h-6 w-px bg-accent-500/20" />
            <h2 className="text-lg font-semibold text-primary-100">Settings</h2>
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

      {/* Main Content */}
      <div className="pt-24 px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-8">
            {/* Sidebar */}
            <div className="col-span-12 md:col-span-3">
              <div className="bg-background-900/40 backdrop-blur-xl border border-primary-200/30 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.1)] overflow-hidden">
                <nav className="p-2 space-y-1">
                  {navItems.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                    >
                      <div
                        className={`group flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                          currentPath === href
                            ? 'bg-accent-500/10 text-accent-400 border border-accent-500/30'
                            : 'text-primary-100 hover:bg-accent-500/10 hover:text-accent-400 hover:border hover:border-accent-500/20'
                        }`}
                      >
                        <Icon size={18} className="transition-colors duration-200" />
                        <span>{label}</span>
                      </div>
                    </Link>
                  ))}
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-red-400 hover:bg-red-500/10 hover:border hover:border-red-500/20 group"
                  >
                    <LogOut size={18} className="transition-colors duration-200" />
                    <span>Sign Out</span>
                  </button>
                </nav>
              </div>
            </div>

            {/* Content Area */}
            <div className="col-span-12 md:col-span-9">
              <div className="bg-background-900/40 backdrop-blur-xl border border-primary-200/30 rounded-xl p-6 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;