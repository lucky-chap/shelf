import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, ShoppingCart, Image as ImageIcon, File as FileIcon, Plus, DollarSign } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import LoadingSpinner from "./LoadingSpinner";
import ErrorBoundary from "./ErrorBoundary";
import backend from "~backend/client";

interface StoreProduct {
  id: string;
  title: string;
  description: string | null;
  priceCents: number;
  priceCurrency: string;
  isFree: boolean;
  coverUrl: string | null;
  checkoutUrl: string | null;
}

function bytesToBase64(file: File): Promise<{ base64: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.includes(',') ? result.split(",").pop() || "" : result;
      resolve({ base64, contentType: file.type || "application/octet-stream" });
    };
    reader.readAsDataURL(file);
  });
}

function StoreManagementContent() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const configQuery = useQuery({
    queryKey: ["store", "config"],
    queryFn: async () => await backend.store.isConfigured(),
    staleTime: 5 * 60 * 1000,
  });

  const productsQuery = useQuery({
    queryKey: ["store", "products"],
    queryFn: async () => {
      const res = await backend.store.listProducts();
      return res.products as StoreProduct[];
    },
    enabled: !!configQuery.data?.enabled,
    staleTime: 60 * 1000,
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceCents, setPriceCents] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);

  const isDisabled = useMemo(() => {
    return !title.trim() || !file || priceCents < 0 || !Number.isInteger(priceCents);
  }, [title, file, priceCents]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!file) {
        throw new Error("Product file is required");
      }
      
      if (!title.trim()) {
        throw new Error("Product title is required");
      }
      
      if (priceCents < 0) {
        throw new Error("Price cannot be negative");
      }
      
      if (!Number.isInteger(priceCents)) {
        throw new Error("Price must be a whole number");
      }

      try {
        // Convert product file to base64
        const fileB64 = await bytesToBase64(file);
        
        // Validate that we got valid base64 data
        if (!fileB64.base64 || fileB64.base64.trim().length === 0) {
          throw new Error("Failed to convert file to base64");
        }

        // Test if base64 is valid
        try {
          const testBuffer = Buffer.from(fileB64.base64, 'base64');
          if (testBuffer.length === 0) {
            throw new Error("Invalid base64 data generated");
          }
        } catch (error) {
          throw new Error("Generated base64 data is invalid");
        }

        // Prepare cover image if provided
        let coverPayload = undefined;
        if (cover) {
          try {
            const coverB64 = await bytesToBase64(cover);
            
            // Only include cover if we got valid base64 data
            if (coverB64.base64 && coverB64.base64.trim().length > 0) {
              // Test if cover base64 is valid
              try {
                const testBuffer = Buffer.from(coverB64.base64, 'base64');
                if (testBuffer.length > 0) {
                  coverPayload = {
                    fileName: cover.name.trim(),
                    contentType: coverB64.contentType || "image/jpeg",
                    base64Data: coverB64.base64,
                  };
                }
              } catch (error) {
                console.warn("Invalid cover base64 data, skipping cover image");
              }
            }
          } catch (coverError) {
            console.warn("Failed to process cover image, proceeding without it:", coverError);
            // Continue without cover image
          }
        }

        // Prepare the payload with strict validation
        const payload = {
          title: title.trim(),
          description: description.trim() || undefined,
          priceCents: Math.round(priceCents), // Ensure it's an integer
          currency: "USD",
          productFile: {
            fileName: file.name.trim(),
            contentType: fileB64.contentType || "application/octet-stream",
            base64Data: fileB64.base64,
          },
          coverImage: coverPayload,
        };

        // Validate payload structure before sending
        if (!payload.title) {
          throw new Error("Title is required");
        }
        
        if (typeof payload.priceCents !== 'number' || payload.priceCents < 0) {
          throw new Error("Invalid price");
        }
        
        if (!payload.productFile.fileName || !payload.productFile.base64Data || !payload.productFile.contentType) {
          throw new Error("Invalid product file data");
        }

        return await backend.store.createProduct(payload);
      } catch (error: any) {
        console.error("Error preparing product data:", error);
        throw error; // Re-throw the original error instead of wrapping it
      }
    },
    onSuccess: () => {
      toast({
        title: "Product Created",
        description: "Your product was created in Polar successfully.",
      });
      setTitle("");
      setDescription("");
      setPriceCents(0);
      setFile(null);
      setCover(null);
      qc.invalidateQueries({ queryKey: ["store", "products"] });
    },
    onError: (error: any) => {
      console.error("Create product failed:", error);
      
      let errorMessage = "Failed to create product. Please try again.";
      
      if (error?.message) {
        // Check for specific validation errors
        if (error.message.includes("title")) {
          errorMessage = "Product title is invalid. Please check your title and try again.";
        } else if (error.message.includes("priceCents")) {
          errorMessage = "Product price is invalid. Please enter a valid price.";
        } else if (error.message.includes("productFile")) {
          errorMessage = "Product file is invalid. Please select a valid file.";
        } else if (error.message.includes("base64")) {
          errorMessage = "File upload failed. Please try selecting the file again.";
        } else if (error.message.includes("validation") || error.message.includes("invalid_argument")) {
          errorMessage = "Invalid product data. Please check all fields and try again.";
        } else if (error.message.includes("Polar")) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Create Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriceCents(0);
    setFile(null);
    setCover(null);
  };

  if (!configQuery.data?.enabled) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Store (Polar)</CardTitle>
          <CardDescription>
            Configure POLAR_API_KEY and POLAR_ORGANIZATION_ID to enable the store.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            The store UI is hidden until Polar credentials are present.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <CardDescription>Products fetched from your Polar account</CardDescription>
            </CardHeader>
            <CardContent>
              {productsQuery.isLoading ? (
                <div className="py-8">
                  <LoadingSpinner text="Loading products..." />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(productsQuery.data || []).map((p) => (
                    <div key={p.id} className="border rounded-lg overflow-hidden">
                      {p.coverUrl && (
                        <img
                          src={p.coverUrl}
                          alt={p.title}
                          className="w-full h-36 object-cover"
                        />
                      )}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">{p.title}</div>
                          <Badge variant={p.isFree ? "secondary" : "outline"}>
                            {p.isFree
                              ? "Free"
                              : new Intl.NumberFormat(undefined, {
                                  style: "currency",
                                  currency: p.priceCurrency,
                                }).format((p.priceCents || 0) / 100)}
                          </Badge>
                        </div>
                        {p.description && (
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {p.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {(productsQuery.data || []).length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      No products yet. Create one in the Create tab.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create Product</CardTitle>
              <CardDescription>
                Upload a digital file, optional cover image, and set a minimum price (0 for free)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!isDisabled) createMutation.mutate();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Product title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={200}
                  />
                  <div className="text-xs text-muted-foreground">
                    {title.length}/200 characters
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the product"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    maxLength={1000}
                  />
                  <div className="text-xs text-muted-foreground">
                    {description.length}/1000 characters
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (USD, in dollars)</Label>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        min={0}
                        step="0.01"
                        value={(priceCents / 100).toFixed(2)}
                        onChange={(e) => {
                          const dollars = parseFloat(e.target.value || "0");
                          const cents = Math.round(dollars * 100);
                          setPriceCents(Number.isFinite(cents) && cents >= 0 ? cents : 0);
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Set to 0.00 for free products (buyers still go through Polar checkout)
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="file">Product File *</Label>
                    <Input
                      id="file"
                      type="file"
                      accept="*/*"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      required
                    />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileIcon className="h-4 w-4" />
                      {file ? (
                        <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      ) : (
                        "No file selected"
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cover">Cover Image (optional)</Label>
                    <Input
                      id="cover"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCover(e.target.files?.[0] || null)}
                    />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ImageIcon className="h-4 w-4" />
                      {cover ? (
                        <span>{cover.name} ({(cover.size / 1024 / 1024).toFixed(2)} MB)</span>
                      ) : (
                        "No image selected"
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="flex-1 flex items-center gap-2"
                    disabled={isDisabled || createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <LoadingSpinner size="sm" text="Creating..." />
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Create Product
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={createMutation.isPending}
                  >
                    Reset
                  </Button>
                </div>
                
                {isDisabled && (
                  <div className="text-xs text-muted-foreground">
                    Please fill in the title, select a file, and ensure the price is valid.
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function StoreManagement() {
  return (
    <ErrorBoundary>
      <StoreManagementContent />
    </ErrorBoundary>
  );
}
