import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Paperclip, Upload, X, FileText, Image, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileUploaded: (fileUrl: string, fileName: string, fileType: string) => void;
}

export function FileUpload({ onFileUploaded }: FileUploadProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const supportedTypes = {
    image: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
    text: ['txt', 'md', 'json', 'csv'],
    code: ['js', 'ts', 'py', 'html', 'css', 'java', 'cpp', 'c'],
    document: ['pdf']
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-5 w-5 text-blue-400" />;
    if (fileType.includes('text') || fileType.includes('json')) return <FileText className="h-5 w-5 text-green-400" />;
    if (supportedTypes.code.some(ext => fileType.includes(ext))) return <Code className="h-5 w-5 text-purple-400" />;
    return <FileText className="h-5 w-5 text-gray-400" />;
  };

  const isFileSupported = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return Object.values(supportedTypes).flat().includes(extension || '');
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    if (!isFileSupported(file)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload an image, text file, or code file.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please upload files smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      onFileUploaded(result.url, file.name, file.type);
      setOpen(false);
      
      toast({
        title: "File uploaded successfully",
        description: `${file.name} is ready for analysis`
      });
      
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-gray-400 hover:text-gray-300 hover:bg-gray-700/50"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center space-x-2">
            <Upload className="h-5 w-5 text-blue-400" />
            <span>Upload File</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Upload images, text files, or code for AI analysis
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {uploading ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-white font-medium">Uploading...</div>
                <div className="text-sm text-gray-400">Please wait</div>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver 
                  ? "border-blue-500 bg-blue-500/10" 
                  : "border-gray-600 hover:border-gray-500"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <div className="text-white font-medium">
                  Drop files here or click to browse
                </div>
                <div className="text-sm text-gray-400">
                  Supports images, text files, and code (max 10MB)
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                >
                  Choose File
                </Button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            accept=".png,.jpg,.jpeg,.gif,.webp,.txt,.md,.json,.csv,.js,.ts,.py,.html,.css,.java,.cpp,.c,.pdf"
          />

          <div className="mt-4 text-xs text-gray-500">
            <div className="font-medium mb-2">Supported formats:</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-blue-400">Images:</span> PNG, JPG, GIF, WebP
              </div>
              <div>
                <span className="text-green-400">Text:</span> TXT, MD, JSON, CSV
              </div>
              <div>
                <span className="text-purple-400">Code:</span> JS, TS, PY, HTML, CSS
              </div>
              <div>
                <span className="text-red-400">Documents:</span> PDF
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}