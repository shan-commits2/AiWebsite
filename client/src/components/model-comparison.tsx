import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { GitCompare, Send, Loader2 } from "lucide-react";
import { GEMINI_MODELS, type GeminiModel } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ChatMessage } from "./chat-message";
import { cn } from "@/lib/utils";

interface ModelComparisonProps {
  prompt: string;
  onComparison: (results: ComparisonResult[]) => void;
}

interface ComparisonResult {
  model: GeminiModel;
  response: string;
  responseTime: number;
  tokens: number;
}

export function ModelComparison({ prompt, onComparison }: ModelComparisonProps) {
  const [open, setOpen] = useState(false);
  const [selectedModels, setSelectedModels] = useState<GeminiModel[]>(["gemini-1.5-flash", "gemini-2.0-flash-exp"]);
  const [results, setResults] = useState<ComparisonResult[]>([]);

  const comparisonMutation = useMutation({
    mutationFn: async (models: GeminiModel[]) => {
      const promises = models.map(async (model) => {
        const startTime = Date.now();
        const response = await apiRequest("POST", "/api/chat/compare", {
          message: prompt,
          model,
        });
        const data = await response.json();
        const responseTime = Date.now() - startTime;
        
        return {
          model,
          response: data.response,
          responseTime,
          tokens: data.tokens || 0,
        };
      });
      
      return Promise.all(promises);
    },
    onSuccess: (results) => {
      setResults(results);
      onComparison(results);
    },
  });

  const handleModelToggle = (model: GeminiModel) => {
    setSelectedModels(prev => 
      prev.includes(model) 
        ? prev.filter(m => m !== model)
        : [...prev, model]
    );
  };

  const handleCompare = () => {
    if (selectedModels.length < 2) return;
    comparisonMutation.mutate(selectedModels);
  };

  const getModelColor = (model: GeminiModel, index: number) => {
    const colors = [
      "border-blue-500 bg-blue-500/10",
      "border-green-500 bg-green-500/10", 
      "border-purple-500 bg-purple-500/10"
    ];
    return colors[index] || "border-gray-500 bg-gray-500/10";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
          disabled={!prompt.trim()}
        >
          <GitCompare className="h-4 w-4 mr-2" />
          Compare Models
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-6xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center space-x-2">
            <GitCompare className="h-5 w-5 text-blue-400" />
            <span>Model Comparison</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Compare responses from different AI models side by side
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Model Selection */}
          {!comparisonMutation.isPending && results.length === 0 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-3">
                  Select models to compare (minimum 2):
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(GEMINI_MODELS).map(([modelKey, modelInfo]) => {
                    const model = modelKey as GeminiModel;
                    const isSelected = selectedModels.includes(model);
                    
                    return (
                      <div
                        key={model}
                        className={cn(
                          "p-3 rounded-lg border transition-all cursor-pointer",
                          isSelected 
                            ? "border-blue-500 bg-blue-500/10" 
                            : "border-gray-600 bg-gray-700/30 hover:border-gray-500"
                        )}
                        onClick={() => handleModelToggle(model)}
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox 
                            checked={isSelected}
                            onChange={() => handleModelToggle(model)}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-white">{modelInfo.name}</div>
                            <div className="text-sm text-gray-400">{modelInfo.description}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Speed: {modelInfo.speed} • Max tokens: {modelInfo.maxTokens.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCompare}
                  disabled={selectedModels.length < 2}
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Compare Responses
                </Button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {comparisonMutation.isPending && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
                <div className="text-white font-medium">Comparing models...</div>
                <div className="text-sm text-gray-400">
                  Getting responses from {selectedModels.length} models
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                <div className="text-sm text-gray-400">Prompt:</div>
                <div className="text-white font-medium mt-1">{prompt}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((result, index) => {
                  const modelInfo = GEMINI_MODELS[result.model];
                  
                  return (
                    <div
                      key={result.model}
                      className={cn(
                        "border rounded-lg p-4 space-y-3",
                        getModelColor(result.model, index)
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-white">{modelInfo.name}</div>
                          <div className="text-xs text-gray-400">
                            {result.responseTime}ms • {result.tokens} tokens
                          </div>
                        </div>
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto">
                        <ChatMessage
                          message={{
                            id: `comparison-${result.model}`,
                            role: "assistant",
                            content: result.response,
                            conversationId: "comparison",
                            timestamp: new Date(),
                            tokens: result.tokens,
                            responseTime: result.responseTime,
                            isEdited: false,
                            isBookmarked: false,
                          }}
                          showTimestamp={false}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setResults([]);
                    setOpen(false);
                  }}
                  className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                >
                  Close
                </Button>
                <Button
                  onClick={() => setResults([])}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  New Comparison
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}