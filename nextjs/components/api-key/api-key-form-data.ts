import { API_KEY_CONFIG } from "@/lib/constants";
import type { ApiKeyFormValues } from "./api-key-form-schema";
import { parseExpiresIn } from "./api-key-form-helpers";

export const buildUpdateData = (
  values: ApiKeyFormValues,
  parsedMetadata: Record<string, unknown> | undefined,
  parsedPermissions: Record<string, string[]> | undefined
) => {
  const updateData: {
    name?: string;
    expiresIn?: number;
    prefix?: string;
    metadata?: Record<string, unknown>;
    permissions?: Record<string, string[]>;
  } = {
    name: values.name || undefined,
  };

  const expiresInSeconds = parseExpiresIn(values.expiresIn || "");
  if (expiresInSeconds !== undefined) {
    updateData.expiresIn = expiresInSeconds;
  }

  if (values.prefix) updateData.prefix = values.prefix;
  if (parsedMetadata) updateData.metadata = parsedMetadata;
  if (parsedPermissions) updateData.permissions = parsedPermissions;

  return updateData;
};

export const buildCreateData = (
  values: ApiKeyFormValues,
  parsedMetadata: Record<string, unknown> | undefined,
  parsedPermissions: Record<string, string[]> | undefined
) => {
  const createData: {
    name?: string;
    expiresIn?: number;
    prefix?: string;
    metadata?: Record<string, unknown>;
    permissions?: Record<string, string[]>;
  } = {
    name: values.name || undefined,
  };

  const expiresInSeconds = parseExpiresIn(values.expiresIn || "");
  if (expiresInSeconds !== undefined) {
    createData.expiresIn = expiresInSeconds;
  } else {
    createData.expiresIn = API_KEY_CONFIG.DEFAULT_EXPIRATION_DAYS * 24 * 60 * 60;
  }

  if (values.prefix) createData.prefix = values.prefix;
  if (parsedMetadata) createData.metadata = parsedMetadata;
  if (parsedPermissions) createData.permissions = parsedPermissions;

  return createData;
};
