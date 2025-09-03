import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface DownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  downloadUrl: string | null;
}

export default function DownloadDialog({ open, onOpenChange, title, downloadUrl }: DownloadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thank you!</DialogTitle>
          <DialogDescription>
            {title}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          <p className="text-sm text-muted-foreground mb-4">
            Your download is ready. Click the button below to start downloading.
          </p>
          <Button asChild disabled={!downloadUrl} className="flex items-center gap-2">
            <a href={downloadUrl || "#"} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" />
              Download
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
