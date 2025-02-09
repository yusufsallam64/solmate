import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
  // Generate unique IDs for the gradients to avoid conflicts when using multiple instances
  const gradientStrokeId = React.useId();
  const gradientPathId = React.useId();
  const gradientDotId = React.useId();

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
    >
      {/* Outer circle representing the Solana ecosystem */}
      <circle 
        cx="16" 
        cy="16" 
        r="15" 
        fill="none" 
        stroke={`url(#${gradientStrokeId})`} 
        strokeWidth="2"
      />
      
      {/* Stylized chat bubble */}
      <path 
        d="M8 10 L8 22 L12 22 L16 26 L16 22 L24 22 L24 10 Z" 
        fill="none" 
        stroke={`url(#${gradientPathId})`} 
        strokeWidth="2" 
        strokeLinejoin="round"
      />
      
      {/* Central dot representing connection */}
      <circle 
        cx="16" 
        cy="16" 
        r="2" 
        fill={`url(#${gradientDotId})`}
      />
      
      {/* Gradient definitions */}
      <defs>
        <linearGradient id={gradientStrokeId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1"/>
          <stop offset="100%" stopColor="#64748b"/>
        </linearGradient>
        
        <linearGradient id={gradientPathId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1"/>
          <stop offset="50%" stopColor="#818cf8"/>
          <stop offset="100%" stopColor="#64748b"/>
        </linearGradient>
        
        <linearGradient id={gradientDotId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1"/>
          <stop offset="100%" stopColor="#818cf8"/>
        </linearGradient>
      </defs>
    </svg>
  );
};

export default Logo;