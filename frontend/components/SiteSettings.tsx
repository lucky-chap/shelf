import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Settings, Save, Palette, Image, Upload, Layout, Type } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ThemePresetSelector, { ThemePreset, themePresets } from "./ThemePresetSelector";
import UnsplashImageSearch from "./UnsplashImageSearch";
import LayoutSelector from "./LayoutSelector";
import { LoadingSkeleton } from "./LoadingSkeleton";
import LoadingSpinner from "./LoadingSpinner";
import ErrorBoundary from "./ErrorBoundary";
import backend from "~backend/client";
import { isUnsplashConfigured as isUnsplashConfiguredFrontend } from "../config";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const availableFonts = [
  { name: "Sans Serif (Default)", value: "Inter, sans-serif" },
  { name: "Serif", value: "'Merriweather', serif" },
  { name: "Monospace", value: "'Roboto Mono', monospace" },
  { name: "Retro Pixel", value: "'VT323', monospace" },
  { name: "Retro Gaming", value: "'Press Start 2P', cursive" },
  { name: "Comic Style", value: "'Comic Neue', cursive" },
];

function SiteSettingsContent() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    themeColor: "#3B82F6",
    backgroundColor: "#FFFFFF",
    textColor: "#000000",
    avatarUrl: "",
    backgroundType: "solid" as "solid" | "unsplash" | "upload",
    backgroundImageUrl: "",
    selectedTheme: "" as string,
    layoutType: "" as string,
    fontFamily: "Inter, sans-serif"
  });
  const [avatarUpload, setAvatarUpload] = useState<{
    file: File | null;
    uploading: boolean;
  }>({ file: null, uploading: false });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const unsplashEnabled = isUnsplashConfiguredFrontend();

  const configQuery = useQuery({
    queryKey: ["config"],
    queryFn: async () => {
      try {
        return await backend.config.get();
      } catch (error: any) {
        console.error("Failed to fetch config:", error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const reader = new FileReader();
      return new Promise<any>((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64Content = reader.result?.toString().split(',')[1];
            if (!base64Content) throw new Error("Failed to read file");
            
            const result = await backend.config.uploadAvatar({
              fileName: file.name,
              imageContent: base64Content
            });
            resolve(result);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
    },
    onSuccess: (data) => {
      setFormData(prev => ({
        ...prev,
        avatarUrl: data.avatarUrl
      }));
      setAvatarUpload({ file: null, uploading: false });
      toast({
        title: "Avatar Uploaded",
        description: "Your avatar has been uploaded successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Avatar upload failed:", error);
      setAvatarUpload(prev => ({ ...prev, uploading: false }));
      toast({
        title: "Upload Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Clean up the data before sending to ensure proper types
      const updateData: any = {
        title: data.title,
        description: data.description,
        themeColor: data.themeColor,
        backgroundColor: data.backgroundColor,
        textColor: data.textColor,
        backgroundType: data.backgroundType,
        fontFamily: data.fontFamily,
      };

      // Only include optional fields if they have values
      if (data.avatarUrl && data.avatarUrl.trim()) {
        updateData.avatarUrl = data.avatarUrl.trim();
      }

      if (data.backgroundImageUrl && data.backgroundImageUrl.trim()) {
        updateData.backgroundImageUrl = data.backgroundImageUrl.trim();
      }

      if (data.selectedTheme && data.selectedTheme.trim()) {
        updateData.selectedTheme = data.selectedTheme.trim();
      }

      if (data.layoutType && data.layoutType.trim()) {
        updateData.layoutType = data.layoutType.trim();
      }

      return await backend.config.update(updateData);
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated!",
        description: "Your site configuration has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["config"] });
    },
    onError: (error: any) => {
      console.error("Failed to update configuration:", error);
      toast({
        title: "Failed to Update Settings",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  useEffect(() => {
    if (configQuery.data) {
      // If Unsplash is not configured but backgroundType is 'unsplash', force it to 'solid' to avoid unusable UI.
      const nextBackgroundType =
        !unsplashEnabled && configQuery.data.backgroundType === "unsplash"
          ? "solid"
          : (configQuery.data.backgroundType as "solid" | "unsplash" | "upload") || "solid";

      setFormData({
        title: configQuery.data.title,
        description: configQuery.data.description,
        themeColor: configQuery.data.themeColor,
        backgroundColor: configQuery.data.backgroundColor,
        textColor: configQuery.data.textColor,
        avatarUrl: configQuery.data.avatarUrl || "",
        backgroundType: nextBackgroundType,
        backgroundImageUrl: configQuery.data.backgroundImageUrl || "",
        selectedTheme: configQuery.data.selectedTheme || "",
        layoutType: configQuery.data.layoutType || "",
        fontFamily: configQuery.data.fontFamily || "Inter, sans-serif"
      });
    }
  }, [configQuery.data, unsplashEnabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast({
        title: "Missing Information",
        description: "Site title is required.",
        variant: "destructive",
      });
      return;
    }

    // Validate avatar URL if provided
    if (formData.avatarUrl) {
      try {
        new URL(formData.avatarUrl);
      } catch (error) {
        toast({
          title: "Invalid Avatar URL",
          description: "Please enter a valid avatar image URL.",
          variant: "destructive",
        });
        return;
      }
    }

    updateConfigMutation.mutate(formData);
  };

  const handleThemeSelect = (preset: ThemePreset) => {
    setFormData(prev => ({
      ...prev,
      themeColor: preset.themeColor,
      backgroundColor: preset.backgroundColor,
      textColor: preset.textColor,
      selectedTheme: preset.id,
      fontFamily: preset.fontFamily || "Inter, sans-serif",
    }));
  };

  const handleLayoutSelect = (layoutType: string) => {
    setFormData(prev => ({
      ...prev,
      layoutType
    }));
  };

  const handleBackgroundTypeChange = (type: "solid" | "unsplash" | "upload") => {
    // Prevent selecting unsplash if not configured
    if (type === "unsplash" && !unsplashEnabled) {
      toast({
        title: "Unsplash Not Configured",
        description: "Add VITE_UNSPLASH_ACCESS_KEY (frontend) and UNSPLASH_ACCESS_KEY (backend) to enable Unsplash.",
        variant: "destructive",
      });
      return;
    }
    setFormData(prev => ({
      ...prev,
      backgroundType: type,
      backgroundImageUrl: type === "solid" ? "" : prev.backgroundImageUrl
    }));
  };

  const handleUnsplashImageSelect = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      backgroundImageUrl: imageUrl
    }));
  };

  const handleAvatarUploadSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarUpload({ file, uploading: true });
      uploadAvatarMutation.mutate(file);
    }
  };

  if (configQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Theme Presets</CardTitle>
            <CardDescription>Choose from pre-designed themes or customize your own colors below</CardDescription>
          </CardHeader>
          <CardContent>
            <LoadingSkeleton rows={2} className="w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Site Settings</CardTitle>
            <CardDescription>Configure your landing page appearance and content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <LoadingSkeleton className="w-1/4" />
                  <LoadingSkeleton className="h-10" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (configQuery.isError) {
    return (
      <Card className="border-destructive">
        <CardContent className="text-center py-12">
          <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Failed to load site settings</p>
          <p className="text-sm text-destructive">
            {configQuery.error instanceof Error ? configQuery.error.message : "An unexpected error occurred"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Site Settings
              </CardTitle>
              <CardDescription>
                Configure your landing page content and basic appearance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Site Title *</Label>
                  <Input
                    id="title"
                    placeholder="My Landing Page"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Welcome to my creator landing page"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-4">
                  <Label>Avatar</Label>
                  <div className="flex items-start gap-6">
                    <div className="flex flex-col items-center gap-3">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={formData.avatarUrl || undefined} />
                        <AvatarFallback className="text-lg">
                          {formData.title.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm text-muted-foreground text-center">
                        Current avatar
                      </p>
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="avatarUrl">Avatar Image URL</Label>
                        <Input
                          id="avatarUrl"
                          placeholder="https://example.com/avatar.jpg"
                          value={formData.avatarUrl}
                          onChange={(e) => handleInputChange("avatarUrl", e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter a direct URL to your avatar image (JPG, PNG, etc.)
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="h-px bg-border flex-1" />
                        <span className="text-xs text-muted-foreground">OR</span>
                        <div className="h-px bg-border flex-1" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="avatarUpload">Upload Avatar Image</Label>
                        <Input
                          id="avatarUpload"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUploadSelect}
                          disabled={avatarUpload.uploading}
                        />
                        {avatarUpload.uploading && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <LoadingSpinner size="sm" />
                            Uploading avatar...
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Upload an image file (JPG, PNG, GIF, WEBP)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full flex items-center gap-2"
                  disabled={updateConfigMutation.isPending}
                >
                  {updateConfigMutation.isPending ? (
                    <LoadingSpinner size="sm" text="Saving..." />
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Settings
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-6">
          <ThemePresetSelector
            currentTheme={{
              themeColor: formData.themeColor,
              backgroundColor: formData.backgroundColor,
              textColor: formData.textColor,
            }}
            selectedTheme={formData.selectedTheme || null}
            onThemeSelect={handleThemeSelect}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Background Settings
              </CardTitle>
              <CardDescription>
                Choose how your landing page background should look
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Background Source</Label>
                <RadioGroup
                  value={formData.backgroundType}
                  onValueChange={(value) => handleBackgroundTypeChange(value as "solid" | "unsplash" | "upload")}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="solid" id="solid" />
                    <Label htmlFor="solid">Solid Color</Label>
                  </div>
                  {unsplashEnabled && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="unsplash" id="unsplash" />
                      <Label htmlFor="unsplash">Unsplash Image</Label>
                    </div>
                  )}
                </RadioGroup>
              </div>

              {formData.backgroundType === "unsplash" && unsplashEnabled && (
                <UnsplashImageSearch
                  selectedImageUrl={formData.backgroundImageUrl}
                  onImageSelect={handleUnsplashImageSelect}
                />
              )}

              {formData.backgroundType === "upload" && (
                <Card className="border-dashed">
                  <CardContent className="text-center py-12">
                    <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Custom image upload coming soon</p>
                    <p className="text-sm text-muted-foreground">
                      For now, you can use Unsplash images or enter a direct image URL
                    </p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customization</CardTitle>
              <CardDescription>
                Fine-tune your theme colors and fonts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Colors
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="themeColor">Theme</Label>
                      <Input
                        id="themeColor"
                        type="color"
                        value={formData.themeColor}
                        onChange={(e) => handleInputChange("themeColor", e.target.value)}
                        className="w-full h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="backgroundColor">Background</Label>
                      <Input
                        id="backgroundColor"
                        type="color"
                        value={formData.backgroundColor}
                        onChange={(e) => handleInputChange("backgroundColor", e.target.value)}
                        className="w-full h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="textColor">Text</Label>
                      <Input
                        id="textColor"
                        type="color"
                        value={formData.textColor}
                        onChange={(e) => handleInputChange("textColor", e.target.value)}
                        className="w-full h-10"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <Label className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Font
                  </Label>
                  <Select
                    value={formData.fontFamily}
                    onValueChange={(value) => handleInputChange("fontFamily", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a font" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFonts.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          <span style={{ fontFamily: font.value }}>{font.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleSubmit}
                className="w-full mt-6 flex items-center gap-2"
                disabled={updateConfigMutation.isPending}
              >
                {updateConfigMutation.isPending ? (
                  <LoadingSpinner size="sm" text="Saving..." />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Theme Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout">
          <LayoutSelector
            selectedLayout={formData.layoutType || "default"}
            onLayoutSelect={handleLayoutSelect}
            onSave={() => updateConfigMutation.mutate(formData)}
            isSaving={updateConfigMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                See how your landing page will look with these settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="p-6 rounded-lg border relative overflow-hidden"
                style={{ 
                  backgroundColor: formData.backgroundType === "solid" ? formData.backgroundColor : "#FFFFFF",
                  color: formData.textColor,
                  backgroundImage: formData.backgroundType === "unsplash" && formData.backgroundImageUrl 
                    ? `url(${formData.backgroundImageUrl})` 
                    : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  fontFamily: formData.fontFamily,
                }}
              >
                {formData.backgroundType === "unsplash" && formData.backgroundImageUrl && (
                  <div className="absolute inset-0 bg-black/20" />
                )}
                <div className="relative z-10">
                  <div className="text-center space-y-4">
                    <Avatar className="h-16 w-16 mx-auto">
                      <AvatarImage src={formData.avatarUrl || undefined} />
                      <AvatarFallback className="text-lg">
                        {formData.title.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 
                        className="text-xl font-bold"
                        style={{ color: formData.themeColor }}
                      >
                        {formData.title || "Site Title"}
                      </h2>
                      <p className="text-sm opacity-75 mt-1">
                        {formData.description || "Site description"}
                      </p>
                      {formData.selectedTheme && (
                        <p className="text-xs opacity-60 mt-1">
                          Theme: {themePresets.find(t => t.id === formData.selectedTheme)?.name}
                        </p>
                      )}
                      {formData.layoutType && (
                        <p className="text-xs opacity-60 mt-1">
                          Layout: {formData.layoutType}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SiteSettings() {
  return (
    <ErrorBoundary>
      <SiteSettingsContent />
    </ErrorBoundary>
  );
}
