import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Smile } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSendMessage, disabled, placeholder = "Type your message..." }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  return (
    <div className="bg-gray-800/95 backdrop-blur-sm border-t border-gray-700/50 p-4 shadow-2xl">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end space-x-4">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                  "min-h-[52px] max-h-32 bg-gray-700/90 backdrop-blur-sm text-white rounded-2xl border-gray-600/50",
                  "focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none pr-24 shadow-lg",
                  "placeholder:text-gray-400 transition-all duration-200",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                style={{ height: 'auto' }}
              />
              
              <div className="absolute right-3 bottom-3 flex items-center space-x-1">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  className="p-2 hover:bg-gray-600/50 text-gray-400 hover:text-white transition-all duration-200 rounded-lg"
                  disabled={disabled}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  className="p-2 hover:bg-gray-600/50 text-gray-400 hover:text-white transition-all duration-200 rounded-lg"
                  disabled={disabled}
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              disabled={disabled || !message.trim()}
              className={cn(
                "bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white p-3 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              )}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
        
        <div className="flex items-center justify-center mt-4">
          <p className="text-xs text-gray-500 flex items-center space-x-2">
            <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
            <span>AI can make mistakes. Verify important information.</span>
            <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
          </p>
        </div>
      </div>
    </div>
  );
}
