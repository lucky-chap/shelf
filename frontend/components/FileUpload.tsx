import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, FileText, Image } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import LoadingSpinner from "./LoadingSpinner";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in MB
  onUpload: (file: File) => Promise<{ url: string; filename: string }>;
  onSuccess?: (result: { url: string; filename: string }) => void;
  onError?: (error: string) => void;
  currentUrl?: string;
  className?: string;
  children?: React.ReactNode;
  variant?: "avatar" | "product" | "preview";
}

export default function FileUpload({
  accept = "image/*",
  maxSize = 10,
  onUpload,
  onSuccess,
  onError,
  currentUrl,
  className,
  children,
  variant = "preview"
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      const error = `File size must be less than ${maxSize}MB`;
      toast({
        title: "File Too Large",
        description: error,
        variant: "destructive",
      });
      onError?.(error);
      return;
    }

    // Validate file type if accept is specified
    if (accept && !file.type.match(accept.replace(/\*/g, ".*"))) {
      const error = `Invalid file type. Expected: ${accept}`;
      toast({
        title: "Invalid File Type",
        description: error,
        variant: "destructive",
      });
      onError?.(error);
      return;
    }

    setIsUploading(true);

    try {
      const result = await onUpload(file);
      toast({
        title: "Upload Successful",
        description: `${file.name} has been uploaded successfully.`,
      });
      onSuccess?.(result);
    } catch (error: any) {
      console.error("Upload failed:", error);
      const errorMessage = error.message || "Upload failed. Please try again.";
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
      onError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const getIcon = () => {
    switch (variant) {
      case "avatar":
        return <Image className="h-8 w-8" />;
      case "product":
        return <FileText className="h-8 w-8" />;
      case "preview":
        return <Image className="h-8 w-8" />;
      default:
        return <Upload className="h-8 w-8" />;
    }
  };

  const getAcceptText = () => {
    if (accept.includes("image")) return "images";
    if (accept.includes("pdf")) return "PDF files";
    return "files";
  };

  if (children) {
    return (
      <div className={className}>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
          disabled={isUploading}
        />
        <div onClick={handleClick} className="cursor-pointer">
          {children}
        </div>
        {isUploading && (
          <div className="mt-2">
            <LoadingSpinner size="sm" text="Uploading..." />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        disabled={isUploading}
      />
      
      <Card
        className={cn(
          "border-2 border-dashed cursor-pointer transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          isUploading && "pointer-events-none opacity-50"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            {isUploading ? (
              <LoadingSpinner size="lg" text="Uploading..." />
            ) : (
              <>
                <div className="text-muted-foreground">
                  {getIcon()}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getAcceptText()} up to {maxSize}MB
                  </p>
                </div>
                {currentUrl && (
                  <div className="text-xs text-muted-foreground">
                    Current file uploaded
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
