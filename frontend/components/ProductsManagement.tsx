import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, ShoppingBag, Edit, Trash2, Download, ExternalLink } from "lucide-react";
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
    previewImageUrl: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        return await backend.products.list();
      } catch (error: any) {
        console.error("Failed to fetch products:", error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      return await backend.products.create({
        title: data.title,
        description: data.description || undefined,
        priceCents: parseInt(data.priceCents) || 0,
        downloadUrl: data.downloadUrl,
        previewImageUrl: data.previewImageUrl || undefined,
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
        priceCents: parseInt(data.priceCents) || 0,
        downloadUrl: data.downloadUrl,
        previewImageUrl: data.previewImageUrl || undefined,
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
      previewImageUrl: ""
    });
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description || "",
      priceCents: (product.priceCents / 100).toFixed(2),
      downloadUrl: product.downloadUrl,
      previewImageUrl: product.previewImageUrl || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.downloadUrl) {
      toast({
        title: "Missing Information",
        description: "Title and download URL are required.",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(formData.priceCents) || 0;
    if (price < 0) {
      toast({
        title: "Invalid Price",
        description: "Price cannot be negative.",
        variant: "destructive",
      });
      return;
    }

    // Validate URLs
    try {
      new URL(formData.downloadUrl);
    } catch (error) {
      toast({
        title: "Invalid Download URL",
        description: "Please enter a valid download URL.",
        variant: "destructive",
      });
      return;
    }

    if (formData.previewImageUrl) {
      try {
        new URL(formData.previewImageUrl);
      } catch (error) {
        toast({
          title: "Invalid Preview URL",
          description: "Please enter a valid preview image URL.",
          variant: "destructive",
        });
        return;
      }
    }

    // Convert price to cents
    const formDataWithCents = {
      ...formData,
      priceCents: (price * 100).toString()
    };

    if (editingProduct) {
      updateProductMutation.mutate(formDataWithCents);
    } else {
      createProductMutation.mutate(formDataWithCents);
    }
  };

  if (productsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Manage Products</CardTitle>
                <CardDescription>Add and manage your digital products with external URLs</CardDescription>
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
        <Label htmlFor={isEdit ? "edit-priceCents" : "priceCents"}>Price (USD)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            id={isEdit ? "edit-priceCents" : "priceCents"}
            type="number"
            step="0.01"
            min="0"
            placeholder="9.99 (or 0 for free)"
            className="pl-8"
            value={formData.priceCents}
            onChange={(e) => setFormData({ ...formData, priceCents: e.target.value })}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Set to 0 for free products. Paid products must be at least $0.50 due to Stripe requirements.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-downloadUrl" : "downloadUrl"}>Download URL *</Label>
        <Input
          id={isEdit ? "edit-downloadUrl" : "downloadUrl"}
          placeholder="https://example.com/file.pdf"
          value={formData.downloadUrl}
          onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
          required
        />
        <p className="text-xs text-muted-foreground">
          Direct URL where customers will download the product file
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-previewImageUrl" : "previewImageUrl"}>Preview Image URL</Label>
        <Input
          id={isEdit ? "edit-previewImageUrl" : "previewImageUrl"}
          placeholder="https://example.com/preview.jpg"
          value={formData.previewImageUrl}
          onChange={(e) => setFormData({ ...formData, previewImageUrl: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Optional preview image URL to display on the product card
        </p>
        {formData.previewImageUrl && (
          <div className="mt-2">
            <img 
              src={formData.previewImageUrl} 
              alt="Preview" 
              className="w-32 h-32 object-cover rounded border"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
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
              <CardDescription>Add and manage your digital products using external URLs. Support for both free and paid products.</CardDescription>
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
                    Create a new digital product for your store using external URLs. Set price to $0 for free products.
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
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
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
                          {product.priceCents === 0 ? (
                            <Badge variant="secondary">Free</Badge>
                          ) : (
                            `$${(product.priceCents / 100).toFixed(2)}`
                          )}
                        </div>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {product.purchaseCount}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate">{product.downloadUrl}</span>
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
              Update your product details using external URLs. Set price to $0 for free products.
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
