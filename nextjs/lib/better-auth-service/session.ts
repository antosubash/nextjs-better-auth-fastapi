import { auth } from "../auth";
import { getHeaders } from "./server-utils";
import { withErrorHandling } from "./utils";

/**
 * Session-related methods
 * For use in Server Components or Server Actions
 * For Client Components, use authClient from "@/lib/auth-client"
 */
export const sessionService = {
  /**
   * Get the current session
   * @param headers - Optional headers. If not provided, will use server headers (server-only)
   */
  async getSession(headers?: Headers) {
    return withErrorHandling("getSession", async () => {
      const headersList = headers || (await getHeaders());
      return await auth.api.getSession({ headers: headersList });
    });
  },

  /**
   * Get a JWT token for the current session
   * @param headers - Optional headers. If not provided, will use server headers (server-only)
   */
  async getToken(headers?: Headers) {
    return withErrorHandling("getToken", async () => {
      const headersList = headers || (await getHeaders());
      return await auth.api.getToken({ headers: headersList });
    });
  },

  /**
   * List sessions for the current user
   * Users can only access their own sessions
   * @param headers - Optional headers. If not provided, will use server headers (server-only)
   */
  async listMySessions(headers?: Headers) {
    return withErrorHandling(
      "listMySessions",
      async () => {
        const headersList = headers || (await getHeaders());
        const sessionData = await auth.api.getSession({ headers: headersList });
        const userId = sessionData?.user?.id;

        if (!userId) {
          throw new Error("User not authenticated");
        }

        return await auth.api.listUserSessions({
          headers: headersList,
          body: {
            userId,
          },
        });
      },
      {}
    );
  },

  /**
   * Revoke a specific session for the current user
   * Users can only revoke their own sessions
   * @param params - Session token to revoke
   * @param headers - Optional headers. If not provided, will use server headers (server-only)
   */
  async revokeMySession(params: { sessionToken: string }, headers?: Headers) {
    return withErrorHandling(
      "revokeMySession",
      async () => {
        const headersList = headers || (await getHeaders());
        const sessionData = await auth.api.getSession({ headers: headersList });
        const userId = sessionData?.user?.id;

        if (!userId) {
          throw new Error("User not authenticated");
        }

        // Verify the session belongs to the current user
        const sessionsResult = await auth.api.listUserSessions({
          headers: headersList,
          body: {
            userId,
          },
        });

        const sessions = (sessionsResult as { sessions?: unknown[] })?.sessions || [];
        const sessionExists = sessions.some(
          (s: unknown) => (s as { token?: string }).token === params.sessionToken
        );

        if (!sessionExists) {
          throw new Error("Session not found or does not belong to user");
        }

        return await auth.api.revokeUserSession({
          headers: headersList,
          body: {
            sessionToken: params.sessionToken,
          },
        });
      },
      { hasSessionToken: !!params.sessionToken }
    );
  },

  /**
   * Revoke all other sessions for the current user (keeps current session active)
   * Users can only revoke their own sessions
   * @param headers - Optional headers. If not provided, will use server headers (server-only)
   */
  async revokeAllOtherSessions(headers?: Headers) {
    return withErrorHandling(
      "revokeAllOtherSessions",
      async () => {
        const headersList = headers || (await getHeaders());
        const sessionData = await auth.api.getSession({ headers: headersList });
        const userId = sessionData?.user?.id;
        const currentSessionToken = sessionData?.session?.token;

        if (!userId) {
          throw new Error("User not authenticated");
        }

        // Get all sessions for the user
        const sessionsResult = await auth.api.listUserSessions({
          headers: headersList,
          body: {
            userId,
          },
        });

        const sessions = (sessionsResult as { sessions?: unknown[] })?.sessions || [];
        const revokedTokens: string[] = [];

        // Revoke all sessions except the current one
        for (const session of sessions) {
          const s = session as { token?: string; [key: string]: unknown };
          const token = s.token;

          if (token && token !== currentSessionToken) {
            try {
              await auth.api.revokeUserSession({
                headers: headersList,
                body: {
                  sessionToken: token,
                },
              });
              revokedTokens.push(token);
            } catch (error) {
              // Continue with other sessions even if one fails
              console.error("Failed to revoke session:", error);
            }
          }
        }

        return {
          success: true,
          revokedCount: revokedTokens.length,
          revokedTokens,
        };
      },
      {}
    );
  },
};
