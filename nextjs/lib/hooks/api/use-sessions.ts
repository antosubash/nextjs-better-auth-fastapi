import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSessions, revokeAllSessions, revokeSession } from "@/lib/api/sessions";
import { SESSION_ERRORS, SESSION_SUCCESS } from "@/lib/constants";
import { queryKeys } from "./query-keys";

export function useSessions() {
  return useQuery({
    queryKey: queryKeys.sessions.list(),
    queryFn: () => getSessions(),
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionToken: string) => revokeSession(sessionToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.lists() });
      toast.success(SESSION_SUCCESS.SESSION_REVOKED);
    },
    onError: (error: Error) => {
      toast.error(error.message || SESSION_ERRORS.REVOKE_SESSION_FAILED);
    },
  });
}

export function useRevokeAllSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => revokeAllSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.lists() });
      toast.success(SESSION_SUCCESS.SESSIONS_REVOKED);
    },
    onError: (error: Error) => {
      toast.error(error.message || SESSION_ERRORS.REVOKE_SESSION_FAILED);
    },
  });
}
