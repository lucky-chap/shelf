import { generateVisitorId } from "./analytics";

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

export class LiveVisitorTracker {
  private stream: any = null;
  private visitorId: string;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private onActiveCountChange: (count: number) => void;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private currentPage = "/";

  constructor(onActiveCountChange: (count: number) => void) {
    this.visitorId = generateVisitorId();
    this.onActiveCountChange = onActiveCountChange;
  }

  async connect(page = "/") {
    this.currentPage = page;
    
    try {
      console.log("Connecting to live visitors stream...");
      
      // Import backend client dynamically
      const { default: backend } = await import('~backend/client');
      
      this.stream = await backend.analytics.liveVisitors();
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Send join message
      await this.stream.send({
        type: "join",
        visitorId: this.visitorId,
        page: this.currentPage,
        timestamp: new Date()
      });

      // Start heartbeat
      this.startHeartbeat();

      // Listen for messages
      this.listenForMessages();

      console.log("Connected to live visitors stream");
    } catch (error) {
      console.error("Failed to connect to live visitors stream:", error);
      this.isConnected = false;
      this.scheduleReconnect();
    }
  }

  private async listenForMessages() {
    try {
      for await (const message of this.stream) {
        console.log("Received live visitor message:", message);
        
        switch (message.type) {
          case "active_count":
          case "visitor_joined":
          case "visitor_left":
            this.onActiveCountChange(message.activeCount);
            break;
        }
      }
    } catch (error) {
      console.error("Error listening for messages:", error);
      this.isConnected = false;
      this.scheduleReconnect();
    }
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(async () => {
      if (this.isConnected && this.stream) {
        try {
          await this.stream.send({
            type: "heartbeat",
            visitorId: this.visitorId,
            page: this.currentPage,
            timestamp: new Date()
          });
        } catch (error) {
          console.error("Heartbeat failed:", error);
          this.isConnected = false;
          this.scheduleReconnect();
        }
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect(this.currentPage);
    }, delay);
  }

  async updatePage(page: string) {
    this.currentPage = page;
    
    if (this.isConnected && this.stream) {
      try {
        await this.stream.send({
          type: "heartbeat",
          visitorId: this.visitorId,
          page: this.currentPage,
          timestamp: new Date()
        });
      } catch (error) {
        console.error("Failed to update page:", error);
      }
    }
  }

  async disconnect() {
    console.log("Disconnecting from live visitors stream...");

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.isConnected && this.stream) {
      try {
        await this.stream.send({
          type: "leave",
          visitorId: this.visitorId,
          timestamp: new Date()
        });
      } catch (error) {
        console.error("Failed to send leave message:", error);
      }
    }

    this.isConnected = false;
    this.stream = null;
  }

  getVisitorId(): string {
    return this.visitorId;
  }

  isConnectionActive(): boolean {
    return this.isConnected;
  }
}
