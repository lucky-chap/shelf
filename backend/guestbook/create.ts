import { api, APIError } from "encore.dev/api";
import { guestbookDB } from "./db";
import { Header } from "encore.dev/api";

export interface CreateGuestEntryRequest {
  nickname?: string;
  message: string;
  emoji?: string;
  visitorIP?: Header<"X-Forwarded-For">;
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

// Creates a new guest entry (requires moderation).
export const create = api<CreateGuestEntryRequest, GuestEntry>(
  { expose: true, method: "POST", path: "/guestbook" },
  async (req) => {
    if (!req.message.trim()) {
      throw APIError.invalidArgument("message cannot be empty");
    }

    const entry = await guestbookDB.queryRow<GuestEntry>`
      INSERT INTO guest_entries (nickname, message, emoji, visitor_ip)
      VALUES (${req.nickname || null}, ${req.message.trim()}, ${req.emoji || null}, ${req.visitorIP || null})
      RETURNING id, nickname, message, emoji, visitor_ip as "visitorIP", is_approved as "isApproved", created_at as "createdAt"
    `;

    if (!entry) {
      throw APIError.internal("failed to create guest entry");
    }

    return entry;
  }
);
