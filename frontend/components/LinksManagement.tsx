import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import DraggableLink from "./DraggableLink";
import { CardLoadingSkeleton } from "./LoadingSkeleton";
import LoadingSpinner from "./LoadingSpinner";
import ErrorBoundary from "./ErrorBoundary";
import backend from "~backend/client";

function LinksManagementContent() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    description: "",
    iconUrl: "",
    backgroundColor: "#FFFFFF",
    textColor: "#000000"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const linksQuery = useQuery({
    queryKey: ["links"],
    queryFn: async () => {
      return await backend.links.list();
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const createLinkMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await backend.links.create(data);
    },
    onSuccess: () => {
      toast({
        title: "Link Created!",
        description: "Your new link has been added successfully.",
      });
      resetForm();
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["links"] });
    },
    onError: (error: any) => {
      console.error("Failed to create link:", error);
      toast({
        title: "Failed to Create Link",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateLinkMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: number }) => {
      return await backend.links.update(data);
    },
    onSuccess: () => {
      toast({
        title: "Link Updated!",
        description: "Your link has been updated successfully.",
      });
      resetForm();
      setIsEditDialogOpen(false);
      setEditingLink(null);
      queryClient.invalidateQueries({ queryKey: ["links"] });
    },
    onError: (error: any) => {
      console.error("Failed to update link:", error);
      toast({
        title: "Failed to Update Link",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteLinkMutation = useMutation({
    mutationFn: async (id: number) => {
      return await backend.links.deleteFn({ id });
    },
    onSuccess: () => {
      toast({
        title: "Link Deleted",
        description: "Your link has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["links"] });
    },
    onError: (error: any) => {
      console.error("Failed to delete link:", error);
      toast({
        title: "Failed to Delete Link",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const reorderLinksMutation = useMutation({
    mutationFn: async (linkIds: number[]) => {
      return await backend.links.reorder({ linkIds });
    },
    onSuccess: () => {
      toast({
        title: "Links Reordered",
        description: "Your link order has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["links"] });
    },
    onError: (error: any) => {
      console.error("Failed to reorder links:", error);
      toast({
        title: "Failed to Reorder Links",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["links"] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      url: "",
      description: "",
      iconUrl: "",
      backgroundColor: "#FFFFFF",
      textColor: "#000000"
    });
  };

  const handleEdit = (link: any) => {
    setEditingLink(link);
    setFormData({
      title: link.title,
      url: link.url,
      description: link.description || "",
      iconUrl: link.iconUrl || "",
      backgroundColor: link.backgroundColor,
      textColor: link.textColor
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.url) {
      toast({
        title: "Missing Information",
        description: "Title and URL are required.",
        variant: "destructive",
      });
      return;
    }

    if (editingLink) {
      updateLinkMutation.mutate({ ...formData, id: editingLink.id });
    } else {
      createLinkMutation.mutate(formData);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      const links = linksQuery.data?.links || [];
      const oldIndex = links.findIndex((link) => link.id === active.id);
      const newIndex = links.findIndex((link) => link.id === over.id);

      const reorderedLinks = arrayMove(links, oldIndex, newIndex);
      const linkIds = reorderedLinks.map((link) => link.id);

      queryClient.setQueryData(["links"], {
        links: reorderedLinks
      });

      reorderLinksMutation.mutate(linkIds);
    }
  };

  if (linksQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Manage Links</CardTitle>
                <CardDescription>Add and customize your link collection. Drag and drop to reorder.</CardDescription>
              </div>
              <Button disabled className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Link
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <CardLoadingSkeleton key={i} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (linksQuery.isError) {
    return (
      <Card className="border-destructive">
        <CardContent className="text-center py-12">
          <ExternalLink className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Failed to load links</p>
          <p className="text-sm text-destructive">
            {linksQuery.error instanceof Error ? linksQuery.error.message : "An unexpected error occurred"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const links = linksQuery.data?.links || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manage Links</CardTitle>
              <CardDescription>Add and customize your link collection. Drag and drop to reorder.</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" onClick={resetForm}>
                  <Plus className="h-4 w-4" />
                  Add Link
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Link</DialogTitle>
                  <DialogDescription>
                    Create a new link for your landing page
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="My Awesome Link"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="url">URL *</Label>
                    <Input
                      id="url"
                      placeholder="https://example.com"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Optional description..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="iconUrl">Icon URL</Label>
                    <Input
                      id="iconUrl"
                      placeholder="https://example.com/icon.png"
                      value={formData.iconUrl}
                      onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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

                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createLinkMutation.isPending}
                      className="w-full"
                    >
                      {createLinkMutation.isPending ? (
                        <LoadingSpinner size="sm" text="Creating..." />
                      ) : (
                        "Create Link"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <div className="text-center py-8">
              <ExternalLink className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No links created yet</p>
              <p className="text-sm text-muted-foreground">Add your first link to get started</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            >
              <SortableContext items={links} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {links.map((link) => (
                    <DraggableLink
                      key={link.id}
                      link={link}
                      onEdit={handleEdit}
                      onDelete={(id) => deleteLinkMutation.mutate(id)}
                      isDeleting={deleteLinkMutation.isPending}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Link</DialogTitle>
            <DialogDescription>
              Update your link details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                placeholder="My Awesome Link"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-url">URL *</Label>
              <Input
                id="edit-url"
                placeholder="https://example.com"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Optional description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-iconUrl">Icon URL</Label>
              <Input
                id="edit-iconUrl"
                placeholder="https://example.com/icon.png"
                value={formData.iconUrl}
                onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-backgroundColor">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-backgroundColor"
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
                <Label htmlFor="edit-textColor">Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-textColor"
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

            <DialogFooter>
              <Button 
                type="submit" 
                disabled={updateLinkMutation.isPending}
                className="w-full"
              >
                {updateLinkMutation.isPending ? (
                  <LoadingSpinner size="sm" text="Updating..." />
                ) : (
                  "Update Link"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LinksManagement() {
  return (
    <ErrorBoundary>
      <LinksManagementContent />
    </ErrorBoundary>
  );
}
