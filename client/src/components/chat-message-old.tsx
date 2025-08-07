import { Button } from "@/components/ui/button";
import { MessageSquare, ThumbsUp, ThumbsDown, Copy, User, Bot, Edit } from "lucide-react";
import { type Message } from "@shared/schema";
import { TypingIndicator } from "@/components/ui/typing-indicator";
import { useToast } from "@/hooks/use-toast";
import { MessageEditor } from "./message-editor";
import { MessageReactions } from "./message-reactions";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  message?: Message;
  isTyping?: boolean;
  showTimestamp?: boolean;
  onEdit?: (messageId: string, newContent: string) => void;
}

export function ChatMessage({ message, isTyping, showTimestamp = true, onEdit }: ChatMessageProps) {
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
        <div className="max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-3xl">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-green-400">Gemini AI</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div className="bg-green-600/90 backdrop-blur-sm text-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg border border-green-500/20 group">
                <TypingIndicator />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!message) return null;

  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-6 animate-in fade-in-0 slide-in-from-bottom-2 group`}>
      <div className="max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-3xl">
        <div className="flex items-start space-x-3">
          {!isUser && (
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="h-4 w-4 text-white" />
            </div>
          )}
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className={`text-sm font-medium ${isUser ? "text-blue-400" : "text-green-400"}`}>
                {isUser ? "You" : "Gemini AI"}
              </span>
              {message.isEdited && (
                <span className="text-xs text-gray-500">(edited)</span>
              )}
              {showTimestamp && (
                <span className="text-xs text-gray-500">
                  {formatTime(message.timestamp)}
                </span>
              )}
            </div>
            
            <div className={`${
              isUser 
                ? "bg-blue-600/90 backdrop-blur-sm" 
                : "bg-green-600/90 backdrop-blur-sm"
            } text-white rounded-2xl ${
              isUser ? "rounded-tr-sm" : "rounded-tl-sm"
            } px-4 py-3 shadow-lg border ${
              isUser ? "border-blue-500/20" : "border-green-500/20"
            } relative group`}>
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-md !bg-gray-800 !border border-gray-600"
                          {...props}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ) : (
                        <code className="bg-gray-700 px-1 py-0.5 rounded text-sm" {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>

              {/* Message actions */}
              <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-6 w-6 p-0 text-gray-300 hover:text-white"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                
                {isUser && onEdit && (
                  <MessageEditor
                    messageId={message.id}
                    content={message.content}
                    conversationId={message.conversationId}
                    onEdit={(newContent) => onEdit(message.id, newContent)}
                  />
                )}
              </div>
            </div>

            {/* Reactions and additional info */}
            <div className="flex items-center justify-between mt-2">
              <MessageReactions
                messageId={message.id}
                conversationId={message.conversationId}
                reactions={message.reactions}
                isBookmarked={message.isBookmarked}
                role={message.role}
              />
              
              {!isUser && (message.tokens || message.responseTime) && (
                <div className="text-xs text-gray-500">
                  {message.responseTime && `${message.responseTime}ms`}
                  {message.tokens && ` • ${message.tokens} tokens`}
                </div>
              )}
            </div>
          </div>
          
          {isUser && (
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <User className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

  if (message.role === "user") {
    return (
      <div className="flex justify-end mb-6 animate-in fade-in-0 slide-in-from-bottom-2">
        <div className="max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-2xl">
          <div className="flex items-start space-x-3 justify-end">
            <div className="flex-1 text-right">
              <div className="flex items-center justify-end space-x-2 mb-2">
                <span className="text-sm font-medium text-blue-400">You</span>
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              </div>
              <div className="bg-blue-600/90 backdrop-blur-sm text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-lg border border-blue-500/20 inline-block text-left">
                <div className="text-sm sm:text-base prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code: ({ node, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const isInline = !match;
                        return !isInline && match ? (
                          <SyntaxHighlighter
                            style={oneDark as any}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{ margin: '0.5rem 0', borderRadius: '0.375rem' }}
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="bg-blue-700/50 px-1 py-0.5 rounded text-xs" {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 mt-1">
                <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
              </div>
            </div>
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <User className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6 animate-in fade-in-0 slide-in-from-bottom-2">
      <div className="max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-3xl">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-green-400">Gemini AI</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <div className="bg-green-600/90 backdrop-blur-sm text-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg border border-green-500/20">
              <div className="text-sm sm:text-base prose prose-invert prose-sm max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code: ({ node, className, children, ...props }: any) => {
                      const match = /language-(\w+)/.exec(className || '');
                      const isInline = !match;
                      return !isInline && match ? (
                        <SyntaxHighlighter
                          style={oneDark as any}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{ margin: '0.5rem 0', borderRadius: '0.375rem' }}
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className="bg-green-700/50 px-1 py-0.5 rounded text-xs" {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
              <div className="flex items-center space-x-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-1 hover:bg-gray-700/50 rounded text-gray-400 hover:text-white transition-colors"
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-1 hover:bg-gray-700/50 rounded text-gray-400 hover:text-white transition-colors"
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-1 hover:bg-gray-700/50 rounded text-gray-400 hover:text-white transition-colors"
                  onClick={handleCopy}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
