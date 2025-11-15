import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, apiKey, bearer, jwt, organization } from "better-auth/plugins";
import * as schema from "../auth-schema";
import { BETTER_AUTH_CONFIG, USER_ROLES } from "./constants";
import { db } from "./database";
import {
  accessControl,
  adminRole,
  editorRole,
  memberRole,
  moderatorRole,
  myCustomRole,
  ownerRole,
  supportRole,
  viewerRole,
} from "./permissions";

const secret = process.env.BETTER_AUTH_SECRET || "change-me-in-production";

export const auth = betterAuth({
  secret,
  baseURL: BETTER_AUTH_CONFIG.BASE_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
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
    admin({
      defaultRole: USER_ROLES.USER,
      allowedRoles: [USER_ROLES.ADMIN],
      roles: {
        admin: adminRole,
        myCustomRole: myCustomRole,
        moderator: moderatorRole,
        editor: editorRole,
        viewer: viewerRole,
        support: supportRole,
      },
    }),
    organization({
      accessControl,
      roles: {
        member: memberRole,
        owner: ownerRole,
      },
      teams: {
        enabled: true,
      },
    }),
    apiKey(),
    nextCookies(),
  ],
});
