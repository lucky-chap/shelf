import { api } from "encore.dev/api";
import { guestbookDB } from "./db";
import { Query } from "encore.dev/api";

export interface ListGuestEntriesParams {
  approved?: Query<boolean>;
  limit?: Query<number>;
}

export interface GuestEntry {
  id: number;
  nickname: string | null;
  message: string;
  emoji: string | null;
  visitorIP: string | null;
  isApproved: boolean;
  createdAt: Date;
}

export interface ListGuestEntriesResponse {
  entries: GuestEntry[];
}

// Retrieves guest entries.
export const list = api<ListGuestEntriesParams, ListGuestEntriesResponse>(
  { expose: true, method: "GET", path: "/guestbook" },
  async ({ approved = true, limit = 50 }) => {
    let query = `
      SELECT id, nickname, message, emoji, visitor_ip as "visitorIP", is_approved as "isApproved", created_at as "createdAt"
      FROM guest_entries 
    `;
    
    const params: any[] = [];
    
    if (approved !== undefined) {
      query += ` WHERE is_approved = $1`;
      params.push(approved);
    }
    
    query += ` ORDER BY created_at DESC`;
    
    if (limit > 0) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(limit);
    }

    const entries = await guestbookDB.rawQueryAll<GuestEntry>(query, ...params);

    return { entries };
  }
);
