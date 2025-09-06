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
  buttonStyle?: "rounded" | "square" | "pill";
  fontFamily?: string;
}

export const themePresets: ThemePreset[] = [
  {
    id: "light",
    name: "Light",
    description: "Clean and bright",
    themeColor: "#3B82F6",
    backgroundColor: "#FFFFFF",
    textColor: "#000000",
    buttonStyle: "rounded",
    fontFamily: "Inter, sans-serif",
  },
  {
    id: "dark",
    name: "Dark",
    description: "Modern dark theme",
    themeColor: "#60A5FA",
    backgroundColor: "#0F172A",
    textColor: "#F1F5F9",
    buttonStyle: "rounded",
    fontFamily: "Inter, sans-serif",
  },
  {
    id: "retro",
    name: "Retro",
    description: "Vintage vibes",
    themeColor: "#DC2626",
    backgroundColor: "#FEF2F2",
    textColor: "#7F1D1D",
    buttonStyle: "square",
    fontFamily: "'Press Start 2P', cursive",
  },
  {
    id: "pixel",
    name: "Pixel",
    description: "8-bit gaming style",
    themeColor: "#4ADE80",
    backgroundColor: "#000000",
    textColor: "#FFFFFF",
    buttonStyle: "square",
    fontFamily: "'VT323', monospace",
  },
  {
    id: "comic",
    name: "Comic",
    description: "Fun and playful",
    themeColor: "#F97316",
    backgroundColor: "#FFF7ED",
    textColor: "#B45309",
    buttonStyle: "rounded",
    fontFamily: "'Comic Neue', cursive",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple and elegant",
    themeColor: "#6B7280",
    backgroundColor: "#F9FAFB",
    textColor: "#374151",
    buttonStyle: "square",
    fontFamily: "Inter, sans-serif",
  },
  {
    id: "colorful",
    name: "Colorful",
    description: "Vibrant and bold",
    themeColor: "#EC4899",
    backgroundColor: "#FDF2F8",
    textColor: "#831843",
    buttonStyle: "pill",
    fontFamily: "Inter, sans-serif",
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Cool blue tones",
    themeColor: "#0EA5E9",
    backgroundColor: "#F0F9FF",
    textColor: "#0C4A6E",
    buttonStyle: "rounded",
    fontFamily: "Inter, sans-serif",
  },
  {
    id: "forest",
    name: "Forest",
    description: "Natural green theme",
    themeColor: "#10B981",
    backgroundColor: "#F0FDF4",
    textColor: "#064E3B",
    buttonStyle: "rounded",
    fontFamily: "Inter, sans-serif",
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm orange and red",
    themeColor: "#F97316",
    backgroundColor: "#FFF7ED",
    textColor: "#9A3412",
    buttonStyle: "pill",
    fontFamily: "Inter, sans-serif",
  },
  {
    id: "lavender",
    name: "Lavender",
    description: "Soft purple tones",
    themeColor: "#8B5CF6",
    backgroundColor: "#FAF5FF",
    textColor: "#581C87",
    buttonStyle: "rounded",
    fontFamily: "Inter, sans-serif",
  },
  {
    id: "neon",
    name: "Neon",
    description: "Electric and bold",
    themeColor: "#10B981",
    backgroundColor: "#000000",
    textColor: "#00FF88",
    buttonStyle: "pill",
    fontFamily: "'VT323', monospace",
  },
  {
    id: "earthy",
    name: "Earthy",
    description: "Natural brown tones",
    themeColor: "#A3A3A3",
    backgroundColor: "#F5F5DC",
    textColor: "#8B4513",
    buttonStyle: "rounded",
    fontFamily: "'Merriweather', serif",
  },
  {
    id: "corporate",
    name: "Corporate",
    description: "Professional blue",
    themeColor: "#1E40AF",
    backgroundColor: "#FFFFFF",
    textColor: "#1F2937",
    buttonStyle: "square",
    fontFamily: "Inter, sans-serif",
  },
  {
    id: "pastel",
    name: "Pastel",
    description: "Soft and dreamy",
    themeColor: "#F472B6",
    backgroundColor: "#FEF7FF",
    textColor: "#7C2D92",
    buttonStyle: "pill",
    fontFamily: "Inter, sans-serif",
  },
  {
    id: "monochrome",
    name: "Monochrome",
    description: "Black and white",
    themeColor: "#000000",
    backgroundColor: "#FFFFFF",
    textColor: "#000000",
    buttonStyle: "square",
    fontFamily: "'Roboto Mono', monospace",
  },
];

interface ThemePresetSelectorProps {
  currentTheme: {
    themeColor: string;
    backgroundColor: string;
    textColor: string;
  };
  selectedTheme?: string | null;
  onThemeSelect: (theme: ThemePreset) => void;
}

export default function ThemePresetSelector({ currentTheme, selectedTheme, onThemeSelect }: ThemePresetSelectorProps) {
  const isCurrentTheme = (preset: ThemePreset) => {
    return selectedTheme === preset.id || (
      (!selectedTheme || selectedTheme === "") &&
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
