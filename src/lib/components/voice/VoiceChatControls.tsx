import React from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceChatControlsProps {
  isListening: boolean;
  onToggleListening: () => void;
  disabled?: boolean;
}

const VoiceChatControls: React.FC<VoiceChatControlsProps> = ({
  isListening,
  onToggleListening,
  disabled = false,
}) => {
  return (
    <button
      onClick={onToggleListening}
      disabled={disabled}
      className={`p-2 rounded-lg transition-colors ${
        isListening
          ? 'bg-accent-500 text-white hover:bg-accent-600'
          : 'bg-primary-800 text-primary-200 hover:bg-primary-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isListening ? 'Stop listening' : 'Start listening'}
    >
      {isListening ? <MicOff size={20} /> : <Mic size={20} />}
    </button>
  );
};

export default VoiceChatControls;