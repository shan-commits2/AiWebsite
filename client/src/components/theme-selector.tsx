import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Palette } from "lucide-react";
import { type Theme } from "@shared/schema";

interface ThemeSelectorProps {
  selectedTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const themes: { value: Theme; label: string; colors: string }[] = [
  { 
    value: "dark-gray", 
    label: "Dark Gray", 
    colors: "bg-gray-800 text-gray-100" 
  },
  { 
    value: "blue-dark", 
    label: "Blue Dark", 
    colors: "bg-blue-900 text-blue-100" 
  },
  { 
    value: "green-dark", 
    label: "Green Dark", 
    colors: "bg-green-900 text-green-100" 
  },
  { 
    value: "purple-dark", 
    label: "Purple Dark", 
    colors: "bg-purple-900 text-purple-100" 
  },
];

export function ThemeSelector({ selectedTheme, onThemeChange }: ThemeSelectorProps) {
  const currentTheme = themes.find(t => t.value === selectedTheme) || themes[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-xs bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 text-gray-300"
        >
          <Palette className="h-3 w-3 mr-2" />
          {currentTheme.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-gray-800 border-gray-700"
      >
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            onClick={() => onThemeChange(theme.value)}
            className={`cursor-pointer hover:bg-gray-700 ${
              selectedTheme === theme.value ? "bg-gray-700" : ""
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${theme.colors} border border-gray-600`} />
              <span className="text-gray-200">{theme.label}</span>
              {selectedTheme === theme.value && (
                <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}