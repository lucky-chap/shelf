import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";
import bcrypt from "bcrypt";
import crypto from "crypto";

export interface LoginRequest {
  password: string;
}

export interface LoginResponse {
  token: string;
}

// Authenticates admin login and returns a session token.
export const login = api<LoginRequest, LoginResponse>(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req) => {
    if (!req.password) {
      throw APIError.invalidArgument("password is required");
    }

    // Get the stored password hash
    const storedPassword = await authDB.queryRow<{ passwordHash: string }>`
      SELECT password_hash as "passwordHash" FROM admin_passwords WHERE id = 1
    `;

    if (!storedPassword) {
      throw APIError.notFound("admin password not configured");
    }

    // Verify the password
    const isValid = await bcrypt.compare(req.password, storedPassword.passwordHash);
    if (!isValid) {
      throw APIError.unauthenticated("invalid password");
    }

    // Generate a session token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    // Store the session
    await authDB.exec`
      INSERT INTO admin_sessions (token, expires_at, created_at)
      VALUES (${token}, ${expiresAt}, NOW())
      ON CONFLICT (token) DO UPDATE SET
        expires_at = EXCLUDED.expires_at
    `;

    return { token };
  }
);
