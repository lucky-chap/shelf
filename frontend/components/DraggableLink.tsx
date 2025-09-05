import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Edit, Trash2, MousePointerClick, Calendar, Clock } from "lucide-react";

interface DraggableLinkProps {
  link: {
    id: number;
    title: string;
    url: string;
    description: string | null;
    iconUrl: string | null;
    backgroundColor: string;
    textColor: string;
    clickCount: number;
    startDate: Date | null;
    endDate: Date | null;
  };
  onEdit: (link: any) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

export default function DraggableLink({ link, onEdit, onDelete, isDeleting }: DraggableLinkProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const now = new Date();
  const isScheduled = link.startDate || link.endDate;
  const isUpcoming = link.startDate && link.startDate > now;
  const isExpired = link.endDate && link.endDate < now;
  const isActive = (!link.startDate || link.startDate <= now) && (!link.endDate || link.endDate >= now);

  const getScheduleStatus = () => {
    if (isUpcoming) return { text: "Upcoming", variant: "secondary" as const };
    if (isExpired) return { text: "Expired", variant: "destructive" as const };
    if (isScheduled && isActive) return { text: "Active", variant: "default" as const };
    return null;
  };

  const scheduleStatus = getScheduleStatus();

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
        {link.iconUrl && (
          <img src={link.iconUrl} alt="" className="h-8 w-8 rounded" />
        )}
        <div className="flex-1">
          <div className="font-medium">{link.title}</div>
          <div className="text-sm text-muted-foreground">{link.url}</div>
          {link.description && (
            <div className="text-sm text-muted-foreground mt-1">
              {link.description}
            </div>
          )}
          {isScheduled && (
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              {link.startDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Start: {new Date(link.startDate).toLocaleDateString()}
                </div>
              )}
              {link.endDate && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  End: {new Date(link.endDate).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {scheduleStatus && (
          <Badge variant={scheduleStatus.variant}>
            {scheduleStatus.text}
          </Badge>
        )}
        <Badge variant="secondary" className="flex items-center gap-1">
          <MousePointerClick className="h-3 w-3" />
          {link.clickCount}
        </Badge>
        <Button variant="ghost" size="sm" onClick={() => onEdit(link)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onDelete(link.id)}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
