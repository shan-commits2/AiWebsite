import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Code, Share } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { type Message } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ExportDialogProps {
  conversationId: string;
  conversationTitle: string;
}

type ExportFormat = "txt" | "md" | "json" | "html";

export function ExportDialog({ conversationId, conversationTitle }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("md");
  const { toast } = useToast();

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/conversations", conversationId, "messages"],
    enabled: open && !!conversationId,
  });

  const exportFormats = [
    { value: "txt", label: "Plain Text (.txt)", icon: FileText },
    { value: "md", label: "Markdown (.md)", icon: FileText },
    { value: "json", label: "JSON (.json)", icon: Code },
    { value: "html", label: "HTML (.html)", icon: Code },
  ];

  const formatMessage = (message: Message, format: ExportFormat): string => {
    const timestamp = new Date(message.timestamp).toLocaleString();
    const sender = message.role === "user" ? "You" : "Gemini AI";
    
    switch (format) {
      case "txt":
        return `[${timestamp}] ${sender}: ${message.content}\n\n`;
      
      case "md":
        return `## ${sender}\n*${timestamp}*\n\n${message.content}\n\n---\n\n`;
      
      case "html":
        return `
          <div class="message ${message.role}">
            <div class="sender">${sender}</div>
            <div class="timestamp">${timestamp}</div>
            <div class="content">${message.content.replace(/\n/g, '<br>')}</div>
          </div>
        `;
      
      case "json":
        return JSON.stringify(message, null, 2);
      
      default:
        return message.content;
    }
  };

  const generateExport = (): string => {
    const title = conversationTitle || "Conversation Export";
    const exportDate = new Date().toLocaleString();
    
    switch (format) {
      case "txt":
        return `${title}\nExported: ${exportDate}\n\n${"=".repeat(50)}\n\n${messages.map(msg => formatMessage(msg, format)).join("")}`;
      
      case "md":
        return `# ${title}\n\n**Exported:** ${exportDate}\n\n${messages.map(msg => formatMessage(msg, format)).join("")}`;
      
      case "html":
        return `
<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #1a1a1a; color: #fff; }
        .header { text-align: center; margin-bottom: 30px; }
        .message { margin: 20px 0; padding: 15px; border-radius: 8px; }
        .message.user { background: #1e40af; margin-left: 20%; }
        .message.assistant { background: #059669; margin-right: 20%; }
        .sender { font-weight: bold; margin-bottom: 5px; }
        .timestamp { font-size: 0.8em; opacity: 0.7; margin-bottom: 10px; }
        .content { line-height: 1.5; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
        <p>Exported: ${exportDate}</p>
    </div>
    ${messages.map(msg => formatMessage(msg, format)).join("")}
</body>
</html>`;
      
      case "json":
        return JSON.stringify({
          title,
          exportDate,
          conversationId,
          messageCount: messages.length,
          messages
        }, null, 2);
      
      default:
        return "";
    }
  };

  const handleExport = () => {
    const content = generateExport();
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `${conversationTitle || "conversation"}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setOpen(false);
    toast({
      title: "Export successful",
      description: `Conversation exported as ${format.toUpperCase()} file`
    });
  };

  const handleShare = async () => {
    const content = generateExport();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: conversationTitle,
          text: content
        });
        toast({
          title: "Shared successfully",
          description: "Conversation has been shared"
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied to clipboard",
        description: "Conversation content copied to clipboard"
      });
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-xs bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 text-gray-300"
        >
          <Download className="h-3 w-3 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center space-x-2">
            <Download className="h-5 w-5 text-blue-400" />
            <span>Export Conversation</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Download or share your conversation in various formats
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Export Format
            </label>
            <Select value={format} onValueChange={(value: ExportFormat) => setFormat(value)}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {exportFormats.map((fmt) => {
                  const Icon = fmt.icon;
                  return (
                    <SelectItem key={fmt.value} value={fmt.value}>
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span>{fmt.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-gray-400">
            <strong>{messages.length}</strong> messages will be exported
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={handleExport}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
            >
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}