import { FormEvent } from 'react';
import { ArrowUp, Wand2 } from 'lucide-react';

interface MessageInputProps {
  message: string;
  setMessage: (message: string) => void;
  error: string;
  isLoading: boolean;
  onSubmit: (e: FormEvent) => Promise<void>;
  onGuidance?: () => Promise<void>;
  isScreenSharing?: boolean;
}

 const MessageInput = ({ 
  message, 
  setMessage, 
  error, 
  isLoading, 
  onSubmit,
  onGuidance,
  isScreenSharing = false
}: MessageInputProps) => {
  return (
    <div>
      <form onSubmit={onSubmit} className="px-4 pb-4">
        <div className="relative">
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e);
                }
              }}
              placeholder="Ask a question..."
              className="w-full py-4 pl-16 pr-16 rounded-2xl shadow-lg border border-accent/20 
                       bg-primary/30 text-primary-100 text-base placeholder:text-primary-300/50
                       disabled:placeholder:text-primary-300/20 resize-none outline-hidden
                       focus:border-accent/30 min-h-[4rem] max-h-48
                       transition-all duration-300 leading-relaxed
                       disabled:cursor-not-allowed"
              disabled={isLoading}
              rows={1}
              style={{ height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
            />
            {/* Guidance Button */}
            <button
              type="button"
              disabled={!isScreenSharing}
              onClick={onGuidance}
              className={`absolute left-3 top-3.5 p-2 rounded-full transition-all duration-300
                       ${!isScreenSharing
                         ? 'bg-accent/20 cursor-not-allowed text-primary-300/50'
                         : 'bg-accent-500 hover:bg-accent-600 hover:scale-110 active:scale-95'
                       } text-white shadow-md`}
            >
              <Wand2 className="w-5 h-5" />
            </button>
            {/* Submit Button */}
            <div className={`absolute right-3 top-3.5 transition-all duration-500 ease-out
                         ${message.trim() ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
              <button
                type="submit"
                disabled={isLoading || !message.trim()}
                className={`p-2 rounded-full flex items-center justify-center transition-all duration-300 
                         ${isLoading || !message.trim()
                           ? 'bg-accent/20 cursor-not-allowed text-primary-300/50'
                           : 'bg-accent-500 hover:bg-accent-600 hover:scale-110 active:scale-95'
                         } text-white shadow-md`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowUp className="w-5 h-5" strokeWidth={3} />
                )}
              </button>
            </div>
          </div>
          {error && (
            <div className="absolute -top-5 left-0 text-xs text-red-400 bg-primary/80 
                          px-3 py-1 rounded-md border border-red-500/20">
              {error}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default MessageInput;