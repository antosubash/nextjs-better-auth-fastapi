import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import {
  CHANGE_PASSWORD_ERRORS,
  CHANGE_PASSWORD_SUCCESS,
  EMAIL_VERIFICATION_ERRORS,
  EMAIL_VERIFICATION_SUCCESS,
  FORGOT_PASSWORD_ERRORS,
  FORGOT_PASSWORD_SUCCESS,
  PROFILE_UPDATE_ERRORS,
  PROFILE_UPDATE_SUCCESS,
  RESET_PASSWORD_ERRORS,
  RESET_PASSWORD_SUCCESS,
} from "@/lib/constants";
import { queryKeys } from "./query-keys";

export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
      revokeOtherSessions?: boolean;
    }) => {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          revokeOtherSessions: data.revokeOtherSessions,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || CHANGE_PASSWORD_ERRORS.CHANGE_FAILED);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
      toast.success(CHANGE_PASSWORD_SUCCESS.PASSWORD_CHANGED);
    },
    onError: (error: Error) => {
      toast.error(error.message || CHANGE_PASSWORD_ERRORS.CHANGE_FAILED);
    },
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: async (data: { email: string; redirectTo?: string }) => {
      const response = await fetch("/api/auth/forget-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          redirectTo: data.redirectTo,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || FORGOT_PASSWORD_ERRORS.REQUEST_FAILED);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success(FORGOT_PASSWORD_SUCCESS.EMAIL_SENT);
    },
    onError: (error: Error) => {
      toast.error(error.message || FORGOT_PASSWORD_ERRORS.REQUEST_FAILED);
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: { newPassword: string; token: string }) => {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword: data.newPassword,
          token: data.token,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || RESET_PASSWORD_ERRORS.RESET_FAILED);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success(RESET_PASSWORD_SUCCESS.PASSWORD_RESET);
    },
    onError: (error: Error) => {
      toast.error(error.message || RESET_PASSWORD_ERRORS.RESET_FAILED);
    },
  });
}

export function useSendVerificationEmail() {
  return useMutation({
    mutationFn: async (data: { email: string; callbackURL?: string }) => {
      const response = await fetch("/api/auth/send-verification-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          callbackURL: data.callbackURL,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || EMAIL_VERIFICATION_ERRORS.RESEND_FAILED);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success(EMAIL_VERIFICATION_SUCCESS.EMAIL_SENT);
    },
    onError: (error: Error) => {
      toast.error(error.message || EMAIL_VERIFICATION_ERRORS.RESEND_FAILED);
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name?: string; email?: string; image?: string | null }) => {
      const result = await authClient.updateUser({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.image !== undefined && { image: data.image }),
      });

      if (result.error) {
        throw new Error(result.error.message || PROFILE_UPDATE_ERRORS.UPDATE_FAILED);
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
      toast.success(PROFILE_UPDATE_SUCCESS.PROFILE_UPDATED);
    },
    onError: (error: Error) => {
      toast.error(error.message || PROFILE_UPDATE_ERRORS.UPDATE_FAILED);
    },
  });
}
