import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Bookmark, BookmarkCheck } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MessageReactionsProps {
  messageId: string;
  conversationId: string;
  reactions?: {
    likes: number;
    dislikes: number;
  };
  isBookmarked?: boolean;
  role: "user" | "assistant";
}

export function MessageReactions({ 
  messageId, 
  conversationId, 
  reactions = { likes: 0, dislikes: 0 }, 
  isBookmarked = false,
  role
}: MessageReactionsProps) {
  const [localLikes, setLocalLikes] = useState(reactions.likes);
  const [localDislikes, setLocalDislikes] = useState(reactions.dislikes);
  const [localBookmarked, setLocalBookmarked] = useState(isBookmarked);
  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const reactionMutation = useMutation({
    mutationFn: async (type: 'like' | 'dislike' | 'bookmark') => {
      let updates: any = {};
      
      if (type === 'like') {
        if (userReaction === 'like') {
          // Remove like
          updates.reactions = { likes: localLikes - 1, dislikes: localDislikes };
          setLocalLikes(prev => prev - 1);
          setUserReaction(null);
        } else {
          // Add like, remove dislike if present
          const newLikes = localLikes + 1;
          const newDislikes = userReaction === 'dislike' ? localDislikes - 1 : localDislikes;
          updates.reactions = { likes: newLikes, dislikes: newDislikes };
          setLocalLikes(newLikes);
          setLocalDislikes(newDislikes);
          setUserReaction('like');
        }
      } else if (type === 'dislike') {
        if (userReaction === 'dislike') {
          // Remove dislike
          updates.reactions = { likes: localLikes, dislikes: localDislikes - 1 };
          setLocalDislikes(prev => prev - 1);
          setUserReaction(null);
        } else {
          // Add dislike, remove like if present
          const newLikes = userReaction === 'like' ? localLikes - 1 : localLikes;
          const newDislikes = localDislikes + 1;
          updates.reactions = { likes: newLikes, dislikes: newDislikes };
          setLocalLikes(newLikes);
          setLocalDislikes(newDislikes);
          setUserReaction('dislike');
        }
      } else if (type === 'bookmark') {
        updates.isBookmarked = !localBookmarked;
        setLocalBookmarked(!localBookmarked);
      }

      const response = await apiRequest("PATCH", `/api/messages/${messageId}`, updates);
      return response.json();
    },
    onError: (error, type) => {
      // Revert optimistic updates
      if (type === 'like') {
        setLocalLikes(reactions.likes);
        setUserReaction(null);
      } else if (type === 'dislike') {
        setLocalDislikes(reactions.dislikes);
        setUserReaction(null);
      } else if (type === 'bookmark') {
        setLocalBookmarked(isBookmarked);
      }
      
      toast({
        title: "Error",
        description: "Failed to update reaction",
        variant: "destructive"
      });
    }
  });

  // Only show reactions for AI messages
  if (role === 'user') {
    return (
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => reactionMutation.mutate('bookmark')}
          className={cn(
            "h-6 px-2 text-xs",
            localBookmarked 
              ? "text-yellow-400 hover:text-yellow-300" 
              : "text-gray-500 hover:text-gray-400"
          )}
          disabled={reactionMutation.isPending}
        >
          {localBookmarked ? (
            <BookmarkCheck className="h-3 w-3" />
          ) : (
            <Bookmark className="h-3 w-3" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => reactionMutation.mutate('like')}
        className={cn(
          "h-6 px-2 text-xs",
          userReaction === 'like' 
            ? "text-green-400 hover:text-green-300" 
            : "text-gray-500 hover:text-gray-400"
        )}
        disabled={reactionMutation.isPending}
      >
        <ThumbsUp className="h-3 w-3 mr-1" />
        {localLikes}
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => reactionMutation.mutate('dislike')}
        className={cn(
          "h-6 px-2 text-xs",
          userReaction === 'dislike' 
            ? "text-red-400 hover:text-red-300" 
            : "text-gray-500 hover:text-gray-400"
        )}
        disabled={reactionMutation.isPending}
      >
        <ThumbsDown className="h-3 w-3 mr-1" />
        {localDislikes}
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => reactionMutation.mutate('bookmark')}
        className={cn(
          "h-6 px-2 text-xs",
          localBookmarked 
            ? "text-yellow-400 hover:text-yellow-300" 
            : "text-gray-500 hover:text-gray-400"
        )}
        disabled={reactionMutation.isPending}
      >
        {localBookmarked ? (
          <BookmarkCheck className="h-3 w-3" />
        ) : (
          <Bookmark className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}