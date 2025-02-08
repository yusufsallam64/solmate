import React from 'react';
import { ScreenShare } from 'lucide-react';

interface CaptureButtonProps {
  onClick: () => void;
  className?: string;
}

const CaptureButton: React.FC<CaptureButtonProps> = ({ onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-full flex items-center justify-center transition-all duration-300 
                 bg-accent-500 hover:bg-accent-600 hover:scale-110 active:scale-95
                 text-white shadow-md ${className}`}
    >
      <ScreenShare className="w-5 h-5" strokeWidth={2} />
    </button>
  );
};

export default CaptureButton;