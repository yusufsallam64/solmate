import React, { useState } from 'react';
import { Session } from 'next-auth';
import clsx from 'clsx';

interface UserAvatarProps {
  session: Session | null;
  onClick?: (() => void | undefined);
  size?: number;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ session, onClick, size }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const renderFallbackAvatar = () => (
    <div className="h-8 w-8 rounded-full bg-accent-500/20 flex items-center justify-center text-accent-400 font-medium backdrop-blur-sm">
      {session?.user?.name?.[0]?.toUpperCase() ?? 'U'}
    </div>
  );

  return (
    <button
      onClick={onClick ?? (() => {})}
      className={clsx(
        "relative group h-10 w-10 rounded-full transition-all duration-300",
        "border border-primary-200/30 backdrop-blur-sm",
        onClick && [
          'cursor-pointer hover:border-accent-500/30',
          'hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]',
        ]
      )}
      style={{ transform: `scale(${size ? size : 1})` }}
      title={session?.user?.name || 'User'}
    >
      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-full bg-accent-500/0 group-hover:bg-accent-500/10 transition-colors duration-300" />
      
      {/* Avatar content */}
      <div className="relative h-full w-full rounded-full bg-background-900/40 flex items-center justify-center overflow-hidden">
        {session?.user?.image && !imageError ? (
          <img
            src={session.user.image}
            alt={session.user.name || 'User'}
            className="h-8 w-8 rounded-full"
            onError={handleImageError}
          />
        ) : renderFallbackAvatar()}
      </div>
    </button>
  );
};

export default UserAvatar;