import { api } from "encore.dev/api";
import { analyticsDB } from "./db";

export interface GetActiveUsersResponse {
  activeUsers: number;
}

// Retrieves the number of currently active users on the landing page.
export const getActiveUsers = api<void, GetActiveUsersResponse>(
  { expose: true, method: "GET", path: "/analytics/active-users" },
  async () => {
    // First clean up inactive users (older than 5 minutes)
    await analyticsDB.exec`
      DELETE FROM active_users 
      WHERE last_seen < NOW() - INTERVAL '5 minutes'
    `;

    // Count active users
    const result = await analyticsDB.queryRow<{ count: string }>`
      SELECT COUNT(*)::text as count
      FROM active_users
    `;

    return {
      activeUsers: parseInt(result?.count || "0")
    };
  }
);
