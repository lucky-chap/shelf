import { api, StreamInOut } from "encore.dev/api";
import { analyticsDB } from "./db";

export interface VisitorMessage {
  type: "heartbeat" | "join" | "leave";
  visitorId: string;
  page?: string;
  timestamp: Date;
}

export interface ActiveVisitorsMessage {
  type: "active_count" | "visitor_joined" | "visitor_left";
  activeCount: number;
  visitorId?: string;
  timestamp: Date;
}

// Store active connections
const activeConnections = new Map<string, StreamInOut<VisitorMessage, ActiveVisitorsMessage>>();

// Tracks live visitors using WebSocket connection.
export const liveVisitors = api.streamInOut<VisitorMessage, ActiveVisitorsMessage>(
  { expose: true, path: "/analytics/live-visitors" },
  async (stream) => {
    let currentVisitorId: string | null = null;

    try {
      console.log("New visitor stream connection established");

      for await (const message of stream) {
        console.log("Received message:", message);

        switch (message.type) {
          case "join":
            currentVisitorId = message.visitorId;
            activeConnections.set(message.visitorId, stream);

            // Update database with active user
            await analyticsDB.exec`
              INSERT INTO active_users (visitor_id, page, last_seen, created_at)
              VALUES (${message.visitorId}, ${message.page || "/"}, NOW(), NOW())
              ON CONFLICT (visitor_id) DO UPDATE SET
                last_seen = NOW(),
                page = EXCLUDED.page
            `;

            // Broadcast to all connections
            await broadcastActiveCount();
            await broadcastToAll({
              type: "visitor_joined",
              activeCount: activeConnections.size,
              visitorId: message.visitorId,
              timestamp: new Date()
            });
            break;

          case "heartbeat":
            if (message.visitorId) {
              // Update last seen time
              await analyticsDB.exec`
                UPDATE active_users 
                SET last_seen = NOW(), page = ${message.page || "/"}
                WHERE visitor_id = ${message.visitorId}
              `;

              // Send heartbeat response
              await stream.send({
                type: "active_count",
                activeCount: activeConnections.size,
                timestamp: new Date()
              });
            }
            break;

          case "leave":
            if (message.visitorId) {
              activeConnections.delete(message.visitorId);
              
              // Remove from database
              await analyticsDB.exec`
                DELETE FROM active_users WHERE visitor_id = ${message.visitorId}
              `;

              await broadcastActiveCount();
              await broadcastToAll({
                type: "visitor_left",
                activeCount: activeConnections.size,
                visitorId: message.visitorId,
                timestamp: new Date()
              });
            }
            break;
        }
      }
    } catch (error) {
      console.error("Error in live visitors stream:", error);
    } finally {
      // Clean up on disconnect
      if (currentVisitorId) {
        activeConnections.delete(currentVisitorId);
        
        try {
          await analyticsDB.exec`
            DELETE FROM active_users WHERE visitor_id = ${currentVisitorId}
          `;
          
          await broadcastActiveCount();
          await broadcastToAll({
            type: "visitor_left",
            activeCount: activeConnections.size,
            visitorId: currentVisitorId,
            timestamp: new Date()
          });
        } catch (cleanupError) {
          console.error("Error during stream cleanup:", cleanupError);
        }
      }
      
      console.log("Visitor stream connection closed");
    }
  }
);

async function broadcastActiveCount() {
  const count = activeConnections.size;
  await broadcastToAll({
    type: "active_count",
    activeCount: count,
    timestamp: new Date()
  });
}

async function broadcastToAll(message: ActiveVisitorsMessage) {
  const deadConnections: string[] = [];

  for (const [visitorId, connection] of activeConnections) {
    try {
      await connection.send(message);
    } catch (error) {
      console.error(`Failed to send to ${visitorId}:`, error);
      deadConnections.push(visitorId);
    }
  }

  // Clean up dead connections
  for (const visitorId of deadConnections) {
    activeConnections.delete(visitorId);
    try {
      await analyticsDB.exec`
        DELETE FROM active_users WHERE visitor_id = ${visitorId}
      `;
    } catch (error) {
      console.error(`Failed to clean up dead connection ${visitorId}:`, error);
    }
  }
}
