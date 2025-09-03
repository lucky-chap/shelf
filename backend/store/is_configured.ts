import { api } from "encore.dev/api";
import { getPolarApiKey, getPolarOrganizationId } from "./polar";

export interface StoreConfigResponse {
  enabled: boolean;
  organizationId?: string;
}

// Indicates whether Polar is configured. Used to toggle Store UI.
export const isConfigured = api<void, StoreConfigResponse>(
  { expose: true, method: "GET", path: "/store/config" },
  async () => {
    const key = getPolarApiKey();
    const org = getPolarOrganizationId();
    return { enabled: !!key && !!org, organizationId: org || undefined };
  }
);
