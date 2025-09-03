import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, File, Plus, Save, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import LoadingSpinner from "./LoadingSpinner";
import backend from "~backend/client";

interface AdminProduct {
  id: number;
  title: string;
  description: string | null;
  priceCents: number;
  coverUrl: string | null;
  isActive: boolean;
  createdAt: Date;
}

export default function ProductsManagement() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ["admin", "store", "products"],
    queryFn: async () => await backend.store.listProducts(),
  });

  const [form, setForm] = useState({
    id: 0,
    title: "",
    description: "",
    priceCents: 0,
    coverObjectName: "" as string | null | undefined,
    coverPreviewUrl: "" as string | null,
    fileObjectName: "" as string | undefined,
    isEditing: false,
  });

  const resetForm = () => {
    setForm({
      id: 0,
      title: "",
      description: "",
      priceCents: 0,
      coverObjectName: undefined,
      coverPreviewUrl: null,
      fileObjectName: undefined,
      isEditing: false,
    });
  };

  const handleCoverUpload = async (file: File) => {
    const { url, objectName, publicUrl } = await backend.store.generateUploadUrl({
      type: "cover",
      filename: file.name,
      contentType: file.type,
    });
    await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    setForm((f) => ({ ...f, coverObjectName: objectName, coverPreviewUrl: publicUrl || null }));
    toast({ title: "Cover uploaded" });
  };

  const handleFileUpload = async (file: File) => {
    const { url, objectName } = await backend.store.generateUploadUrl({
      type: "file",
      filename: file.name,
      contentType: file.type,
    });
    await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    setForm((f) => ({ ...f, fileObjectName: objectName }));
    toast({ title: "File uploaded" });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.title || !form.fileObjectName) throw new Error("Title and file are required");
      return await backend.store.createProduct({
        title: form.title,
        description: form.description || undefined,
        priceCents: Math.max(0, Number(form.priceCents) || 0),
        coverObjectName: form.coverObjectName || undefined,
        fileObjectName: form.fileObjectName,
      });
    },
    onSuccess: () => {
      toast({ title: "Product created" });
      resetForm();
      qc.invalidateQueries({ queryKey: ["admin", "store", "products"] });
      qc.invalidateQueries({ queryKey: ["store", "products"] });
    },
    onError: (e: any) => {
      console.error(e);
      toast({ title: "Create failed", description: e?.message || "Error", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!form.id) throw new Error("No product selected");
      return await backend.store.updateProduct({
        id: form.id,
        title: form.title || undefined,
        description: form.description || undefined,
        priceCents: Math.max(0, Number(form.priceCents) || 0),
        coverObjectName: form.coverObjectName === undefined ? undefined : (form.coverObjectName || null),
        fileObjectName: form.fileObjectName || undefined,
        isActive: undefined,
      });
    },
    onSuccess: () => {
      toast({ title: "Product updated" });
      resetForm();
      qc.invalidateQueries({ queryKey: ["admin", "store", "products"] });
      qc.invalidateQueries({ queryKey: ["store", "products"] });
    },
    onError: (e: any) => {
      console.error(e);
      toast({ title: "Update failed", description: e?.message || "Error", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => await backend.store.deleteProduct({ id }),
    onSuccess: () => {
      toast({ title: "Product deleted" });
      qc.invalidateQueries({ queryKey: ["admin", "store", "products"] });
      qc.invalidateQueries({ queryKey: ["store", "products"] });
    },
    onError: (e: any) => {
      console.error(e);
      toast({ title: "Delete failed", description: e?.message || "Error", variant: "destructive" });
    },
  });

  const startEdit = (p: AdminProduct) => {
    setForm({
      id: p.id,
      title: p.title,
      description: p.description || "",
      priceCents: p.priceCents,
      coverObjectName: undefined,
      coverPreviewUrl: p.coverUrl,
      fileObjectName: undefined,
      isEditing: true,
    });
  };

  const products = productsQuery.data?.products ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manage Products</CardTitle>
              <CardDescription>Upload files, set pricing, and publish to your store</CardDescription>
            </div>
            {!form.isEditing ? (
              <Button onClick={resetForm} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Product
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (form.isEditing) {
                updateMutation.mutate();
              } else {
                createMutation.mutate();
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cover Photo</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) await handleCoverUpload(file);
                    }}
                  />
                  {form.coverPreviewUrl && (
                    <img
                      src={form.coverPreviewUrl}
                      className="h-12 w-12 object-cover rounded"
                      alt="cover"
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Optional. Shown on product card.</p>
              </div>

              <div className="space-y-2">
                <Label>Digital File *</Label>
                <Input
                  type="file"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) await handleFileUpload(file);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Required. This is the file customers will download.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (USD cents)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                value={form.priceCents}
                onChange={(e) => setForm((f) => ({ ...f, priceCents: Number(e.target.value || 0) }))}
              />
              <p className="text-xs text-muted-foreground">Set 0 for free.</p>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex items-center gap-2"
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <LoadingSpinner size="sm" />
                ) : <Save className="h-4 w-4" />}
                {form.isEditing ? "Save Changes" : "Create Product"}
              </Button>
              {form.isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>Your published items</CardDescription>
        </CardHeader>
        <CardContent>
          {productsQuery.isLoading ? (
            <LoadingSpinner text="Loading..." />
          ) : products.length === 0 ? (
            <p className="text-muted-foreground">No products yet</p>
          ) : (
            <div className="space-y-3">
              {products.map((p) => (
                <div key={p.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    {p.coverUrl ? (
                      <img src={p.coverUrl} className="h-10 w-10 rounded object-cover" alt="" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{p.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {(p.priceCents === 0 ? "Free" : `$${(p.priceCents / 100).toFixed(2)}`)} · {new Date(p.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => startEdit(p)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(p.id)}
                      disabled={deleteMutation.isPending}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
