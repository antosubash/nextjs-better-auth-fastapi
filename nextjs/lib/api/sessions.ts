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
  const response = await fetch("/api/sessions");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to load sessions");
  }
  return response.json();
}

export async function revokeSession(sessionToken: string): Promise<void> {
  const response = await fetch("/api/sessions", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sessionToken }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to revoke session");
  }
}

export async function revokeAllSessions(): Promise<void> {
  const response = await fetch("/api/sessions", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ revokeAll: true }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to revoke sessions");
  }
}
