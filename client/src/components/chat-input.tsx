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
    <div className="bg-gray-800 border-t border-gray-700 p-4">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                  "min-h-[48px] max-h-32 bg-gray-700 text-white rounded-xl border-gray-600",
                  "focus:border-blue-500 focus:outline-none resize-none pr-20",
                  "placeholder:text-gray-400"
                )}
                style={{ height: 'auto' }}
              />
              
              <div className="absolute right-3 bottom-3 flex items-center space-x-1">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  className="p-1 hover:bg-gray-600 text-gray-400 hover:text-white transition-colors"
                  disabled={disabled}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  className="p-1 hover:bg-gray-600 text-gray-400 hover:text-white transition-colors"
                  disabled={disabled}
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              disabled={disabled || !message.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
        
        <div className="flex items-center justify-center mt-3">
          <p className="text-xs text-gray-500">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
