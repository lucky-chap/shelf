import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Image as ImageIcon, DollarSign, Package, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import LoadingSpinner from "./LoadingSpinner";
import ErrorBoundary from "./ErrorBoundary";
import backend from "~backend/client";

interface AdminProduct {
  id: number;
  title: string;
  description: string | null;
  priceCents: number;
  currency: string;
  coverUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

function bytesToMB(b: number) {
  return b / (1024 * 1024);
}

async function uploadToSignedUrl(url: string, file: File) {
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });
  if (!res.ok) {
    throw new Error(`Upload failed with status ${res.status}`);
  }
}

function StoreAdminContent() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceCents, setPriceCents] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const productsQuery = useQuery({
    queryKey: ["store", "admin", "products"],
    queryFn: async () => {
      const res = await backend.store.listProductsAdmin();
      return res.products as AdminProduct[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Please select a digital file to upload.");
      if (bytesToMB(file.size) > 100) {
        throw new Error("File too large. Max 100 MB.");
      }
      if (cover && bytesToMB(cover.size) > 5) {
        throw new Error("Cover image too large. Max 5 MB.");
      }

      setIsUploading(true);

      // 1) Request signed upload URLs
      const uploadUrls = await backend.store.getUploadUrls({
        fileName: file.name,
        fileContentType: file.type || "application/octet-stream",
        coverFileName: cover?.name,
        coverContentType: cover?.type,
      });

      // 2) Upload files directly to storage
      await uploadToSignedUrl(uploadUrls.file.url, file);
      if (uploadUrls.cover && cover) {
        await uploadToSignedUrl(uploadUrls.cover.url, cover);
      }

      // 3) Create product
      const created = await backend.store.createProduct({
        title,
        description: description || undefined,
        priceCents,
        fileObjectName: uploadUrls.file.objectName,
        coverObjectName: uploadUrls.cover?.objectName,
      });

      return created;
    },
    onSuccess: () => {
      toast({
        title: "Product Created",
        description: "Your digital product has been added.",
      });
      setTitle("");
      setDescription("");
      setPriceCents(0);
      setFile(null);
      setCover(null);
      qc.invalidateQueries({ queryKey: ["store", "admin", "products"] });
    },
    onError: (err: any) => {
      console.error(err);
      toast({
        title: "Create Failed",
        description: err?.message || "Unable to create product.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Add Product
          </CardTitle>
          <CardDescription>Upload a digital file (max 100MB), optional cover (max 5MB), and set price.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., E-book: Growth Guide" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (cents)</Label>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step={1}
                  value={priceCents}
                  onChange={(e) => setPriceCents(parseInt(e.target.value || "0", 10))}
                  placeholder="e.g., 999 for $9.99"
                />
              </div>
              <p className="text-xs text-muted-foreground">Set 0 for free download</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Digital File (max 100MB)</Label>
              <div className="flex items-center gap-2">
                <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              {file && <p className="text-xs text-muted-foreground">Selected: {file.name} ({bytesToMB(file.size).toFixed(2)} MB)</p>}
            </div>
            <div className="space-y-2">
              <Label>Cover Image (max 5MB)</Label>
              <div className="flex items-center gap-2">
                <Input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] || null)} />
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              {cover && <p className="text-xs text-muted-foreground">Selected: {cover.name} ({bytesToMB(cover.size).toFixed(2)} MB)</p>}
            </div>
          </div>

          <Button className="w-full" onClick={() => createMutation.mutate()} disabled={isUploading || !title || !file}>
            {isUploading ? <LoadingSpinner size="sm" text="Uploading & Creating..." /> : "Create Product"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>All products in your store</CardDescription>
        </CardHeader>
        <CardContent>
          {productsQuery.isLoading ? (
            <div className="text-center py-8">
              <LoadingSpinner text="Loading products..." />
            </div>
          ) : productsQuery.isError ? (
            <div className="text-center py-8 text-destructive">Failed to load products</div>
          ) : (
            <div className="space-y-3">
              {productsQuery.data?.length === 0 && <p className="text-muted-foreground">No products yet</p>}
              {productsQuery.data?.map((p) => (
                <div key={p.id} className="border rounded-lg p-4 flex items-center justify-between bg-card">
                  <div className="flex items-center gap-3">
                    {p.coverUrl && <img src={p.coverUrl} alt="" className="h-12 w-12 rounded object-cover border" />}
                    <div>
                      <div className="font-medium">{p.title}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-[40ch]">{p.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{p.priceCents === 0 ? "Free" : `$${(p.priceCents / 100).toFixed(2)}`}</Badge>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
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

export default function StoreAdmin() {
  return (
    <ErrorBoundary>
      <StoreAdminContent />
    </ErrorBoundary>
  );
}
