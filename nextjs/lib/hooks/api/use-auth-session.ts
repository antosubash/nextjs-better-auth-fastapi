import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { AUTH_ERRORS } from "@/lib/constants";
import { queryKeys } from "./query-keys";

export function useSession(options?: { disableCookieCache?: boolean }) {
  return useQuery({
    queryKey: [...queryKeys.auth.session(), options?.disableCookieCache],
    queryFn: async () => {
      const result = await authClient.getSession(
        options?.disableCookieCache ? { query: { disableCookieCache: true } } : undefined
      );
      return result.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const result = await authClient.signIn.email({
        email: credentials.email,
        password: credentials.password,
      });
      if (result.error) {
        throw new Error(result.error.message || AUTH_ERRORS.INVALID_CREDENTIALS);
      }
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
    },
    onError: (error: Error) => {
      toast.error(error.message || AUTH_ERRORS.LOGIN_FAILED);
    },
  });
}

export function useSignUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { email: string; password: string; name: string }) => {
      const result = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
      });
      if (result.error) {
        throw new Error(result.error.message || AUTH_ERRORS.SIGNUP_FAILED);
      }
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
    },
    onError: (error: Error) => {
      toast.error(error.message || AUTH_ERRORS.SIGNUP_FAILED);
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await authClient.signOut();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
      queryClient.clear();
    },
    onError: (error: Error) => {
      toast.error(error.message || AUTH_ERRORS.LOGIN_FAILED);
    },
  });
}
