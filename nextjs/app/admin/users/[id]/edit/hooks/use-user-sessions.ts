import { useCallback, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { ADMIN_ERRORS, ADMIN_SUCCESS } from "@/lib/constants";
import { useToast } from "@/lib/hooks/use-toast";

export interface Session {
  id: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: number;
  expiresAt: number;
}

export function useUserSessions(userId: string) {
  const toast = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const sessionsLoadedRef = useRef<string | null>(null);

  // Reset sessions loaded ref when userId changes
  useEffect(() => {
    if (sessionsLoadedRef.current !== userId) {
      sessionsLoadedRef.current = null;
      setSessions([]);
    }
  }, [userId]);

  const loadSessions = useCallback(async () => {
    if (!userId || isLoadingSessions) return;
    setIsLoadingSessions(true);
    try {
      const result = await authClient.admin.listUserSessions({ userId });
      if (result.error) {
        toast.error(result.error.message || ADMIN_ERRORS.LOAD_SESSIONS_FAILED);
      } else {
        const sessionsData = ((result.data as { sessions?: unknown[] })?.sessions || []).map(
          (session: unknown) => {
            const s = session as {
              createdAt?: Date | number;
              expiresAt?: Date | number;
              [key: string]: unknown;
            };
            return {
              ...s,
              createdAt:
                s.createdAt instanceof Date ? s.createdAt.getTime() : (s.createdAt as number) || 0,
              expiresAt:
                s.expiresAt instanceof Date ? s.expiresAt.getTime() : (s.expiresAt as number) || 0,
            } as Session;
          }
        );
        setSessions(sessionsData);
        sessionsLoadedRef.current = userId;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ADMIN_ERRORS.LOAD_SESSIONS_FAILED;
      toast.error(errorMessage);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [userId, isLoadingSessions, toast]);

  const handleRevokeSession = useCallback(
    async (sessionToken: string) => {
      setIsRevoking(sessionToken);
      try {
        const result = await authClient.admin.revokeUserSession({
          sessionToken,
        });

        if (result.error) {
          toast.error(result.error.message || ADMIN_ERRORS.REVOKE_SESSION_FAILED);
        } else {
          toast.success(ADMIN_SUCCESS.SESSION_REVOKED);
          await loadSessions();
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : ADMIN_ERRORS.REVOKE_SESSION_FAILED;
        toast.error(errorMessage);
      } finally {
        setIsRevoking(null);
      }
    },
    [loadSessions, toast]
  );

  const handleRevokeAllSessions = useCallback(async () => {
    if (!userId) return;
    setIsRevokingAll(true);
    try {
      const result = await authClient.admin.revokeUserSessions({ userId });

      if (result.error) {
        toast.error(result.error.message || ADMIN_ERRORS.REVOKE_SESSIONS_FAILED);
      } else {
        toast.success(ADMIN_SUCCESS.SESSIONS_REVOKED);
        await loadSessions();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ADMIN_ERRORS.REVOKE_SESSIONS_FAILED;
      toast.error(errorMessage);
    } finally {
      setIsRevokingAll(false);
    }
  }, [userId, loadSessions, toast]);

  return {
    sessions,
    isLoadingSessions,
    isRevoking,
    isRevokingAll,
    sessionsLoadedRef,
    loadSessions,
    handleRevokeSession,
    handleRevokeAllSessions,
  };
}
