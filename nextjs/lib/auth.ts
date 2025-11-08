import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer, jwt, admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "./database";
import * as schema from "./auth-schema";
import { BETTER_AUTH_CONFIG, USER_ROLES } from "./constants";

const secret = process.env.BETTER_AUTH_SECRET || "change-me-in-production";

export const auth = betterAuth({
  secret,
  baseURL: BETTER_AUTH_CONFIG.BASE_URL,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    bearer(),
    jwt({
      jwt: {
        issuer: BETTER_AUTH_CONFIG.BASE_URL,
        audience: BETTER_AUTH_CONFIG.BASE_URL,
      },
    }),
    nextCookies(),
    admin({
      defaultRole: USER_ROLES.USER,
    }),
  ],
});
