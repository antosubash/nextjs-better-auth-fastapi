// Load .env from project root directory BEFORE any imports

import { resolve } from "node:path";
import { config } from "dotenv";

// This must execute before any other imports that depend on env vars
config({ path: resolve(process.cwd(), "../.env") });

// Wrap everything in an async IIFE to use dynamic imports
(async () => {
  // Now we can safely import modules that depend on environment variables
  const { USER_ROLES } = await import("../lib/constants");
  const { auth } = await import("../lib/auth");
  const { betterAuthService } = await import("../lib/better-auth-service");

  const SEED_USERS = [
    {
      email: "admin@example.com",
      password: "admin123",
      name: "Admin User",
      role: USER_ROLES.ADMIN,
    },
    {
      email: "owner@example.com",
      password: "user1234",
      name: "Owner User",
      role: USER_ROLES.OWNER,
    },
    {
      email: "member@example.com",
      password: "user1234",
      name: "Member User",
      role: USER_ROLES.MEMBER,
    },
    {
      email: "customrole@example.com",
      password: "user1234",
      name: "Custom Role User",
      role: USER_ROLES.MY_CUSTOM_ROLE,
    },
    {
      email: "user1@example.com",
      password: "user1234",
      name: "Test User 1",
      role: USER_ROLES.USER,
    },
    {
      email: "user2@example.com",
      password: "user1234",
      name: "Test User 2",
      role: USER_ROLES.USER,
    },
    {
      email: "user3@example.com",
      password: "user1234",
      name: "Test User 3",
      role: USER_ROLES.USER,
    },
    {
      email: "user4@example.com",
      password: "user1234",
      name: "Alice Johnson",
      role: USER_ROLES.USER,
    },
    {
      email: "user5@example.com",
      password: "user1234",
      name: "Bob Smith",
      role: USER_ROLES.USER,
    },
    {
      email: "user6@example.com",
      password: "user1234",
      name: "Charlie Brown",
      role: USER_ROLES.USER,
    },
    {
      email: "user7@example.com",
      password: "user1234",
      name: "Diana Prince",
      role: USER_ROLES.USER,
    },
    {
      email: "user8@example.com",
      password: "user1234",
      name: "Ethan Hunt",
      role: USER_ROLES.USER,
    },
    {
      email: "user9@example.com",
      password: "user1234",
      name: "Fiona Chen",
      role: USER_ROLES.USER,
    },
    {
      email: "user10@example.com",
      password: "user1234",
      name: "George Wilson",
      role: USER_ROLES.USER,
    },
  ];

  async function seedUsers() {
    console.log("Starting user seeding...");

    for (const userData of SEED_USERS) {
      try {
        // Check if user exists using Better Auth API
        const existingUsersResult = await betterAuthService.admin.listUsers({
          searchValue: userData.email,
          searchField: "email",
          searchOperator: "eq",
          limit: 1,
        });

        const existingUsers = (existingUsersResult as { users?: unknown[] })?.users || [];

        if (existingUsers.length > 0) {
          const existingUser = existingUsers[0] as { id?: string };
          if (existingUser.id) {
            console.log(`⊘ User already exists: ${userData.email}, deleting...`);

            // Delete user using Better Auth API
            await betterAuthService.admin.removeUser({ userId: existingUser.id });

            console.log(`✓ Deleted existing user: ${userData.email}`);
          }
        }

        // Create user - only pass role if it's admin (allowedRoles only includes admin)
        // For other roles, omit the role field to use defaultRole ("user"), then update via Better Auth API
        const createUserBody: {
          email: string;
          password: string;
          name: string;
          role?: ("admin" | "myCustomRole" | "moderator" | "editor" | "viewer" | "support")[];
        } = {
          email: userData.email,
          password: userData.password,
          name: userData.name,
        };

        // Only include role if it's admin (the only role in allowedRoles)
        if (userData.role === USER_ROLES.ADMIN) {
          createUserBody.role = ["admin"];
        }

        const newUser = await auth.api.createUser({
          body: createUserBody,
        });

        if (newUser?.user?.id) {
          // Update role if it's different from the default role (user) or admin
          // Use Better Auth API to set role
          const defaultRole =
            userData.role === USER_ROLES.ADMIN ? USER_ROLES.ADMIN : USER_ROLES.USER;
          if (userData.role !== defaultRole) {
            await betterAuthService.admin.setRole({
              userId: newUser.user.id,
              role: userData.role,
            });
          }
          console.log(`✓ Created user: ${userData.email} (${userData.role})`);
        } else {
          console.error(`✗ Failed to create user ${userData.email}:`, "Unknown error");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`✗ Failed to process user ${userData.email}:`, errorMessage);
      }
    }

    console.log("User seeding completed!");
  }

  seedUsers()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
})();
