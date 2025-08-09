import { useState } from "react";
import { ThemeSelector } from "./theme-selector";
import { AnalyticsDashboard } from "./analytics-dashboard";
import { ModelComparison } from "./model-comparison";
import { GeminiModel, Theme } from "@shared/schema";
import { Button } from "./ui/button";

interface SettingsProps {
  selectedTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  selectedModel: GeminiModel;
  onModelChange: (model: GeminiModel) => void;
  onClose: () => void;
}

export function Settings({
  selectedTheme,
  onThemeChange,
  selectedModel,
  onModelChange,
  onClose,
}: SettingsProps) {
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [showModelComparison, setShowModelComparison] = useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-6">
      <div className="bg-gray-900 rounded-lg max-w-5xl w-full max-h-full overflow-auto p-6 relative text-white shadow-xl">
        <Button
          className="absolute top-4 right-4"
          variant="ghost"
          onClick={onClose}
          aria-label="Close Settings"
        >
          ✕
        </Button>

        <h1 className="text-3xl font-bold mb-6">Settings</h1>

        {/* Theme Selector */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Theme</h2>
          <ThemeSelector selectedTheme={selectedTheme} onThemeChange={onThemeChange} />
        </section>

        {/* Toggle between Analytics and Model Comparison */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Additional Tools</h2>
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => {
                setShowAnalytics(true);
                setShowModelComparison(false);
              }}
              className={`px-4 py-2 rounded ${
                showAnalytics
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Analytics Dashboard
            </button>
            <button
              onClick={() => {
                setShowAnalytics(false);
                setShowModelComparison(true);
              }}
              className={`px-4 py-2 rounded ${
                showModelComparison
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Model Comparison
            </button>
          </div>

          <div className="border border-gray-700 rounded p-4 max-h-[400px] overflow-auto">
            {showAnalytics && <AnalyticsDashboard />}
            {showModelComparison && (
              <ModelComparison selectedModel={selectedModel} onModelChange={onModelChange} />
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
