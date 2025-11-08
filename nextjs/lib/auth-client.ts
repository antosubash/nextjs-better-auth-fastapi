import { createAuthClient } from "better-auth/react";
import { jwtClient, adminClient, organizationClient } from "better-auth/client/plugins";
import { BETTER_AUTH_CONFIG } from "./constants";

export const authClient = createAuthClient({
  baseURL: BETTER_AUTH_CONFIG.BASE_URL,
  plugins: [
    jwtClient(),
    adminClient(),
    organizationClient() 
  ],
});