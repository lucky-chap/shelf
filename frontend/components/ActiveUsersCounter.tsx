import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import backend from "~backend/client";

export default function ActiveUsersCounter() {
  const activeUsersQuery = useQuery({
    queryKey: ["analytics", "active-users"],
    queryFn: async () => {
      try {
        return await backend.analytics.getActiveUsers();
      } catch (error: any) {
        console.error("Failed to fetch active users:", error);
        return { activeUsers: 0 };
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 1,
    retryDelay: 5000,
  });

  const activeUsers = activeUsersQuery.data?.activeUsers || 0;

  if (activeUsers === 0) {
    return null; // Don't show counter if no active users
  }

  return (
    <Badge 
      variant="secondary" 
      className="flex items-center gap-1 backdrop-blur-sm bg-white/10 border-white/20 text-current"
    >
      <Users className="h-3 w-3" />
      <span className="text-xs">
        {activeUsers} {activeUsers === 1 ? 'user' : 'users'} online
      </span>
    </Badge>
  );
}
