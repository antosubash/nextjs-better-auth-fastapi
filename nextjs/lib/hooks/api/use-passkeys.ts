import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { PASSKEY_ERRORS, PASSKEY_SUCCESS } from "@/lib/constants";
import { queryKeys } from "./query-keys";

export function usePasskeys() {
  return useQuery({
    queryKey: [...queryKeys.auth.all, "passkeys"],
    queryFn: async () => {
      const { data, error } = await authClient.passkey.listUserPasskeys({});
      if (error) {
        throw new Error(error.message || PASSKEY_ERRORS.LIST_FAILED);
      }
      return data || [];
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useAddPasskey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data?: {
      name?: string;
      authenticatorAttachment?: "platform" | "cross-platform";
    }) => {
      const result = await authClient.passkey.addPasskey({
        name: data?.name,
        authenticatorAttachment: data?.authenticatorAttachment,
      });
      if (result && "error" in result && result.error) {
        throw new Error(result.error.message || PASSKEY_ERRORS.ADD_FAILED);
      }
      if (result && "data" in result) {
        return result.data;
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.auth.all, "passkeys"] });
      toast.success(PASSKEY_SUCCESS.ADDED);
    },
    onError: (error: Error) => {
      toast.error(error.message || PASSKEY_ERRORS.ADD_FAILED);
    },
  });
}

export function useDeletePasskey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await authClient.passkey.deletePasskey({ id });
      if (error) {
        throw new Error(error.message || PASSKEY_ERRORS.DELETE_FAILED);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.auth.all, "passkeys"] });
      toast.success(PASSKEY_SUCCESS.DELETED);
    },
    onError: (error: Error) => {
      toast.error(error.message || PASSKEY_ERRORS.DELETE_FAILED);
    },
  });
}

export function useUpdatePasskey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; name: string }) => {
      const { data: responseData, error } = await authClient.passkey.updatePasskey({
        id: data.id,
        name: data.name,
      });
      if (error) {
        throw new Error(error.message || PASSKEY_ERRORS.UPDATE_FAILED);
      }
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.auth.all, "passkeys"] });
      toast.success(PASSKEY_SUCCESS.UPDATED);
    },
    onError: (error: Error) => {
      toast.error(error.message || PASSKEY_ERRORS.UPDATE_FAILED);
    },
  });
}

export function useSignInWithPasskey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options?: { autoFill?: boolean }) => {
      const { data, error } = await authClient.signIn.passkey({
        autoFill: options?.autoFill,
      });
      if (error) {
        // Don't throw for user cancellation - it's expected behavior
        const errorMessage = error.message || "";
        if (
          errorMessage.toLowerCase().includes("cancel") ||
          errorMessage.toLowerCase().includes("abort") ||
          errorMessage.toLowerCase().includes("notallowed")
        ) {
          // User cancelled - return null instead of throwing
          return null;
        }
        throw new Error(errorMessage || PASSKEY_ERRORS.SIGN_IN_FAILED);
      }
      return data;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
        toast.success(PASSKEY_SUCCESS.SIGNED_IN);
      }
      // If data is null, user cancelled - don't show success or error
    },
    onError: (error: Error) => {
      // Only show error for actual failures, not cancellations
      const errorMessage = error.message || "";
      if (
        !errorMessage.toLowerCase().includes("cancel") &&
        !errorMessage.toLowerCase().includes("abort") &&
        !errorMessage.toLowerCase().includes("notallowed")
      ) {
        toast.error(errorMessage || PASSKEY_ERRORS.SIGN_IN_FAILED);
      }
    },
  });
}
