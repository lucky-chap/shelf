import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, ShoppingBag, Edit, Trash2, Download, Upload } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUpload from "./FileUpload";
import { CardLoadingSkeleton } from "./LoadingSkeleton";
import LoadingSpinner from "./LoadingSpinner";
import ErrorBoundary from "./ErrorBoundary";
import backend from "~backend/client";

function ProductsManagementContent() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priceCents: "",
    downloadUrl: "",
    previewImageUrl: "",
    fileType: "",
    fileSizeBytes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      return await backend.products.list();
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      return await backend.products.create({
        title: data.title,
        description: data.description || undefined,
        priceCents: parseInt(data.priceCents),
        downloadUrl: data.downloadUrl,
        previewImageUrl: data.previewImageUrl || undefined,
        fileType: data.fileType || undefined,
        fileSizeBytes: data.fileSizeBytes ? parseInt(data.fileSizeBytes) : undefined,
      });
    },
    onSuccess: () => {
      toast({
        title: "Product Created!",
        description: "Your new product has been added to your store.",
      });
      resetForm();
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: any) => {
      console.error("Failed to create product:", error);
      toast({
        title: "Failed to Create Product",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: any) => {
      return await backend.products.update({
        id: editingProduct.id,
        title: data.title,
        description: data.description || undefined,
        priceCents: parseInt(data.priceCents),
        downloadUrl: data.downloadUrl,
        previewImageUrl: data.previewImageUrl || undefined,
        fileType: data.fileType || undefined,
        fileSizeBytes: data.fileSizeBytes ? parseInt(data.fileSizeBytes) : undefined,
      });
    },
    onSuccess: () => {
      toast({
        title: "Product Updated!",
        description: "Your product has been updated successfully.",
      });
      resetForm();
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: any) => {
      console.error("Failed to update product:", error);
      toast({
        title: "Failed to Update Product",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      return await backend.products.deleteFn({ id });
    },
    onSuccess: () => {
      toast({
        title: "Product Deleted",
        description: "Your product has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: any) => {
      console.error("Failed to delete product:", error);
      toast({
        title: "Failed to Delete Product",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priceCents: "",
      downloadUrl: "",
      previewImageUrl: "",
      fileType: "",
      fileSizeBytes: ""
    });
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description || "",
      priceCents: (product.priceCents / 100).toFixed(2),
      downloadUrl: product.downloadUrl,
      previewImageUrl: product.previewImageUrl || "",
      fileType: product.fileType || "",
      fileSizeBytes: product.fileSizeBytes ? product.fileSizeBytes.toString() : ""
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.downloadUrl || !formData.priceCents) {
      toast({
        title: "Missing Information",
        description: "Title, price, and download URL are required.",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(formData.priceCents);
    if (isNaN(price) || price < 0.50) {
      toast({
        title: "Invalid Price",
        description: "Price must be at least $0.50.",
        variant: "destructive",
      });
      return;
    }

    if (editingProduct) {
      updateProductMutation.mutate(formData);
    } else {
      createProductMutation.mutate(formData);
    }
  };

  const handleProductUpload = async (file: File) => {
    const response = await fetch("/api/uploads/product", {
      method: "POST",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Upload failed");
    }

    return await response.json();
  };

  const handlePreviewUpload = async (file: File) => {
    const response = await fetch("/api/uploads/preview", {
      method: "POST",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Upload failed");
    }

    return await response.json();
  };

  const handleProductSuccess = (result: { url: string; filename: string; downloadUrl?: string }) => {
    setFormData(prev => ({
      ...prev,
      downloadUrl: result.downloadUrl || result.url,
      fileSizeBytes: "", // Will be set based on file
      fileType: "" // Will be detected from file
    }));
  };

  const handlePreviewSuccess = (result: { url: string; filename: string }) => {
    setFormData(prev => ({
      ...prev,
      previewImageUrl: result.url
    }));
  };

  if (productsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Manage Products</CardTitle>
                <CardDescription>Add and manage your digital products</CardDescription>
              </div>
              <Button disabled className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <CardLoadingSkeleton key={i} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (productsQuery.isError) {
    return (
      <Card className="border-destructive">
        <CardContent className="text-center py-12">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Failed to load products</p>
          <p className="text-sm text-destructive">
            {productsQuery.error instanceof Error ? productsQuery.error.message : "An unexpected error occurred"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const products = productsQuery.data?.products || [];

  const ProductForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-title" : "title"}>Title *</Label>
        <Input
          id={isEdit ? "edit-title" : "title"}
          placeholder="My Digital Product"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-description" : "description"}>Description</Label>
        <Textarea
          id={isEdit ? "edit-description" : "description"}
          placeholder="Describe your product..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-priceCents" : "priceCents"}>Price (USD) *</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            id={isEdit ? "edit-priceCents" : "priceCents"}
            type="number"
            step="0.01"
            min="0.50"
            placeholder="9.99"
            className="pl-8"
            value={formData.priceCents}
            onChange={(e) => setFormData({ ...formData, priceCents: e.target.value })}
            required
          />
        </div>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Files</TabsTrigger>
          <TabsTrigger value="manual">Manual URLs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <div className="space-y-2">
            <Label>Product File *</Label>
            <FileUpload
              accept="*/*"
              maxSize={100}
              onUpload={handleProductUpload}
              onSuccess={handleProductSuccess}
              currentUrl={formData.downloadUrl}
              variant="product"
            />
            {formData.downloadUrl && (
              <p className="text-xs text-muted-foreground">
                File uploaded: {formData.downloadUrl}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Preview Image</Label>
            <FileUpload
              accept="image/*"
              maxSize={10}
              onUpload={handlePreviewUpload}
              onSuccess={handlePreviewSuccess}
              currentUrl={formData.previewImageUrl}
              variant="preview"
            />
            {formData.previewImageUrl && (
              <div className="mt-2">
                <img 
                  src={formData.previewImageUrl} 
                  alt="Preview" 
                  className="w-32 h-32 object-cover rounded border"
                />
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="manual" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={isEdit ? "edit-downloadUrl" : "downloadUrl"}>Download URL *</Label>
            <Input
              id={isEdit ? "edit-downloadUrl" : "downloadUrl"}
              placeholder="https://example.com/file.pdf"
              value={formData.downloadUrl}
              onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={isEdit ? "edit-previewImageUrl" : "previewImageUrl"}>Preview Image URL</Label>
            <Input
              id={isEdit ? "edit-previewImageUrl" : "previewImageUrl"}
              placeholder="https://example.com/preview.jpg"
              value={formData.previewImageUrl}
              onChange={(e) => setFormData({ ...formData, previewImageUrl: e.target.value })}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-downloadUrlField" : "downloadUrlField"}>Download URL *</Label>
        <Input
          id={isEdit ? "edit-downloadUrlField" : "downloadUrlField"}
          placeholder="https://example.com/download/file.pdf"
          value={formData.downloadUrl}
          onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
          required
        />
        <p className="text-xs text-muted-foreground">
          The direct URL where customers will download the product file
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={isEdit ? "edit-fileType" : "fileType"}>File Type</Label>
          <Input
            id={isEdit ? "edit-fileType" : "fileType"}
            placeholder="PDF, ZIP, etc."
            value={formData.fileType}
            onChange={(e) => setFormData({ ...formData, fileType: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={isEdit ? "edit-fileSizeBytes" : "fileSizeBytes"}>File Size (bytes)</Label>
          <Input
            id={isEdit ? "edit-fileSizeBytes" : "fileSizeBytes"}
            type="number"
            placeholder="1024000"
            value={formData.fileSizeBytes}
            onChange={(e) => setFormData({ ...formData, fileSizeBytes: e.target.value })}
          />
        </div>
      </div>

      <DialogFooter>
        <Button 
          type="submit" 
          disabled={isEdit ? updateProductMutation.isPending : createProductMutation.isPending}
          className="w-full"
        >
          {(isEdit ? updateProductMutation.isPending : createProductMutation.isPending) ? (
            <LoadingSpinner size="sm" text={isEdit ? "Updating..." : "Creating..."} />
          ) : (
            isEdit ? "Update Product" : "Create Product"
          )}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manage Products</CardTitle>
              <CardDescription>Add and manage your digital products with file uploads</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" onClick={resetForm}>
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>
                    Create a new digital product for your store. Upload files directly or provide URLs.
                  </DialogDescription>
                </DialogHeader>
                <ProductForm />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No products created yet</p>
              <p className="text-sm text-muted-foreground">Add your first product to start selling</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Card key={product.id}>
                  {product.previewImageUrl && (
                    <div className="aspect-video overflow-hidden rounded-t-lg">
                      <img
                        src={product.previewImageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">{product.title}</h3>
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-foreground">
                          ${(product.priceCents / 100).toFixed(2)}
                        </div>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {product.purchaseCount}
                        </Badge>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => deleteProductMutation.mutate(product.id)}
                          disabled={deleteProductMutation.isPending}
                        >
                          {deleteProductMutation.isPending && deleteProductMutation.variables === product.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update your product details. Upload new files or update URLs.
            </DialogDescription>
          </DialogHeader>
          <ProductForm isEdit={true} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProductsManagement() {
  return (
    <ErrorBoundary>
      <ProductsManagementContent />
    </ErrorBoundary>
  );
}
