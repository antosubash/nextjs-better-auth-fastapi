import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins"
import { STORAGE_KEYS } from "./constants";
import { getCookie } from "./cookies";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
  fetchOptions: {
    auth: {
      type: "Bearer",
      token: () => getCookie(STORAGE_KEYS.SESSION_TOKEN) || "",
    },
  },
  plugins: [
    jwtClient() 
  ]
});