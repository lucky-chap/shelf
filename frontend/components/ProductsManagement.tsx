import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, ShoppingBag, Edit, Trash2, Upload, Image, CreditCard, CheckCircle } from "lucide-react";
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
import { isStripeConfigured as isStripeConfiguredFrontend } from "../config";
import backend from "~backend/client";

interface Product {
  id: number;
  title: string;
  description: string;
  priceCents: number;
  coverUrl: string;
  downloadUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function ProductsManagementContent() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priceCents: 0,
    coverUrl: "",
    downloadUrl: ""
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const frontendStripeConfigured = isStripeConfiguredFrontend();

  const stripeStatusQuery = useQuery({
    queryKey: ["stripe", "status"],
    queryFn: async () => {
      try {
        return await backend.stripe.status();
      } catch {
        return { backendConfigured: false, secretKeyPresent: false, webhookSecretPresent: false, message: "Unavailable" };
      }
    },
    staleTime: 60_000,
  });

  const backendStripeConfigured = stripeStatusQuery.data?.backendConfigured ?? false;
  const stripeConfigured = frontendStripeConfigured && backendStripeConfigured;

  const productsQuery = useQuery({
    queryKey: ["admin-products"],
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
    mutationFn: async (data: typeof formData) => {
      return await backend.products.create(data);
    },
    onSuccess: () => {
      toast({
        title: "Product Created!",
        description: "Your new product has been added successfully.",
      });
      resetForm();
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
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
    mutationFn: async (data: typeof formData & { id: number }) => {
      return await backend.products.update(data);
    },
    onSuccess: () => {
      toast({
        title: "Product Updated!",
        description: "Your product has been updated successfully.",
      });
      resetForm();
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
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
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
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
      priceCents: 0,
      coverUrl: "",
      downloadUrl: ""
    });
    setCoverFile(null);
    setDigitalFile(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      priceCents: product.priceCents,
      coverUrl: product.coverUrl,
      downloadUrl: product.downloadUrl
    });
    setIsEditDialogOpen(true);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (file: File, type: 'cover' | 'file'): Promise<string> => {
    const base64Data = await fileToBase64(file);

    if (type === 'cover') {
      const response = await backend.products.uploadCover({
        filename: file.name,
        contentType: file.type,
        data: base64Data,
      });
      return response.url;
    } else {
      const response = await backend.products.uploadFile({
        filename: file.name,
        contentType: file.type,
        data: base64Data,
      });
      return response.downloadUrl;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Title and description are required.",
        variant: "destructive",
      });
      return;
    }

    if (formData.priceCents < 0) {
      toast({
        title: "Invalid Price",
        description: "Price cannot be negative.",
        variant: "destructive",
      });
      return;
    }

    if (formData.priceCents > 0 && formData.priceCents < 50) {
      toast({
        title: "Invalid Price",
        description: "Paid products must be at least $0.50 (Stripe minimum).",
        variant: "destructive",
      });
      return;
    }

    if (!editingProduct && (!coverFile || !digitalFile)) {
      toast({
        title: "Files Required",
        description: "Please upload both a cover image and digital file.",
        variant: "destructive",
      });
      return;
    }

