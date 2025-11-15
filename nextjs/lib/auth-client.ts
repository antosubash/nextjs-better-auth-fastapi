import {
  adminClient,
  apiKeyClient,
  jwtClient,
  organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { BETTER_AUTH_CONFIG } from "./constants";

export const authClient = createAuthClient({
  baseURL: BETTER_AUTH_CONFIG.BASE_URL,
  plugins: [jwtClient(), adminClient(), apiKeyClient(), organizationClient()],
});
