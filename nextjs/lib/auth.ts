import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer, jwt } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "./database";
import * as schema from "./auth-schema";

const secret = process.env.BETTER_AUTH_SECRET || "change-me-in-production";

export const auth = betterAuth({
  secret,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [bearer(), jwt(), nextCookies()],
});