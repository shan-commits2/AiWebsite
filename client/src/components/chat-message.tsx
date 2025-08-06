import { Button } from "@/components/ui/button";
import { MessageSquare, ThumbsUp, ThumbsDown, Copy } from "lucide-react";
import { type Message } from "@shared/schema";
import { TypingIndicator } from "@/components/ui/typing-indicator";
import { useToast } from "@/hooks/use-toast";

interface ChatMessageProps {
  message?: Message;
  isTyping?: boolean;
}

export function ChatMessage({ message, isTyping }: ChatMessageProps) {
  const { toast } = useToast();

  const handleCopy = async () => {
    if (message?.content) {
      try {
        await navigator.clipboard.writeText(message.content);
        toast({
          description: "Message copied to clipboard",
        });
      } catch (error) {
        toast({
          description: "Failed to copy message",
          variant: "destructive",
        });
      }
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isTyping) {
    return (
      <div className="flex justify-start mb-6 animate-in fade-in-0 slide-in-from-bottom-2">
        <div className="max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-2xl">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <MessageSquare className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-medium text-green-400">Gemini AI</span>
          </div>
          <div className="bg-green-600 text-white rounded-2xl rounded-bl-sm px-4 py-3">
            <TypingIndicator />
          </div>
        </div>
      </div>
    );
  }

  if (!message) return null;

  if (message.role === "user") {
    return (
      <div className="flex justify-end mb-6 animate-in fade-in-0 slide-in-from-bottom-2">
        <div className="max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl">
          <div className="bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-3">
            <p className="text-sm sm:text-base whitespace-pre-wrap">{message.content}</p>
          </div>
          <div className="flex items-center justify-end space-x-2 mt-1">
            <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6 animate-in fade-in-0 slide-in-from-bottom-2">
      <div className="max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-2xl">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
            <MessageSquare className="h-3 w-3 text-white" />
          </div>
          <span className="text-sm font-medium text-green-400">Gemini AI</span>
        </div>
        <div className="bg-green-600 text-white rounded-2xl rounded-bl-sm px-4 py-3">
          <p className="text-sm sm:text-base whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="flex items-center space-x-2 mt-1">
          <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 hover:bg-gray-750 rounded text-gray-400 hover:text-white transition-colors"
            >
              <ThumbsUp className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 hover:bg-gray-750 rounded text-gray-400 hover:text-white transition-colors"
            >
              <ThumbsDown className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 hover:bg-gray-750 rounded text-gray-400 hover:text-white transition-colors"
              onClick={handleCopy}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
