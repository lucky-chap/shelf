import { api } from "encore.dev/api";
import { guestbookDB } from "./db";
import { Query } from "encore.dev/api";

export interface ExportGuestEntriesParams {
  format: Query<"json" | "csv">;
}

export interface ExportGuestEntriesResponse {
  data: string;
  filename: string;
  contentType: string;
}

// Exports guest entries in JSON or CSV format.
export const exportEntries = api<ExportGuestEntriesParams, ExportGuestEntriesResponse>(
  { expose: true, method: "GET", path: "/guestbook/export" },
  async ({ format }) => {
    const entries = await guestbookDB.queryAll<{
      id: number;
      nickname: string | null;
      message: string;
      emoji: string | null;
      isApproved: boolean;
      createdAt: Date;
    }>`
      SELECT id, nickname, message, emoji, is_approved as "isApproved", created_at as "createdAt"
      FROM guest_entries 
      ORDER BY created_at DESC
    `;

    const timestamp = new Date().toISOString().split('T')[0];

    if (format === "json") {
      return {
        data: JSON.stringify(entries, null, 2),
        filename: `guestbook-${timestamp}.json`,
        contentType: "application/json"
      };
    } else {
      // CSV format
      const headers = ["ID", "Nickname", "Message", "Emoji", "Approved", "Created At"];
      const csvRows = [
        headers.join(","),
        ...entries.map(entry => [
          entry.id,
          `"${(entry.nickname || "").replace(/"/g, '""')}"`,
          `"${entry.message.replace(/"/g, '""')}"`,
          `"${(entry.emoji || "").replace(/"/g, '""')}"`,
          entry.isApproved,
          entry.createdAt.toISOString()
        ].join(","))
      ];

      return {
        data: csvRows.join("\n"),
        filename: `guestbook-${timestamp}.csv`,
        contentType: "text/csv"
      };
    }
  }
);
