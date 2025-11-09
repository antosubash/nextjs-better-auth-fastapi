import "dotenv/config";
import { USER_ROLES } from "../lib/constants";
import { auth } from "../lib/auth";
import { db } from "../lib/database";
import { user } from "../auth-schema";
import { eq } from "drizzle-orm";

const SEED_USERS = [
  {
    email: "admin@example.com",
    password: "admin123",
    name: "Admin User",
    role: USER_ROLES.ADMIN,
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
  {
    email: "hannah.martinez@example.com",
    password: "user1234",
    name: "Hannah Martinez",
    role: USER_ROLES.USER,
  },
  {
    email: "hannah@example.com",
    password: "user1234",
    name: "Isaac Newton",
    role: USER_ROLES.USER,
  },
];

async function seedUsers() {
  console.log("Starting user seeding...");

  for (const userData of SEED_USERS) {
    try {
      const existingUsers = await db
        .select()
        .from(user)
        .where(eq(user.email, userData.email))
        .limit(1);

      if (existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        console.log(`⊘ User already exists: ${userData.email}, deleting...`);

        await db.delete(user).where(eq(user.id, existingUser.id));

        console.log(`✓ Deleted existing user: ${userData.email}`);
      }

      const result = await auth.api.signUpEmail({
        body: {
          name: userData.name,
          email: userData.email,
          password: userData.password,
        },
      });

      if (result.user?.id && userData.role) {
        await db
          .update(user)
          .set({ role: userData.role })
          .where(eq(user.id, result.user.id));
      }

      console.log(`✓ Created user: ${userData.email} (${userData.role})`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
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
