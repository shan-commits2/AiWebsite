import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageSquare, Settings as SettingsIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { type Message, type GeminiModel, type Theme, type Conversation } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import Settings from "@/components/Settings";

export default function Chat() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<GeminiModel>("gemini-1.5-flash");
  const [selectedTheme, setSelectedTheme] = useState<Theme>("dark-gray");
  const [showSettings, setShowSettings] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Load user settings
  const { data: userSettings } = useQuery({
    queryKey: ["/api/settings"],
  });

  // Load current conversation
  const { data: conversation } = useQuery<Conversation>({
    queryKey: ["/api/conversations", selectedConversationId],
    enabled: !!selectedConversationId,
  });

  // Update theme when user settings change
  useEffect(() => {
    if (userSettings?.theme) {
      setSelectedTheme(userSettings.theme as Theme);
    }
  }, [userSettings]);

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
    onMutate: async ({ conversationId, content }) => {
      await queryClient.cancelQueries({ 
        queryKey: ["/api/conversations", conversationId, "messages"] 
      });

      const previousMessages = queryClient.getQueryData(["/api/conversations", conversationId, "messages"]);

      const tempUserMessage = {
        id: `temp-${Date.now()}`,
        conversationId,
        role: "user" as const,
        content,
        timestamp: new Date(),
      };

      queryClient.setQueryData(["/api/conversations", conversationId, "messages"], (old: any[]) => 
        old ? [...old, tempUserMessage] : [tempUserMessage]
      );

      setTimeout(() => setIsTyping(true), 100);

      return { previousMessages };
    },
    onError: (err, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ["/api/conversations", variables.conversationId, "messages"], 
          context.previousMessages
        );
      }
      
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      console.error("Send message error:", err);
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
    <div className="flex h-screen bg-gray-900 text-white relative">
      <ChatSidebar
        selectedConversationId={selectedConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            {!selectedConversationId ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl animate-pulse">
                  <MessageSquare className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                  Welcome to GemiFlow
                </h2>
                <p className="text-gray-400 text-lg mb-8">Start a conversation and experience the power of Google AI</p>
                <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-500">
                  <div className="flex items-center space-x-2 bg-gray-800/50 px-3 py-2 rounded-lg">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Code assistance</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-800/50 px-3 py-2 rounded-lg">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Creative writing</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-800/50 px-3 py-2 rounded-lg">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Problem solving</span>
                  </div>
                </div>
              </div>
            ) : (
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

        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={sendMessageMutation.isPending}
          placeholder={selectedConversationId ? "Type your message..." : "Start a new conversation to begin chatting..."}
        />

        {/* Settings button floating in bottom right corner */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
          className="fixed bottom-4 right-4 z-50 rounded-full p-3 shadow-lg"
          aria-label="Toggle Settings"
        >
          <SettingsIcon className="w-6 h-6" />
        </Button>

        {/* Settings Overlay */}
        {showSettings && (
          <div className="fixed inset-0 z-40 bg-black bg-opacity-70 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-full overflow-auto p-6 relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4"
                aria-label="Close Settings"
              >
                ✕
              </Button>

              {/* Your Settings component controls Analytics, ModelComparison, ThemeSelector, etc */}
              <Settings
                selectedTheme={selectedTheme}
                onThemeChange={setSelectedTheme}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                userSettings={userSettings}
                setUserSettings={(newSettings) => {
                  // implement saving settings if needed
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
