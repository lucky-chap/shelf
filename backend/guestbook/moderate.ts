import { api, APIError } from "encore.dev/api";
import { guestbookDB } from "./db";

export interface ModerateGuestEntryRequest {
  id: number;
  isApproved: boolean;
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

// Moderates a guest entry by approving or rejecting it.
export const moderate = api<ModerateGuestEntryRequest, GuestEntry>(
  { expose: true, method: "PUT", path: "/guestbook/entries/:id/moderate" },
  async (req) => {
    const row = await guestbookDB.queryRow<GuestEntry>`
      UPDATE guest_entries 
      SET is_approved = ${req.isApproved}
      WHERE id = ${req.id}
      RETURNING id, nickname, message, emoji, visitor_ip as "visitorIP", is_approved as "isApproved", created_at as "createdAt"
    `;
    
    if (!row) {
      throw APIError.notFound("guest entry not found");
    }
    
    return row;
  }
);
