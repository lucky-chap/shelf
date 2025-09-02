import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ThemePresetSelector, { ThemePreset } from "./ThemePresetSelector";
import { LoadingSkeleton } from "./LoadingSkeleton";
import LoadingSpinner from "./LoadingSpinner";
import ErrorBoundary from "./ErrorBoundary";
import backend from "~backend/client";

function SiteSettingsContent() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    themeColor: "#3B82F6",
    backgroundColor: "#FFFFFF",
    textColor: "#000000",
    avatarUrl: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const updateConfigMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await backend.config.update(data);
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

  useEffect(() => {
    if (configQuery.data) {
      setFormData({
        title: configQuery.data.title,
        description: configQuery.data.description,
        themeColor: configQuery.data.themeColor,
        backgroundColor: configQuery.data.backgroundColor,
        textColor: configQuery.data.textColor,
        avatarUrl: configQuery.data.avatarUrl || ""
      });
    }
  }, [configQuery.data]);

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
    setFormData({
      ...formData,
      themeColor: preset.themeColor,
      backgroundColor: preset.backgroundColor,
      textColor: preset.textColor,
    });
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
      <ThemePresetSelector
        currentTheme={{
          themeColor: formData.themeColor,
          backgroundColor: formData.backgroundColor,
          textColor: formData.textColor,
        }}
        onThemeSelect={handleThemeSelect}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Site Settings
          </CardTitle>
          <CardDescription>
            Configure your landing page appearance and content
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
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Welcome to my creator landing page"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                
                <div className="flex-1 space-y-2">
                  <Label htmlFor="avatarUrl">Avatar Image URL</Label>
                  <Input
                    id="avatarUrl"
                    placeholder="https://example.com/avatar.jpg"
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a direct URL to your avatar image (JPG, PNG, etc.)
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Custom Colors</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="themeColor">Theme Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="themeColor"
                      type="color"
                      value={formData.themeColor}
                      onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.themeColor}
                      onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backgroundColor">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="textColor">Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="textColor"
                      type="color"
                      value={formData.textColor}
                      onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.textColor}
                      onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                      placeholder="#000000"
                    />
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

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            See how your landing page will look with these settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="p-6 rounded-lg border"
            style={{ 
              backgroundColor: formData.backgroundColor,
              color: formData.textColor
            }}
          >
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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
