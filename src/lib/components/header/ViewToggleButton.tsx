import React from 'react';
import { Camera, Layout, MessageSquare } from 'lucide-react';

interface ViewToggleButtonProps {
   view: 'chat' | 'voice';
   onToggle: () => void;
}
 
const ViewToggleButton: React.FC<ViewToggleButtonProps> = ({ view, onToggle }) => {
   return (
      <button
         onClick={onToggle}
         className="p-2 rounded-lg hover:bg-accent/10 transition-colors duration-200 text-primary-200 hover:text-primary-100 flex items-center gap-2"
         title={view === 'chat' ? 'Switch to Voice View' : 'Switch to Chat'}
      >
         {view === 'chat' ? (
         <>
            <MessageSquare size={18} />
            <span className="text-sm">Chat View</span>
         </>
         ) : (
         <>
            <Layout size={18} />
            <span className="text-sm">Voice View</span>
         </>
         )}
      </button>
);
};

export default ViewToggleButton;