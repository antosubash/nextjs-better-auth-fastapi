import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import { API_KEY_ERRORS, API_KEY_SUCCESS } from "@/lib/constants";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name?: string | null;
  prefix?: string | null;
  enabled?: boolean;
  expiresAt?: Date | number | null;
  createdAt: Date | number;
}

interface ApiKeyData {
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

interface CreateApiKeyData {
  name?: string;
  expiresIn?: number;
  prefix?: string;
  metadata?: Record<string, unknown>;
  permissions?: Record<string, string[]>;
}

interface UpdateApiKeyData {
  name?: string;
  enabled?: boolean;
  prefix?: string;
  metadata?: Record<string, unknown>;
  permissions?: Record<string, string[]>;
}

export function useApiKeys() {
  return useQuery<ApiKey[]>({
    queryKey: queryKeys.apiKeys.list(),
    queryFn: async () => {
      const response = await fetch("/api/api-keys");
      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || API_KEY_ERRORS.LOAD_API_KEYS_FAILED);
      }

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
    },
  });
}

export function useApiKeyDetails(id: string) {
  return useQuery<ApiKeyData>({
    queryKey: queryKeys.apiKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/api-keys/${id}`);
      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || API_KEY_ERRORS.LOAD_API_KEY_FAILED);
      }

      return result.data;
    },
    enabled: !!id,
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation<{ data: { key: string } }, Error, CreateApiKeyData>({
    mutationFn: async (data: CreateApiKeyData) => {
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || API_KEY_ERRORS.CREATE_FAILED);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.lists() });
      toast.success(API_KEY_SUCCESS.API_KEY_CREATED);
    },
    onError: (error: Error) => {
      toast.error(error.message || API_KEY_ERRORS.CREATE_FAILED);
    },
  });
}

export function useUpdateApiKey() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; data: UpdateApiKeyData }>({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || API_KEY_ERRORS.UPDATE_FAILED);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.detail(variables.id) });
      toast.success(API_KEY_SUCCESS.API_KEY_UPDATED);
    },
    onError: (error: Error) => {
      toast.error(error.message || API_KEY_ERRORS.UPDATE_FAILED);
    },
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || API_KEY_ERRORS.DELETE_FAILED);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.lists() });
      toast.success(API_KEY_SUCCESS.API_KEY_DELETED);
    },
    onError: (error: Error) => {
      toast.error(error.message || API_KEY_ERRORS.DELETE_FAILED);
    },
  });
}

export function useDeleteExpiredApiKeys() {
  const queryClient = useQueryClient();

  return useMutation<void, Error>({
    mutationFn: async () => {
      const response = await fetch("/api/api-keys/expired", {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || API_KEY_ERRORS.DELETE_EXPIRED_FAILED);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.lists() });
      toast.success(API_KEY_SUCCESS.EXPIRED_DELETED);
    },
    onError: (error: Error) => {
      toast.error(error.message || API_KEY_ERRORS.DELETE_EXPIRED_FAILED);
    },
  });
}
