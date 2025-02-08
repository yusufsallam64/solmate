import React from 'react';
import { Camera, MessageSquare } from 'lucide-react';

interface ViewToggleButtonProps {
   view: 'chat' | 'capture';
   onToggle: () => void;
}


const ViewToggleButton: React.FC<ViewToggleButtonProps> = ({ view, onToggle }) => {
   return (
      <button
         onClick={onToggle}
         className="h-10 w-10 rounded-full bg-accent/10 hover:bg-accent/20 transition-colors duration-200 flex items-center justify-center md:hidden"
         title={view === 'chat' ? 'Switch to Screen Capture' : 'Switch to Chat'}
      >
         {view === 'chat' ? (
            <Camera size={20} className="text-accent" />
         ) : (
            <MessageSquare size={20} className="text-accent" />
         )}
      </button>
   );
};

export default ViewToggleButton;