import { api } from "encore.dev/api";
import { authDB } from "./db";

export interface CheckSetupResponse {
  needsSetup: boolean;
}

// Checks if admin password setup is required.
export const checkSetup = api<void, CheckSetupResponse>(
  { expose: true, method: "GET", path: "/auth/check-setup" },
  async () => {
    const existingPassword = await authDB.queryRow<{ id: number }>`
      SELECT id FROM admin_passwords WHERE id = 1
    `;

    return {
      needsSetup: !existingPassword
    };
  }
);
