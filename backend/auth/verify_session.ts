import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";
import { Header } from "encore.dev/api";

export interface VerifySessionRequest {
  authorization: Header<"Authorization">;
}

export interface VerifySessionResponse {
  valid: boolean;
}

// Verifies if a session token is valid.
export const verifySession = api<VerifySessionRequest, VerifySessionResponse>(
  { expose: true, method: "GET", path: "/auth/verify" },
  async (req) => {
    const token = req.authorization?.replace("Bearer ", "");
    if (!token) {
      return { valid: false };
    }

    const session = await authDB.queryRow<{ id: number; expiresAt: Date }>`
      SELECT id, expires_at as "expiresAt" 
      FROM admin_sessions 
      WHERE token = ${token} AND expires_at > NOW()
    `;

    return { valid: !!session };
  }
);
