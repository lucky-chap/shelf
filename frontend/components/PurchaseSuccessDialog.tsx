import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Gift } from "lucide-react";

interface PurchaseSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseData: {
    product: any;
    downloadUrl: string;
    downloadToken?: string;
    amount: number;
    isFree: boolean;
  } | null;
}

export default function PurchaseSuccessDialog({ 
  isOpen, 
  onClose, 
  purchaseData 
}: PurchaseSuccessDialogProps) {
  if (!purchaseData) return null;

  const { product, downloadUrl, amount, isFree } = purchaseData;

  const handleDownload = () => {
    // Open download URL in new tab
    window.open(downloadUrl, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isFree ? (
              <>
                <Gift className="h-5 w-5 text-green-500" />
                Download Ready!
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Purchase Successful!
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isFree 
              ? `Your free download of ${product.title} is ready`
              : `Thank you for your purchase of ${product.title}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="flex justify-center mb-2">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h3 className="font-semibold text-green-800">{product.title}</h3>
            {product.description && (
              <p className="text-sm text-green-700 mt-1">
                {product.description}
              </p>
            )}
            {!isFree && (
              <div className="text-lg font-bold text-green-800 mt-2">
                ${(amount).toFixed(2)} paid
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Button onClick={handleDownload} className="w-full flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Now
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full">
              Close
            </Button>
          </div>

          {!isFree && (
            <p className="text-xs text-muted-foreground text-center">
              You'll receive an email confirmation shortly. The download link will remain valid for 30 days.
            </p>
          )}

          {isFree && (
            <p className="text-xs text-muted-foreground text-center">
              Enjoy your free download! Share the love if you find it useful.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
