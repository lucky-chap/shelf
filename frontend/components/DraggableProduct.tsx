import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Edit, Trash2, Download, FileText } from "lucide-react";

interface DraggableProductProps {
  product: {
    id: number;
    title: string;
    description: string | null;
    priceCents: number;
    coverImageUrl: string | null;
    fileName: string;
    fileSize: number;
    downloadCount: number;
  };
  onEdit: (product: any) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  formatPrice: (priceCents: number) => string;
  formatFileSize: (bytes: number) => string;
}

export default function DraggableProduct({ 
  product, 
  onEdit, 
  onDelete, 
  isDeleting, 
  formatPrice, 
  formatFileSize 
}: DraggableProductProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border rounded-lg p-4 flex items-center justify-between bg-card"
    >
      <div className="flex items-center gap-3 flex-1">
        <Button
          variant="ghost"
          size="sm"
          className="cursor-grab active:cursor-grabbing p-1"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </Button>
        
        {product.coverImageUrl ? (
          <img src={product.coverImageUrl} alt="" className="h-12 w-12 rounded object-cover" />
        ) : (
          <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        
        <div className="flex-1">
          <div className="font-medium">{product.title}</div>
          {product.description && (
            <div className="text-sm text-muted-foreground line-clamp-1">
              {product.description}
            </div>
          )}
          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
            <span>{formatFileSize(product.fileSize)}</span>
            <div className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              {product.downloadCount}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={product.priceCents === 0 ? "secondary" : "default"}>
          {formatPrice(product.priceCents)}
        </Badge>
        <Button variant="ghost" size="sm" onClick={() => onEdit(product)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onDelete(product.id)}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
