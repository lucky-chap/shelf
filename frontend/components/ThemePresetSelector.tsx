import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check, Palette } from "lucide-react";

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  textColor: string;
}

export const themePresets: ThemePreset[] = [
  {
    id: "light",
    name: "Light",
    description: "Clean and bright",
    themeColor: "#3B82F6",
    backgroundColor: "#FFFFFF",
    textColor: "#000000",
  },
  {
    id: "dark",
    name: "Dark",
    description: "Modern dark theme",
    themeColor: "#60A5FA",
    backgroundColor: "#0F172A",
    textColor: "#F1F5F9",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple and elegant",
    themeColor: "#6B7280",
    backgroundColor: "#F9FAFB",
    textColor: "#374151",
  },
  {
    id: "colorful",
    name: "Colorful",
    description: "Vibrant and bold",
    themeColor: "#EC4899",
    backgroundColor: "#FDF2F8",
    textColor: "#831843",
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Cool blue tones",
    themeColor: "#0EA5E9",
    backgroundColor: "#F0F9FF",
    textColor: "#0C4A6E",
  },
  {
    id: "forest",
    name: "Forest",
    description: "Natural green theme",
    themeColor: "#10B981",
    backgroundColor: "#F0FDF4",
    textColor: "#064E3B",
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm orange and red",
    themeColor: "#F97316",
    backgroundColor: "#FFF7ED",
    textColor: "#9A3412",
  },
  {
    id: "lavender",
    name: "Lavender",
    description: "Soft purple tones",
    themeColor: "#8B5CF6",
    backgroundColor: "#FAF5FF",
    textColor: "#581C87",
  },
];

interface ThemePresetSelectorProps {
  currentTheme: {
    themeColor: string;
    backgroundColor: string;
    textColor: string;
  };
  onThemeSelect: (theme: ThemePreset) => void;
}

export default function ThemePresetSelector({ currentTheme, onThemeSelect }: ThemePresetSelectorProps) {
  const isCurrentTheme = (preset: ThemePreset) => {
    return (
      preset.themeColor === currentTheme.themeColor &&
      preset.backgroundColor === currentTheme.backgroundColor &&
      preset.textColor === currentTheme.textColor
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Theme Presets
        </CardTitle>
        <CardDescription>
          Choose from pre-designed themes or customize your own colors below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {themePresets.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              className="h-auto p-3 flex flex-col items-center gap-2 relative"
              onClick={() => onThemeSelect(preset)}
            >
              {isCurrentTheme(preset) && (
                <div className="absolute top-1 right-1">
                  <Check className="h-4 w-4 text-primary" />
                </div>
              )}
              
              <div className="flex gap-1">
                <div
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: preset.backgroundColor }}
                />
                <div
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: preset.themeColor }}
                />
                <div
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: preset.textColor }}
                />
              </div>
              
              <div className="text-center">
                <div className="font-medium text-sm">{preset.name}</div>
                <div className="text-xs text-muted-foreground">{preset.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
