import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Save, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MessageEditorProps {
  messageId: string;
  content: string;
  conversationId: string;
  onEdit: (newContent: string) => void;
}

export function MessageEditor({ messageId, content, conversationId, onEdit }: MessageEditorProps) {
  const [open, setOpen] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const editMutation = useMutation({
    mutationFn: async (newContent: string) => {
      const response = await apiRequest("PATCH", `/api/messages/${messageId}`, {
        content: newContent,
        isEdited: true
      });
      return response.json();
    },
    onSuccess: () => {
      onEdit(editContent);
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations", conversationId, "messages"]
      });
      setOpen(false);
      toast({
        description: "Message updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update message",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    if (editContent.trim() === content.trim()) {
      setOpen(false);
      return;
    }
    editMutation.mutate(editContent.trim());
  };

  const handleCancel = () => {
    setEditContent(content);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-gray-300 hover:text-white"
          onClick={() => setEditContent(content)}
        >
          <Edit className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Message</DialogTitle>
          <DialogDescription className="text-gray-400">
            Make changes to your message. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[100px] bg-gray-700 border-gray-600 text-white"
            placeholder="Edit your message..."
          />
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={editMutation.isPending || !editContent.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {editMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}