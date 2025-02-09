import { FormEvent, useState } from "react";
import { ArrowUp, Brain } from "lucide-react";

interface MessageInputProps {
  message: string;
  setMessage: (message: string) => void;
  error: string;
  isLoading: boolean;
  onSubmit: (e: FormEvent, isGuruMode?: boolean) => Promise<void>;
}

const MessageInput = ({
  message,
  setMessage,
  error,
  isLoading,
  onSubmit,
}: MessageInputProps) => {
  const [isGuruMode, setIsGuruMode] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    await onSubmit(e, undefined, isGuruMode);
};

  return (
    <div>
      <form onSubmit={handleSubmit} className="px-4 pb-4">
        <div className="relative">
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask a question..."
              className="w-full py-4 pl-14 pr-12 rounded-2xl shadow-lg border border-primary-200/30 
                       bg-primary/30 text-text-50 text-base placeholder:text-text-100/40
                       disabled:placeholder:text-primary-100/5 resize-none outline-hidden
                       focus:border-accent/30 min-h-[3rem] max-h-48
                       transition-all duration-300 leading-relaxed
                       disabled:cursor-not-allowed"
              disabled={isLoading}
              rows={1}
              style={{ height: "auto" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${target.scrollHeight}px`;
              }}
            />
            
            {/* Brain Button with Custom Tooltip */}
            <div className="absolute left-3 top-3.5">
              <button
                type="button"
                onClick={() => setIsGuruMode(!isGuruMode)}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className={`p-2 rounded-full transition-all duration-300 
                ${
                  isGuruMode
                    ? "bg-accent-500 text-white"
                    : "hover:bg-primary/50 text-text-50"
                }`}
                disabled={isLoading}
              >
                <Brain className="w-5 h-5" />
              </button>
              
              {/* Custom Tooltip */}
              <div
                className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 
                text-sm text-white bg-gray-800 rounded shadow-lg whitespace-nowrap
                transition-opacity duration-200 pointer-events-none z-50
                ${showTooltip ? 'opacity-100' : 'opacity-0'}`}
              >
                GURU MODE
                {/* Tooltip Arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                  <div className="border-4 border-transparent border-t-gray-800" />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div
              className={`absolute right-3 top-3.5 transition-all duration-500 ease-out
                         ${
                           message.trim()
                             ? "scale-100 opacity-100"
                             : "scale-50 opacity-0"
                         }`}
            >
              <button
                type="submit"
                disabled={isLoading || !message.trim()}
                className={`p-2 rounded-full flex items-center justify-center transition-all duration-300 
                         ${
                           isLoading || !message.trim()
                             ? "bg-accent/20 cursor-not-allowed text-primary-300/50"
                             : "bg-accent-500 hover:bg-accent-600 hover:scale-110 active:scale-95"
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
            <div
              className="absolute -top-5 left-0 text-xs text-red-400 bg-primary/80 
                          px-3 py-1 rounded-md border border-red-500/20"
            >
              {error}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default MessageInput;