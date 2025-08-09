import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { ThemeSelector } from "@/components/theme-selector";
import { ExportDialog } from "@/components/export-dialog";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { FileUpload } from "@/components/file-upload";
import { VoiceInput } from "@/components/voice-input";
import { ModelComparison } from "@/components/model-comparison";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageSquare, Settings, Sparkles, BarChart2, UploadCloud, Mic, Layers } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { type Message, type GeminiModel, type Theme, type Conversation } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsPanel } from "@/components/Settings";

export default function Chat() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<GeminiModel>("gemini-1.5-flash");
  const [selectedTheme, setSelectedTheme] = useState<Theme>("dark-gray");
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");

  // Panels visibility states
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [showModelComparison, setShowModelComparison] = useState(false);
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

  // Panel toggle handler to close others when one opens (optional)
  const togglePanel = (panel: string) => {
    setShowAnalytics(panel === "analytics" ? !showAnalytics : false);
    setShowFileUpload(panel === "fileupload" ? !showFileUpload : false);
    setShowVoiceInput(panel === "voiceinput" ? !showVoiceInput : false);
    setShowModelComparison(panel === "modelcomparison" ? !showModelComparison : false);
    setShowSettings(panel === "settings" ? !showSettings : false);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <ChatSidebar
        selectedConversationId={selectedConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />

      {/* Main Chat + Panels container */}
      <div className="flex-1 flex flex-col relative">

        {/* Top bar with toggles for extra features */}
        <div className="flex items-center justify-end gap-3 p-2 border-b border-gray-700 bg-gray-800">
          <Button variant="ghost" size="sm" onClick={() => togglePanel("analytics")} title="Analytics Dashboard">
            <BarChart2 className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => togglePanel("fileupload")} title="File Upload">
            <UploadCloud className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => togglePanel("voiceinput")} title="Voice Input">
            <Mic className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => togglePanel("modelcomparison")} title="Model Comparison">
            <Layers className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => togglePanel("settings")} title="Settings">
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Chat Messages Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="h-full">
              <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
                {!selectedConversationId ? (
                  // Welcome message
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
            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={sendMessageMutation.isPending}
              placeholder={selectedConversationId ? "Type your message..." : "Start a new conversation to begin chatting..."}
            />
          </div>

          {/* Panels Area (side drawer / overlay) */}
          <div className="w-96 bg-gray-800 border-l border-gray-700 overflow-auto">
            {showAnalytics && <AnalyticsDashboard />}
            {showFileUpload && <FileUpload />}
            {showVoiceInput && <VoiceInput />}
            {showModelComparison && <ModelComparison selectedModel={selectedModel} onModelChange={setSelectedModel} />}
            {showSettings && (
              <SettingsPanel
                selectedTheme={selectedTheme}
                onThemeChange={setSelectedTheme}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                onClose={() => setShowSettings(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
