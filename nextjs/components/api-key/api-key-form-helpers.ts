import type { ApiKeyFormValues } from "./api-key-form-schema";
import type { ApiKey } from "./api-key-form-types";

// Helper function to calculate days until expiry
export const calculateDaysUntilExpiry = (expiresAt: Date | number | null | undefined): string => {
  if (!expiresAt) {
    return "";
  }
  const expiresDate = new Date(expiresAt);
  const now = new Date();
  const daysUntilExpiry = Math.ceil(
    (expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilExpiry > 0 ? daysUntilExpiry.toString() : "";
};

// Helper function to build form values from API key
export const buildFormValuesFromApiKey = (key: ApiKey): ApiKeyFormValues => {
  return {
    name: key.name || "",
    prefix: key.prefix || "",
    expiresIn: calculateDaysUntilExpiry(key.expiresAt),
    metadata: key.metadata ? JSON.stringify(key.metadata, null, 2) : "",
  };
};

// Helper function to build form state initialization data from API key
export const buildFormStateFromApiKey = (key: ApiKey) => {
  return {
    permissions: key.permissions || {},
    remaining: key.remaining?.toString() || "",
    refillAmount: key.refillAmount?.toString() || "",
    refillInterval: key.refillInterval?.toString() || "",
    rateLimitEnabled: key.rateLimitEnabled || false,
    rateLimitTimeWindow: key.rateLimitTimeWindow?.toString() || "",
    rateLimitMax: key.rateLimitMax?.toString() || "",
  };
};

export const parseFormMetadata = (metadata: string): Record<string, unknown> | undefined => {
  if (metadata && metadata.trim() !== "") {
    return JSON.parse(metadata);
  }
  return undefined;
};

export const parseExpiresIn = (expiresIn: string): number | undefined => {
  if (expiresIn && expiresIn.trim() !== "") {
    const days = parseInt(expiresIn, 10);
    return days * 24 * 60 * 60;
  }
  return undefined;
};
