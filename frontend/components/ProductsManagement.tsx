import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ShoppingBag,
  Edit,
  Trash2,
  Upload,
  Image as ImageIcon,
  FileText,
  DollarSign,
} from "lucide-react";
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
import DraggableProduct from "./DraggableProduct";
import { CardLoadingSkeleton } from "./LoadingSkeleton";
import LoadingSpinner from "./LoadingSpinner";
import ErrorBoundary from "./ErrorBoundary";
import { isStripeConfigured } from "../config";
import React from "react";
import backend from "~backend/client";
import { truncateMiddle } from "@/utils/tools";
import { useStripePublishableKey } from "@/hooks/useStripe";

interface ProductFormData {
  title: string;
  description: string;
  priceCents: number;
  coverImageUrl: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

interface FileUploadState {
  file: File | null;
  uploading: boolean;
}

interface ProductFormProps {
  formData: ProductFormData;
  onInputChange: (field: string, value: string | number) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  title: string;
  editingProduct: any;
  fileUpload: FileUploadState;
  coverImageUpload: FileUploadState;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCoverImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formatFileSize: (bytes: number) => string;
}

const ProductForm = React.memo<ProductFormProps>(
  ({
    formData,
    onInputChange,
    onSubmit,
    isSubmitting,
    title,
    editingProduct,
    fileUpload,
    coverImageUpload,
    onFileSelect,
    onCoverImageSelect,
    formatFileSize,
  }) => {
    const {
      data: stripePublishableKey,
      isLoading,
      error,
    } = useStripePublishableKey();
    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            placeholder="My Digital Product"
            value={formData.title}
            onChange={(e) => onInputChange("title", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe your product..."
            value={formData.description}
            onChange={(e) => onInputChange("description", e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">$</span>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.priceCents / 100}
              onChange={(e) =>
                onInputChange(
                  "priceCents",
                  Math.round(parseFloat(e.target.value || "0") * 100)
                )
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Set to $0.00 for free products. Paid products must be at least
            $1.00.
            {/* {!isStripeConfigured() && (
            <span className="text-destructive">
              {" "}
              (Stripe not configured - only free products will work)
            </span>
          )} */}
            {stripePublishableKey == undefined ||
              (typeof stripePublishableKey !== "string" && (
                <span className="text-destructive">
                  {" "}
                  (Stripe not configured - only free products will work)
                </span>
              ))}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Product File *</Label>
          {editingProduct ? (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{formData.fileName}</span>
                <Badge variant="secondary">
                  {formatFileSize(formData.fileSize)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Product files cannot be changed after creation. To use a
                different file, create a new product.
              </p>
            </div>
          ) : (
            <>
              <Input
                type="file"
                onChange={onFileSelect}
                disabled={fileUpload.uploading}
                accept=".pdf,.zip,.png,.jpg,.jpeg,.gif,.mp4,.mp3,.txt,.doc,.docx,.xls,.xlsx"
              />
              {fileUpload.uploading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoadingSpinner size="sm" />
                  Uploading file...
                </div>
              )}
              {formData.fileUrl && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium line-clamp-1">
                      {truncateMiddle(formData.fileName, 20)}
                    </span>
                    <Badge variant="secondary">
                      {formatFileSize(formData.fileSize)}
                    </Badge>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-2">
          <Label>Cover Image (Optional)</Label>
          <Input
            type="file"
            onChange={onCoverImageSelect}
            disabled={coverImageUpload.uploading}
            accept="image/*"
          />
          {coverImageUpload.uploading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoadingSpinner size="sm" />
              Uploading cover image...
            </div>
          )}
          {formData.coverImageUrl && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded overflow-hidden">
                  <img
                    src={formData.coverImageUrl}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  Cover image uploaded
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="submit"
            disabled={isSubmitting || (!editingProduct && !formData.fileUrl)}
            className="w-full"
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" text={`${title}...`} />
            ) : (
              title
            )}
          </Button>
        </DialogFooter>
      </form>
    );
  }
);

ProductForm.displayName = "ProductForm";

function ProductsManagementContent() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    description: "",
    priceCents: 0,
    coverImageUrl: "",
    fileUrl: "",
    fileName: "",
    fileSize: 0,
  });
  const [fileUpload, setFileUpload] = useState<FileUploadState>({
    file: null,
    uploading: false,
  });
  const [coverImageUpload, setCoverImageUpload] = useState<FileUploadState>({
    file: null,
    uploading: false,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const productsQuery = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      try {
        const result = await backend.store.listAllProducts();
        return { products: result.products || [] };
      } catch (error: any) {
        console.error("Failed to fetch products:", error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const reader = new FileReader();
      return new Promise<any>((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64Content = reader.result?.toString().split(",")[1];
            if (!base64Content) throw new Error("Failed to read file");

            const result = await backend.store.uploadFile({
              fileName: file.name,
              fileContent: base64Content,
              // headers: {
              //   "Content-Type": file.type,
              //   "Content-Length": file.size.toString(),
              // },
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
      setFormData((prev) => ({
        ...prev,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
      }));
      setFileUpload({ file: null, uploading: false });
      toast({
        title: "File Uploaded",
        description: `${data.fileName} uploaded successfully.`,
      });
    },
    onError: (error: any) => {
      console.error("File upload failed:", error);
      setFileUpload((prev) => ({ ...prev, uploading: false }));
      toast({
        title: "Upload Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const uploadCoverImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const reader = new FileReader();
      return new Promise<any>((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64Content = reader.result?.toString().split(",")[1];
            if (!base64Content) throw new Error("Failed to read file");

            const result = await backend.store.uploadCoverImage({
              fileName: file.name,
              imageContent: base64Content,
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
      setFormData((prev) => ({
        ...prev,
        coverImageUrl: data.imageUrl,
      }));
      setCoverImageUpload({ file: null, uploading: false });
      toast({
        title: "Cover Image Uploaded",
        description: "Cover image uploaded successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Cover image upload failed:", error);
      setCoverImageUpload((prev) => ({ ...prev, uploading: false }));
      toast({
        title: "Upload Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      return await backend.store.createProduct(data);
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
    mutationFn: async (data: ProductFormData & { id: number }) => {
      return await backend.store.updateProduct(data);
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
      return await backend.store.deleteProduct({ id });
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

  const reorderProductsMutation = useMutation({
    mutationFn: async (productIds: number[]) => {
      return await backend.store.reorderProducts({ productIds });
    },
    onSuccess: () => {
      toast({
        title: "Products Reordered",
        description: "Your product order has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: any) => {
      console.error("Failed to reorder products:", error);
      toast({
        title: "Failed to Reorder Products",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      description: "",
      priceCents: 0,
      coverImageUrl: "",
      fileUrl: "",
      fileName: "",
      fileSize: 0,
    });
    setFileUpload({ file: null, uploading: false });
    setCoverImageUpload({ file: null, uploading: false });
  }, []);

  const handleEdit = useCallback((product: any) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description || "",
      priceCents: product.priceCents,
      coverImageUrl: product.coverImageUrl || "",
      fileUrl: product.fileUrl || "",
      fileName: product.fileName,
      fileSize: product.fileSize,
    });
    setIsEditDialogOpen(true);
  }, []);

  const handleInputChange = useCallback(
    (field: string, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFileUpload({ file, uploading: true });
        uploadFileMutation.mutate(file);
      }
    },
    [uploadFileMutation]
  );

  const handleCoverImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setCoverImageUpload({ file, uploading: true });
        uploadCoverImageMutation.mutate(file);
      }
    },
    [uploadCoverImageMutation]
  );

  const handleCreateSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.title || !formData.fileUrl) {
        toast({
          title: "Missing Information",
          description: "Title and file are required.",
          variant: "destructive",
        });
        return;
      }

      // Validate price
      if (formData.priceCents < 0) {
        toast({
          title: "Invalid Price",
          description: "Price cannot be negative.",
          variant: "destructive",
        });
        return;
      }

      if (formData.priceCents > 0 && formData.priceCents < 100) {
        toast({
          title: "Invalid Price",
          description: "Paid products must be at least $1.00.",
          variant: "destructive",
        });
        return;
      }

      createProductMutation.mutate(formData);
    },
    [formData, createProductMutation, toast]
  );

  const handleEditSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.title || !editingProduct) {
        toast({
          title: "Missing Information",
          description: "Title is required.",
          variant: "destructive",
        });
        return;
      }

      // Validate price
      if (formData.priceCents < 0) {
        toast({
          title: "Invalid Price",
          description: "Price cannot be negative.",
          variant: "destructive",
        });
        return;
      }

      if (formData.priceCents > 0 && formData.priceCents < 100) {
        toast({
          title: "Invalid Price",
          description: "Paid products must be at least $1.00.",
          variant: "destructive",
        });
        return;
      }

      updateProductMutation.mutate({ ...formData, id: editingProduct.id });
    },
    [formData, editingProduct, updateProductMutation, toast]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      const products = productsQuery.data?.products || [];
      const oldIndex = products.findIndex(
        (product) => product.id === active.id
      );
      const newIndex = products.findIndex((product) => product.id === over.id);

      const reorderedProducts = arrayMove(products, oldIndex, newIndex);
      const productIds = reorderedProducts.map((product) => product.id);

      queryClient.setQueryData(["admin-products"], {
        products: reorderedProducts,
      });

      reorderProductsMutation.mutate(productIds);
    }
  };

  const formatPrice = (priceCents: number) => {
    if (priceCents === 0) return "Free";
    return `$${(priceCents / 100).toFixed(2)}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (productsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Manage Products</CardTitle>
                <CardDescription>
                  Create and manage your digital products for sale. Drag and
                  drop to reorder.
                </CardDescription>
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
            {productsQuery.error instanceof Error
              ? productsQuery.error.message
              : "An unexpected error occurred"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const products = productsQuery.data?.products || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manage Products</CardTitle>
              <CardDescription>
                Create and manage your digital products for sale. Drag and drop
                to reorder.
              </CardDescription>
            </div>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
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
                    Create a new digital product for your store
                  </DialogDescription>
                </DialogHeader>
                <ProductForm
                  formData={formData}
                  onInputChange={handleInputChange}
                  onSubmit={handleCreateSubmit}
                  isSubmitting={createProductMutation.isPending}
                  title="Create Product"
                  editingProduct={editingProduct}
                  fileUpload={fileUpload}
                  coverImageUpload={coverImageUpload}
                  onFileSelect={handleFileSelect}
                  onCoverImageSelect={handleCoverImageSelect}
                  formatFileSize={formatFileSize}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No products created yet</p>
              <p className="text-sm text-muted-foreground">
                Add your first digital product to get started
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            >
              <SortableContext
                items={products}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {products.map((product) => (
                    <DraggableProduct
                      key={product.id}
                      product={product}
                      onEdit={handleEdit}
                      onDelete={(id) => deleteProductMutation.mutate(id)}
                      isDeleting={deleteProductMutation.isPending}
                      formatPrice={formatPrice}
                      formatFileSize={formatFileSize}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update your product details</DialogDescription>
          </DialogHeader>
          <ProductForm
            formData={formData}
            onInputChange={handleInputChange}
            onSubmit={handleEditSubmit}
            isSubmitting={updateProductMutation.isPending}
            title="Update Product"
            editingProduct={editingProduct}
            fileUpload={fileUpload}
            coverImageUpload={coverImageUpload}
            onFileSelect={handleFileSelect}
            onCoverImageSelect={handleCoverImageSelect}
            formatFileSize={formatFileSize}
          />
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
