import { useEffect, useRef, useState } from "react";
import {
  useAdminListUserSessions,
  useAdminRevokeUserSession,
  useAdminRevokeUserSessions,
} from "@/lib/hooks/api/use-auth";

export interface Session {
  id: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: number;
  expiresAt: number;
}

export function useUserSessions(userId: string) {
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const sessionsLoadedRef = useRef<string | null>(null);

  const {
    data: sessionsData,
    isLoading: isLoadingSessions,
    refetch: refetchSessions,
  } = useAdminListUserSessions(userId);
  const revokeSessionMutation = useAdminRevokeUserSession();
  const revokeAllSessionsMutation = useAdminRevokeUserSessions();

  const isRevokingAll = revokeAllSessionsMutation.isPending;

  // Transform the sessions data to match our interface
  const sessions: Session[] = ((sessionsData as { sessions?: unknown[] })?.sessions || []).map(
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

  // Reset sessions loaded ref when userId changes
  useEffect(() => {
    if (sessionsLoadedRef.current !== userId) {
      sessionsLoadedRef.current = null;
    }
    if (sessionsData) {
      sessionsLoadedRef.current = userId;
    }
  }, [userId, sessionsData]);

  const handleRevokeSession = async (sessionToken: string) => {
    setIsRevoking(sessionToken);
    try {
      await revokeSessionMutation.mutateAsync({
        userId,
        sessionToken,
      });
      refetchSessions();
    } catch (_err) {
      // Error is handled by the mutation hook
    } finally {
      setIsRevoking(null);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!userId) return;
    try {
      await revokeAllSessionsMutation.mutateAsync(userId);
      refetchSessions();
    } catch (_err) {
      // Error is handled by the mutation hook
    }
  };

  return {
    sessions,
    isLoadingSessions,
    isRevoking,
    isRevokingAll,
    sessionsLoadedRef,
    loadSessions: refetchSessions,
    handleRevokeSession,
    handleRevokeAllSessions,
  };
}