    if (formData.priceCents > 0 && !stripeConfigured) {
      toast({
        title: "Stripe Not Configured",
        description: "Paid products require Stripe configuration. Set your env vars in .env and restart.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      let coverUrl = formData.coverUrl;
      let downloadUrl = formData.downloadUrl;

      // Upload new files if provided
      if (coverFile) {
        coverUrl = await handleFileUpload(coverFile, 'cover');
      }
      
      if (digitalFile) {
        downloadUrl = await handleFileUpload(digitalFile, 'file');
      }

      const productData = {
        ...formData,
        coverUrl,
        downloadUrl
      };

      if (editingProduct) {
        await updateProductMutation.mutateAsync({ ...productData, id: editingProduct.id });
      } else {
        await createProductMutation.mutateAsync(productData);
      }
    } catch (error: any) {
      console.error("Failed to upload files:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatPrice = (priceCents: number) => {
    if (priceCents === 0) return "Free";
    return `$${(priceCents / 100).toFixed(2)}`;
  };

  const handlePriceChange = (value: string) => {
    const dollars = parseFloat(value) || 0;
    const cents = Math.round(dollars * 100);
    setFormData({ ...formData, priceCents: cents });
  };

  if (productsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Digital Store</CardTitle>
                <CardDescription>Manage your digital products and downloads</CardDescription>
              </div>
              <Button disabled className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Product
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

  const ProductForm = ({ title, isSubmitting }: { title: string; isSubmitting: boolean }) => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="My Digital Product"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          placeholder="Describe your digital product..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Price (USD)</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={formData.priceCents === 0 ? "" : (formData.priceCents / 100).toFixed(2)}
          onChange={(e) => handlePriceChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Set to 0 for free downloads. Paid products must be at least $0.50.
        </p>
        {!stripeConfigured && formData.priceCents > 0 && (
          <p className="text-xs text-destructive">
            Stripe configuration required for paid products
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cover">Cover Image *</Label>
        <div className="flex items-center gap-2">
          <Input
            id="cover"
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            required={!editingProduct}
          />
          <Image className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground">
          Upload a cover image (JPG, PNG, WebP, GIF). Max 5MB.
        </p>
        {formData.coverUrl && (
          <div className="mt-2">
            <img
              src={formData.coverUrl}
              alt="Current cover"
              className="h-20 w-20 object-cover rounded border"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">Digital File *</Label>
        <div className="flex items-center gap-2">
          <Input
            id="file"
            type="file"
            onChange={(e) => setDigitalFile(e.target.files?.[0] || null)}
            required={!editingProduct}
          />
          <Upload className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground">
          Upload your digital file (PDF, ZIP, etc.). Max 50MB.
        </p>
      </div>

      <DialogFooter>
        <Button 
          type="submit" 
          disabled={isSubmitting || isUploading}
          className="w-full"
        >
          {isSubmitting || isUploading ? (
            <LoadingSpinner size="sm" text={isUploading ? "Uploading..." : `${title}...`} />
          ) : (
            title
          )}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Store Settings - Stripe Status */}
      <Card className={stripeConfigured ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Store Settings
          </CardTitle>
          <CardDescription>
            {stripeConfigured ? "Stripe is active" : "Stripe configuration required to enable paid checkout"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {stripeConfigured ? (
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span>Stripe: Configured ✅ — Digital Store is enabled.</span>
            </div>
          ) : (
            <>
              <div className="text-amber-800">
                <p className="font-medium">The Digital Store requires Stripe configuration to process payments</p>
                <p className="font-medium">Stripe Configuration Missing</p>
                <p>To enable the Digital Store feature, add these environment variables to your <code>.env</code> file:</p>
                <ul className="mt-1 ml-4 list-disc text-sm">
                  <li><code>VITE_STRIPE_PUBLISHABLE_KEY</code> (frontend)</li>
                  <li><code>STRIPE_SECRET_KEY</code> (backend)</li>
                </ul>
              </div>
              <div className="text-sm text-amber-800">
                <p className="font-medium">Current Status:</p>
                <Badge variant="secondary">Stripe: Not Configured</Badge>
              </div>
              <p className="text-sm text-amber-700">
                Note: The app will continue to work, but the Digital Store will be disabled until Stripe is configured.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Digital Store</CardTitle>
              <CardDescription>Manage your digital products and downloads</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" onClick={resetForm}>
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>
                    Create a new digital product with cover image and downloadable file
                  </DialogDescription>
                </DialogHeader>
                <ProductForm title="Create Product" isSubmitting={createProductMutation.isPending} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No products created yet</p>
              <p className="text-sm text-muted-foreground">Add your first digital product to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg overflow-hidden">
                  <div className="aspect-video bg-muted">
                    <img
                      src={product.coverUrl}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold">{product.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {product.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant={product.priceCents === 0 ? "secondary" : "default"}>
                        {formatPrice(product.priceCents)}
                      </Badge>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => deleteProductMutation.mutate(product.id)}
                          disabled={deleteProductMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update your product details, pricing, and files
            </DialogDescription>
          </DialogHeader>
          <ProductForm title="Update Product" isSubmitting={updateProductMutation.isPending} />
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
