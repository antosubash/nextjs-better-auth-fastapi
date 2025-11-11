import { withErrorHandling } from "./utils";
import { getHeaders } from "./server-utils";
import { auth } from "../auth";

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
      const headersList = headers || await getHeaders();
      return await auth.api.getSession({ headers: headersList });
    });
  },

  /**
   * Get a JWT token for the current session
   * @param headers - Optional headers. If not provided, will use server headers (server-only)
   */
  async getToken(headers?: Headers) {
    return withErrorHandling("getToken", async () => {
      const headersList = headers || await getHeaders();
      return await auth.api.getToken({ headers: headersList });
    });
  },
};

