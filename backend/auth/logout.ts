import { api } from "encore.dev/api";
import { authDB } from "./db";
import { Header } from "encore.dev/api";

export interface LogoutRequest {
  authorization: Header<"Authorization">;
}

export interface LogoutResponse {
  success: boolean;
}

// Logs out by invalidating the session token.
export const logout = api<LogoutRequest, LogoutResponse>(
  { expose: true, method: "POST", path: "/auth/logout" },
  async (req) => {
    const token = req.authorization?.replace("Bearer ", "");
    if (token) {
      await authDB.exec`
        DELETE FROM admin_sessions WHERE token = ${token}
      `;
    }

    return { success: true };
  }
);
