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
    <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-medium">
      {session?.user?.name?.[0]?.toUpperCase() ?? 'U'}
    </div>
  );

  return (
    <button
      onClick={onClick ?? (() => {})}
      className={
        clsx(
          "h-10 w-10 rounded-full bg-accent/10 transition-colors duration-200 flex items-center justify-center",
          onClick ? 'cursor-pointer hover:bg-accent/20' : 'cursor-default'
        )
      }
        
      style={{ transform: `scale(${size ? size : 1})` }}
      title={session?.user?.name || 'User'}
    >
      {session?.user?.image && !imageError ? (
        <img 
          src={session.user.image} 
          alt={session.user.name || 'User'} 
          className="h-8 w-8 rounded-full"
          onError={handleImageError}
        />
      ) : renderFallbackAvatar()}
    </button>
  );
};

export default UserAvatar;