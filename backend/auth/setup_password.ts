import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";
import bcrypt from "bcrypt";

export interface SetupPasswordRequest {
  password: string;
}

export interface SetupPasswordResponse {
  success: boolean;
}

// Sets up the initial admin password.
export const setupPassword = api<SetupPasswordRequest, SetupPasswordResponse>(
  { expose: true, method: "POST", path: "/auth/setup" },
  async (req) => {
    if (!req.password || req.password.length < 6) {
      throw APIError.invalidArgument("password must be at least 6 characters");
    }

    // Check if password already exists
    const existing = await authDB.queryRow<{ id: number }>`
      SELECT id FROM admin_passwords WHERE id = 1
    `;

    if (existing) {
      throw APIError.alreadyExists("admin password already configured");
    }

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(req.password, saltRounds);

    // Store the hashed password
    await authDB.exec`
      INSERT INTO admin_passwords (id, password_hash, created_at)
      VALUES (1, ${hashedPassword}, NOW())
    `;

    return { success: true };
  }
);
