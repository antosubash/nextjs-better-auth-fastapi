export interface ApiKey {
  id: string;
  name?: string | null;
  prefix?: string | null;
  enabled?: boolean;
  expiresAt?: Date | number | null;
  createdAt: Date | number;
}

export interface ApiKeyData {
  id: string;
  name?: string | null;
  prefix?: string | null;
  enabled?: boolean;
  createdAt?: Date | number | string;
  expiresAt?: Date | number | string | null;
  remaining?: number | null;
  refillAmount?: number | null;
  refillInterval?: number | null;
  rateLimitEnabled?: boolean;
  rateLimitTimeWindow?: number | null;
  rateLimitMax?: number | null;
  metadata?: Record<string, unknown> | null;
  permissions?: Record<string, string[]> | null;
}

export interface CreateApiKeyData {
  name?: string;
  expiresIn?: number;
  prefix?: string;
  metadata?: Record<string, unknown>;
  permissions?: Record<string, string[]>;
}

export interface UpdateApiKeyData {
  name?: string;
  enabled?: boolean;
  prefix?: string;
  metadata?: Record<string, unknown>;
  permissions?: Record<string, string[]>;
}

export interface VerifyApiKeyRequest {
  key: string;
  permissions?: Record<string, string[]>;
}

export interface VerifyApiKeyResponse {
  valid: boolean;
  error: { message: string; code: string } | null;
  key: {
    name?: string;
    prefix?: string;
    enabled?: boolean;
    permissions?: Record<string, string[]>;
  } | null;
}

export async function getApiKeys(): Promise<ApiKey[]> {
  const response = await fetch("/api/api-keys");
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || "Failed to load API keys");
  }
  const result = await response.json();
  const keys = Array.isArray(result.data) ? result.data : [];
  return keys.map((key: ApiKey) => ({
    ...key,
    createdAt:
      key.createdAt instanceof Date
        ? key.createdAt.getTime()
        : typeof key.createdAt === "number"
          ? key.createdAt
          : Date.now(),
  }));
}

export async function getApiKey(id: string): Promise<ApiKeyData> {
  const response = await fetch(`/api/api-keys/${id}`);
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || "Failed to load API key");
  }
  const result = await response.json();
  return result.data;
}

export async function createApiKey(
  data: CreateApiKeyData
): Promise<{ data: { key: string } }> {
  const response = await fetch("/api/api-keys", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || "Failed to create API key");
  }

  return result;
}

export async function updateApiKey(id: string, data: UpdateApiKeyData): Promise<void> {
  const response = await fetch(`/api/api-keys/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || "Failed to update API key");
  }
}

export async function deleteApiKey(id: string): Promise<void> {
  const response = await fetch(`/api/api-keys/${id}`, {
    method: "DELETE",
  });
  const result = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || "Failed to delete API key");
  }
}

export async function deleteExpiredApiKeys(): Promise<void> {
  const response = await fetch("/api/api-keys/expired", {
    method: "DELETE",
  });
  const result = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || "Failed to delete expired API keys");
  }
}

export async function verifyApiKey(
  data: VerifyApiKeyRequest
): Promise<{ data: VerifyApiKeyResponse }> {
  const response = await fetch("/api/api-keys/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || "Failed to verify API key");
  }

  return result;
}

