import { withErrorHandling, getHeaders } from "./utils";
import { auth } from "../auth";

/**
 * Email & Password authentication methods
 */
export const emailPasswordService = {
  /**
   * Sign up with email and password
   */
  async signUpEmail(params: {
    name: string;
    email: string;
    password: string;
    image?: string;
    callbackURL?: string;
  }) {
    return withErrorHandling(
      "signUpEmail",
      async () => {
        return await auth.api.signUpEmail({
          body: {
            name: params.name,
            email: params.email,
            password: params.password,
            image: params.image,
            callbackURL: params.callbackURL,
          },
        });
      },
      { email: params.email, name: params.name }
    );
  },

  /**
   * Sign in with email and password
   */
  async signInEmail(params: {
    email: string;
    password: string;
    rememberMe?: boolean;
    callbackURL?: string;
  }) {
    return withErrorHandling(
      "signInEmail",
      async () => {
        const headersList = await getHeaders();
        return await auth.api.signInEmail({
          headers: headersList,
          body: {
            email: params.email,
            password: params.password,
            rememberMe: params.rememberMe,
            callbackURL: params.callbackURL,
          },
        });
      },
      { email: params.email }
    );
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    return withErrorHandling("signOut", async () => {
      const headersList = await getHeaders();
      return await auth.api.signOut({ headers: headersList });
    });
  },

  /**
   * Send email verification link
   */
  async sendVerificationEmail(params: {
    email: string;
    callbackURL?: string;
  }) {
    return withErrorHandling(
      "sendVerificationEmail",
      async () => {
        const headersList = await getHeaders();
        return await auth.api.sendVerificationEmail({
          headers: headersList,
          body: {
            email: params.email,
            callbackURL: params.callbackURL,
          },
        });
      },
      { email: params.email }
    );
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(params: {
    email: string;
    redirectTo?: string;
  }) {
    return withErrorHandling(
      "requestPasswordReset",
      async () => {
        return await auth.api.requestPasswordReset({
          body: {
            email: params.email,
            redirectTo: params.redirectTo,
          },
        });
      },
      { email: params.email }
    );
  },

  /**
   * Reset password with token
   */
  async resetPassword(params: {
    newPassword: string;
    token: string;
  }) {
    return withErrorHandling(
      "resetPassword",
      async () => {
        return await auth.api.resetPassword({
          body: {
            newPassword: params.newPassword,
            token: params.token,
          },
        });
      },
      { hasToken: !!params.token }
    );
  },

  /**
   * Change password (requires current password)
   */
  async changePassword(params: {
    newPassword: string;
    currentPassword: string;
    revokeOtherSessions?: boolean;
  }) {
    return withErrorHandling(
      "changePassword",
      async () => {
        const headersList = await getHeaders();
        return await auth.api.changePassword({
          headers: headersList,
          body: {
            newPassword: params.newPassword,
            currentPassword: params.currentPassword,
            revokeOtherSessions: params.revokeOtherSessions,
          },
        });
      },
      { revokeOtherSessions: params.revokeOtherSessions }
    );
  },
};

