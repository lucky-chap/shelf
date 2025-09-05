import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Layout, Grid, List, Calendar, Minimize, Save } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

export interface LayoutOption {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  preview: string;
  responsiveBehavior: string;
}

export const layoutOptions: LayoutOption[] = [
  {
    id: "default",
    name: "Default",
    description: "Classic vertical stack layout",
    icon: List,
    preview: "Simple, clean vertical layout with centered content",
    responsiveBehavior: "Single column on all devices"
  },
  {
    id: "grid",
    name: "Grid",
    description: "Modern grid layout",
    icon: Grid,
    preview: "Links arranged in a responsive grid layout",
    responsiveBehavior: "2-3 columns on desktop, single column on mobile"
  },
  {
    id: "timeline",
    name: "Timeline",
    description: "Timeline-style layout",
    icon: Calendar,
    preview: "Links displayed in a timeline format with dates",
    responsiveBehavior: "Timeline view on desktop, compact on mobile"
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean minimal design",
    icon: Minimize,
    preview: "Simplified layout with maximum focus on content",
    responsiveBehavior: "Consistent minimal design across all devices"
  },
  {
    id: "cards",
    name: "Cards",
    description: "Card-based layout",
    icon: Layout,
    preview: "Each link displayed as an individual card",
    responsiveBehavior: "Card grid on desktop, stacked cards on mobile"
  }
];

interface LayoutSelectorProps {
  selectedLayout: string;
  onLayoutSelect: (layoutId: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

export default function LayoutSelector({ 
  selectedLayout, 
  onLayoutSelect, 
  onSave, 
  isSaving 
}: LayoutSelectorProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Layout Options
          </CardTitle>
          <CardDescription>
            Choose how your landing page content is displayed. Layout changes apply to both desktop and mobile views.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {layoutOptions.map((layout) => {
              const Icon = layout.icon;
              const isSelected = selectedLayout === layout.id;
              
              return (
                <Card
                  key={layout.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => onLayoutSelect(layout.id)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-primary" />
                          <span className="font-medium">{layout.name}</span>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {layout.description}
                        </p>
                        
                        <div className="bg-muted/50 rounded p-3 text-xs text-muted-foreground">
                          {layout.preview}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {layout.responsiveBehavior}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Layout Preview</CardTitle>
          <CardDescription>
            How your selected layout will appear on different devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Desktop Preview */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Desktop View</h4>
              <div className="border rounded-lg p-4 bg-muted/20">
                <LayoutPreview layoutId={selectedLayout} device="desktop" />
              </div>
            </div>

            {/* Mobile Preview */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Mobile View</h4>
              <div className="border rounded-lg p-4 bg-muted/20 max-w-48 mx-auto">
                <LayoutPreview layoutId={selectedLayout} device="mobile" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <LoadingSpinner size="sm" text="Saving..." />
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Layout
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function LayoutPreview({ layoutId, device }: { layoutId: string; device: "desktop" | "mobile" }) {
  const selectedLayout = layoutOptions.find(l => l.id === layoutId) || layoutOptions[0];
  
  const mockLinks = [
    { title: "My Website", color: "#3B82F6" },
    { title: "Portfolio", color: "#10B981" },
    { title: "Contact", color: "#F59E0B" },
  ];

  // Render different preview styles based on layout
  switch (layoutId) {
    case "grid":
      return (
        <div className={`space-y-2 ${device === "desktop" ? "grid grid-cols-2 gap-2 space-y-0" : ""}`}>
          {mockLinks.map((link, i) => (
            <div 
              key={i} 
              className="h-8 rounded text-xs flex items-center justify-center text-white"
              style={{ backgroundColor: link.color }}
            >
              {link.title}
            </div>
          ))}
        </div>
      );

    case "timeline":
      return (
        <div className="space-y-3">
          {mockLinks.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <div 
                className="h-6 flex-1 rounded text-xs flex items-center px-2 text-white"
                style={{ backgroundColor: link.color }}
              >
                {link.title}
              </div>
            </div>
          ))}
        </div>
      );

    case "minimal":
      return (
        <div className="space-y-1">
          {mockLinks.map((link, i) => (
            <div 
              key={i} 
              className="h-6 rounded-sm text-xs flex items-center justify-center border"
              style={{ borderColor: link.color, color: link.color }}
            >
              {link.title}
            </div>
          ))}
        </div>
      );

    case "cards":
      return (
        <div className={`space-y-2 ${device === "desktop" ? "grid grid-cols-2 gap-2 space-y-0" : ""}`}>
          {mockLinks.map((link, i) => (
            <div key={i} className="border rounded p-2 space-y-1">
              <div 
                className="h-4 w-4 rounded"
                style={{ backgroundColor: link.color }}
              />
              <div className="text-xs font-medium">{link.title}</div>
            </div>
          ))}
        </div>
      );

    default: // default layout
      return (
        <div className="space-y-2">
          {mockLinks.map((link, i) => (
            <div 
              key={i} 
              className="h-8 rounded text-xs flex items-center justify-center text-white"
              style={{ backgroundColor: link.color }}
            >
              {link.title}
            </div>
          ))}
        </div>
      );
  }
}
