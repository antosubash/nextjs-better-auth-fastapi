import { withErrorHandling, getHeaders } from "./utils";
import { auth } from "../auth";

/**
 * Session-related methods
 */
export const sessionService = {
  /**
   * Get the current session
   */
  async getSession() {
    return withErrorHandling("getSession", async () => {
      const headersList = await getHeaders();
      return await auth.api.getSession({ headers: headersList });
    });
  },

  /**
   * Get a JWT token for the current session
   */
  async getToken() {
    return withErrorHandling("getToken", async () => {
      const headersList = await getHeaders();
      return await auth.api.getToken({ headers: headersList });
    });
  },
};

