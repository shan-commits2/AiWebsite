import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { type Message } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Chat() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/conversations", selectedConversationId, "messages"],
    enabled: !!selectedConversationId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const response = await apiRequest("POST", `/api/conversations/${conversationId}/messages`, {
        role: "user",
        content,
      });
      return response.json();
    },
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations", selectedConversationId, "messages"] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations"] 
      });
      
      if (data.error) {
        toast({
          title: "AI Response Error",
          description: data.error,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      console.error("Send message error:", error);
    },
    onSettled: () => {
      setIsTyping(false);
    },
  });

  const handleSendMessage = (content: string) => {
    if (!selectedConversationId) {
      toast({
        title: "No Conversation",
        description: "Please start a new conversation first.",
        variant: "destructive",
      });
      return;
    }
    sendMessageMutation.mutate({ conversationId: selectedConversationId, content });
  };

  const handleNewChat = () => {
    setSelectedConversationId(undefined);
    setSidebarOpen(false);
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setSidebarOpen(false);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <ChatSidebar
        selectedConversationId={selectedConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
              {!selectedConversationId ? (
                // Welcome message
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-2">Welcome to Gemini Chat</h2>
                  <p className="text-gray-400">Start a conversation and experience the power of AI</p>
                </div>
              ) : (
                // Messages
                <div className="space-y-6">
                  {isLoading ? (
                    <div className="text-center py-8 text-gray-400">
                      Loading conversation...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      Start the conversation by sending a message
                    </div>
                  ) : (
                    messages.map((message) => (
                      <ChatMessage key={message.id} message={message} />
                    ))
                  )}
                  
                  {isTyping && <ChatMessage isTyping />}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={sendMessageMutation.isPending}
          placeholder={selectedConversationId ? "Type your message..." : "Start a new conversation to begin chatting..."}
        />
      </div>
    </div>
  );
}
