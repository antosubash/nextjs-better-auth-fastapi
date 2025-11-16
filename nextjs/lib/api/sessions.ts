import { authClient } from "@/lib/auth-client";

export interface Session {
  id: string;
  token: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: number;
  expiresAt: number;
  isActive: boolean;
}

export interface SessionsResponse {
  sessions: Session[];
}

export async function getSessions(): Promise<SessionsResponse> {
  const result = await authClient.listSessions();
  if (result.error) {
    throw new Error(result.error.message || "Failed to load sessions");
  }

  // Transform Better Auth session format to our expected format
  const sessions = (result.data || []).map((session) => {
    const createdAt =
      session.createdAt instanceof Date
        ? session.createdAt.getTime()
        : typeof session.createdAt === "number"
          ? session.createdAt
          : 0;
    const expiresAt =
      session.expiresAt instanceof Date
        ? session.expiresAt.getTime()
        : typeof session.expiresAt === "number"
          ? session.expiresAt
          : 0;

    return {
      id: session.id || session.token || "",
      token: session.token || "",
      ipAddress: session.ipAddress || null,
      userAgent: session.userAgent || null,
      createdAt,
      expiresAt,
      isActive: expiresAt > Date.now(),
    };
  });

  return { sessions };
}

export async function revokeSession(sessionToken: string): Promise<void> {
  const result = await authClient.revokeSession({ token: sessionToken });
  if (result.error) {
    throw new Error(result.error.message || "Failed to revoke session");
  }
}

export async function revokeAllSessions(): Promise<void> {
  // Revoke all other sessions (excluding current session)
  const result = await authClient.revokeOtherSessions();
  if (result.error) {
    throw new Error(result.error.message || "Failed to revoke sessions");
  }
}

export async function revokeAllSessionsIncludingCurrent(): Promise<void> {
  // Revoke all sessions including the current one
  const result = await authClient.revokeSessions();
  if (result.error) {
    throw new Error(result.error.message || "Failed to revoke all sessions");
  }
}
