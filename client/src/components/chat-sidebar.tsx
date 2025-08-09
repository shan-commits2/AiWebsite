import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, Settings, User, MoreHorizontal, Menu, Brain } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { type Conversation, GEMINI_MODELS, type GeminiModel } from "@shared/schema";
import { ModelSelector } from "@/components/model-selector";
import { cn } from "@/lib/utils";

// Import Settings modal
import { Settings as SettingsModal } from "./Settings";

interface ChatSidebarProps {
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
  onToggle: () => void;
  selectedModel: GeminiModel;
  onModelChange: (model: GeminiModel) => void;
}

export function ChatSidebar({ 
  selectedConversationId, 
  onSelectConversation, 
  onNewChat,
  isOpen,
  onToggle,
  selectedModel,
  onModelChange
}: ChatSidebarProps) {
  const queryClient = useQueryClient();

  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/conversations", {
        title: "New Conversation",
        model: selectedModel
      });
      return response.json();
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      onSelectConversation(newConversation.id);
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      await apiRequest("DELETE", `/api/conversations/${conversationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const handleNewChat = () => {
    createConversationMutation.mutate();
    onNewChat();
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <>
      {/* Settings Modal */}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Mobile header */}
      <div className="md:hidden bg-gray-800/95 backdrop-blur-sm border-b border-gray-700/50 p-4 flex items-center justify-between shadow-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="p-2 hover:bg-gray-700/70 rounded-lg transition-all duration-200"
        >
          <Menu className="h-5 w-5 text-gray-300" />
        </Button>
        <h1 className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
          Gemini Chat
        </h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewChat}
          className="p-2 hover:bg-gray-700/70 rounded-lg transition-all duration-200"
          disabled={createConversationMutation.isPending}
        >
          <Plus className="h-5 w-5 text-gray-300" />
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "bg-gray-800/95 backdrop-blur-sm border-r border-gray-700/50 flex flex-col transition-all duration-300 shadow-xl",
        "md:flex md:w-72",
        isOpen ? "flex" : "hidden"
      )}>
        {/* Desktop Header */}
        <div className="hidden md:block p-6 border-b border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                Gemini Chat
              </h1>
              <p className="text-xs text-gray-400">Powered by Google AI</p>
            </div>
          </div>
        </div>
        
        {/* New Chat Button & Model Selector */}
        <div className="p-4 space-y-3">
          <Button 
            onClick={handleNewChat}
            disabled={createConversationMutation.isPending}
            className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white border-none justify-start shadow-lg hover:shadow-xl transition-all duration-[...]
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-3" />
            <span className="font-medium">New Chat</span>
          </Button>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">AI Model</span>
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={onModelChange}
              disabled={createConversationMutation.isPending}
            />
          </div>
        </div>
        
        {/* Conversations List */}
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1">
            {isLoading ? (
              <div className="p-3 text-sm text-gray-400">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="p-3 text-sm text-gray-400">No conversations yet</div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "p-3 hover:bg-gray-700/50 rounded-xl cursor-pointer transition-all duration-200 group hover:shadow-md transform hover:scale-[1.01]",
                    selectedConversationId === conversation.id && "bg-gradient-to-r from-blue-600/20 to-green-600/20 border border-blue-500/30"
                  )}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate transition-colors",
                        selectedConversationId === conversation.id ? "text-blue-300" : "text-gray-200"
                      )}>
                        {conversation.title}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-400 flex items-center space-x-1">
                          <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                          <span>{formatTimeAgo(conversation.updatedAt)}</span>
                        </p>
                        <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded-md">
                          {GEMINI_MODELS[conversation.model as GeminiModel]?.name.split(' ')[1] || 'Flash'}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-red-500/20 hover:text-red-400 rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversationMutation.mutate(conversation.id);
                      }}
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        {/* User Profile */}
        <div className="p-4 border-t border-gray-700/50 bg-gray-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-200">Anonymous User</p>
              <p className="text-xs text-gray-400 flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Online</span>
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
