import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Download } from "lucide-react";
import PaymentDialog from "./PaymentDialog";
import backend from "~backend/client";

export default function ProductsList() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      return await backend.products.list();
    },
  });

  if (productsQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Digital Store</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading products...</p>
        </CardContent>
      </Card>
    );
  }

  const products = productsQuery.data?.products || [];

  if (products.length === 0) {
    return null;
  }

  const handlePurchaseClick = (product: any) => {
    setSelectedProduct(product);
    setIsPaymentDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Digital Store
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                {product.previewImageUrl && (
                  <div className="aspect-video overflow-hidden">
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
                      <div className="text-lg font-bold text-foreground">
                        ${(product.priceCents / 100).toFixed(2)}
                      </div>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {product.purchaseCount}
                      </Badge>
                    </div>
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => handlePurchaseClick(product)}
                    >
                      Purchase
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <PaymentDialog
        product={selectedProduct}
        isOpen={isPaymentDialogOpen}
        onClose={() => {
          setIsPaymentDialogOpen(false);
          setSelectedProduct(null);
        }}
      />
    </>
  );
}
