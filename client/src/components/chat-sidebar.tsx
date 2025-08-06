import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, Settings, User, MoreHorizontal, Menu } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { type Conversation } from "@shared/schema";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function ChatSidebar({ 
  selectedConversationId, 
  onSelectConversation, 
  onNewChat,
  isOpen,
  onToggle 
}: ChatSidebarProps) {
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/conversations", {
        title: "New Conversation"
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
      {/* Mobile header */}
      <div className="md:hidden bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="p-2 hover:bg-gray-700"
        >
          <Menu className="h-5 w-5 text-gray-400" />
        </Button>
        <h1 className="text-lg font-semibold">Gemini Chat</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewChat}
          className="p-2 hover:bg-gray-700"
          disabled={createConversationMutation.isPending}
        >
          <Plus className="h-5 w-5 text-gray-400" />
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-300",
        "md:flex md:w-64",
        isOpen ? "flex" : "hidden"
      )}>
        {/* Desktop Header */}
        <div className="hidden md:block p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold">Gemini Chat</h1>
          </div>
        </div>
        
        {/* New Chat Button */}
        <div className="p-4">
          <Button 
            onClick={handleNewChat}
            disabled={createConversationMutation.isPending}
            className="w-full bg-gray-750 hover:bg-gray-600 text-white border-gray-600 justify-start"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
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
                    "p-3 hover:bg-gray-750 rounded-lg cursor-pointer transition-colors duration-150 group",
                    selectedConversationId === conversation.id && "bg-gray-700"
                  )}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">
                        {conversation.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTimeAgo(conversation.updatedAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversationMutation.mutate(conversation.id);
                      }}
                    >
                      <MoreHorizontal className="h-3 w-3 text-gray-400" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        {/* User Profile */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">User</p>
              <p className="text-xs text-gray-400">Free Plan</p>
            </div>
            <Button variant="ghost" size="sm" className="p-1 hover:bg-gray-750">
              <Settings className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
