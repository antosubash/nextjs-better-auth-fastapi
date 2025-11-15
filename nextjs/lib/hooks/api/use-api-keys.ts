import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { API_KEY_ERRORS, API_KEY_SUCCESS } from "@/lib/constants";
import { queryKeys } from "./query-keys";
import {
  getApiKeys,
  getApiKey,
  createApiKey,
  updateApiKey,
  deleteApiKey,
  deleteExpiredApiKeys,
  verifyApiKey,
  type ApiKey,
  type ApiKeyData,
  type CreateApiKeyData,
  type UpdateApiKeyData,
  type VerifyApiKeyRequest,
  type VerifyApiKeyResponse,
} from "@/lib/api/api-keys";

export function useApiKeys() {
  return useQuery<ApiKey[]>({
    queryKey: queryKeys.apiKeys.list(),
    queryFn: () => getApiKeys(),
  });
}

export function useApiKeyDetails(id: string) {
  return useQuery<ApiKeyData>({
    queryKey: queryKeys.apiKeys.detail(id),
    queryFn: () => getApiKey(id),
    enabled: !!id,
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation<{ data: { key: string } }, Error, CreateApiKeyData>({
    mutationFn: (data: CreateApiKeyData) => createApiKey(data),
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
    mutationFn: ({ id, data }) => updateApiKey(id, data),
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
    mutationFn: (id: string) => deleteApiKey(id),
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
    mutationFn: () => deleteExpiredApiKeys(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.lists() });
      toast.success(API_KEY_SUCCESS.EXPIRED_DELETED);
    },
    onError: (error: Error) => {
      toast.error(error.message || API_KEY_ERRORS.DELETE_EXPIRED_FAILED);
    },
  });
}

export function useVerifyApiKey() {
  return useMutation<{ data: VerifyApiKeyResponse }, Error, VerifyApiKeyRequest>({
    mutationFn: (data: VerifyApiKeyRequest) => verifyApiKey(data),
    onError: (error: Error) => {
      toast.error(error.message || API_KEY_ERRORS.VERIFY_FAILED);
    },
  });
}
