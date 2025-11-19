export interface ApiKey {
  id: string;
  name?: string | null;
  prefix?: string | null;
  expiresAt?: Date | number | null;
  metadata?: Record<string, unknown> | null;
  permissions?: Record<string, string[]> | null;
  enabled?: boolean;
  remaining?: number | null;
  refillAmount?: number | null;
  refillInterval?: number | null;
  rateLimitEnabled?: boolean;
  rateLimitTimeWindow?: number | null;
  rateLimitMax?: number | null;
}

export interface ApiKeyFormProps {
  apiKey?: ApiKey | null;
  onSuccess: (createdKey?: string) => void;
  onCancel: () => void;
}
