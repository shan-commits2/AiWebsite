import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Settings, Zap, Brain, Cpu } from "lucide-react";
import { GEMINI_MODELS, type GeminiModel } from "@shared/schema";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  selectedModel: GeminiModel;
  onModelChange: (model: GeminiModel) => void;
  disabled?: boolean;
}

export function ModelSelector({ selectedModel, onModelChange, disabled }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [tempModel, setTempModel] = useState<GeminiModel>(selectedModel);

  const handleConfirm = () => {
    onModelChange(tempModel);
    setOpen(false);
  };

  const getSpeedIcon = (speed: string) => {
    switch (speed) {
      case "Very Fast": return <Zap className="h-4 w-4 text-yellow-400" />;
      case "Fast": return <Cpu className="h-4 w-4 text-blue-400" />;
      default: return <Brain className="h-4 w-4 text-green-400" />;
    }
  };

  const getSpeedColor = (speed: string) => {
    switch (speed) {
      case "Very Fast": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "Fast": return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      default: return "bg-green-500/20 text-green-300 border-green-500/30";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-8 px-2 text-xs bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 text-gray-300"
        >
          <Settings className="h-3 w-3 mr-1" />
          {GEMINI_MODELS[selectedModel].name}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-400" />
            <span>Select AI Model</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Choose the Gemini model that best fits your needs. Each model has different capabilities and performance characteristics.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {Object.entries(GEMINI_MODELS).map(([modelKey, modelInfo]) => {
            const model = modelKey as GeminiModel;
            const isSelected = tempModel === model;
            
            return (
              <div
                key={model}
                className={cn(
                  "p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg",
                  isSelected 
                    ? "border-blue-500/50 bg-blue-500/10 shadow-blue-500/20" 
                    : "border-gray-600/50 bg-gray-700/30 hover:border-gray-500/50"
                )}
                onClick={() => setTempModel(model)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getSpeedIcon(modelInfo.speed)}
                    <div>
                      <h3 className="font-semibold text-white text-sm">{modelInfo.name}</h3>
                      <p className="text-xs text-gray-400 mt-1">{modelInfo.description}</p>
                    </div>
                  </div>
                  <Badge className={cn("text-xs", getSpeedColor(modelInfo.speed))}>
                    {modelInfo.speed}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {modelInfo.capabilities.map((capability) => (
                    <span
                      key={capability}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-600/50 text-gray-300"
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={tempModel === selectedModel}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
          >
            Apply Model
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}