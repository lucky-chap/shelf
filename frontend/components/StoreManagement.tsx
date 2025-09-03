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
      const base64 = result.split(",").pop() || "";
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
    return !title.trim() || !file || priceCents < 0;
  }, [title, file, priceCents]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Product file is required");
      const fileB64 = await bytesToBase64(file);
      let coverPayload: any = undefined;
      if (cover) {
        const coverB64 = await bytesToBase64(cover);
        coverPayload = {
          fileName: cover.name,
          contentType: coverB64.contentType,
          base64Data: coverB64.base64,
        };
      }

      return await backend.store.createProduct({
        title: title.trim(),
        description: description.trim() || undefined,
        priceCents,
        currency: "USD",
        productFile: {
          fileName: file.name,
          contentType: fileB64.contentType,
          base64Data: fileB64.base64,
        },
        coverImage: coverPayload,
      });
    },
    onSuccess: () => {
      toast({
        title: "Product Created",
        description: "Your product was created in Polar.",
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
      toast({
        title: "Create Failed",
        description:
          error?.message ||
          "Failed to create product. Ensure your Polar account allows product uploads.",
        variant: "destructive",
      });
    },
  });

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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the product"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
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
                        value={(priceCents / 100).toString()}
                        onChange={(e) => {
                          const dollars = Number(e.target.value || "0");
                          const cents = Math.round(dollars * 100);
                          setPriceCents(Number.isFinite(cents) ? cents : 0);
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Set to 0 for free products (buyers still go through Polar checkout)
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="file">Product File</Label>
                    <Input
                      id="file"
                      type="file"
                      accept="*/*"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileIcon className="h-4 w-4" />
                      {file ? file.name : "No file selected"}
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
                      {cover ? cover.name : "No image selected"}
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full flex items-center gap-2"
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
