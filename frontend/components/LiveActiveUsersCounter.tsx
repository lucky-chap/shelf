import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Users, Wifi, WifiOff } from "lucide-react";
import { LiveVisitorTracker } from "../utils/liveVisitors";

interface LiveActiveUsersCounterProps {
  page?: string;
}

export default function LiveActiveUsersCounter({ page = "/" }: LiveActiveUsersCounterProps) {
  const [activeUsers, setActiveUsers] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const trackerRef = useRef<LiveVisitorTracker | null>(null);

  useEffect(() => {
    // Initialize tracker
    trackerRef.current = new LiveVisitorTracker((count) => {
      setActiveUsers(count);
    });

    // Connect to live stream
    const connect = async () => {
      if (trackerRef.current) {
        await trackerRef.current.connect(page);
        setIsConnected(trackerRef.current.isConnectionActive());
      }
    };

    connect();

    // Monitor connection status
    const statusInterval = setInterval(() => {
      if (trackerRef.current) {
        setIsConnected(trackerRef.current.isConnectionActive());
      }
    }, 5000);

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, keep connection but reduce heartbeat frequency
        console.log("Page hidden - maintaining connection");
      } else {
        // Page is visible again
        console.log("Page visible - resuming normal operation");
        if (trackerRef.current && !trackerRef.current.isConnectionActive()) {
          connect();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      clearInterval(statusInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      
      if (trackerRef.current) {
        trackerRef.current.disconnect();
      }
    };
  }, [page]);

  // Update page when it changes
  useEffect(() => {
    if (trackerRef.current && isConnected) {
      trackerRef.current.updatePage(page);
    }
  }, [page, isConnected]);

  // Don't show counter if no active users or not connected
  if (activeUsers === 0 && !isConnected) {
    return null;
  }

  const getStatusColor = () => {
    if (!isConnected) return "text-red-400";
    return "text-green-400";
  };

  const getConnectionIcon = () => {
    if (!isConnected) return <WifiOff className="h-3 w-3" />;
    return <Wifi className="h-3 w-3" />;
  };

  return (
    <Badge 
      variant="secondary" 
      className="flex items-center gap-2 backdrop-blur-sm bg-white/10 border-white/20 text-current"
    >
      <div className="flex items-center gap-1">
        <Users className="h-3 w-3" />
        <span className="text-xs">
          {activeUsers} {activeUsers === 1 ? 'person' : 'people'} here
        </span>
      </div>
      <div className={`flex items-center ${getStatusColor()}`}>
        {getConnectionIcon()}
      </div>
    </Badge>
  );
}
