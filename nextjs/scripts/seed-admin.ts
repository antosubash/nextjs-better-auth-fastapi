import "dotenv/config";
import { USER_ROLES } from "../lib/constants";
import { db } from "../lib/database";
import { user, account } from "../lib/auth-schema";
import { eq } from "drizzle-orm";
import { generateId } from "better-auth/utils/id";
import { hash } from "bcryptjs";

const SEED_USERS = [
  {
    email: "[email protected]",
    password: "admin123",
    name: "Admin User",
    role: USER_ROLES.ADMIN,
  },
  {
    email: "[email protected]",
    password: "user123",
    name: "Test User 1",
    role: USER_ROLES.USER,
  },
  {
    email: "[email protected]",
    password: "user123",
    name: "Test User 2",
    role: USER_ROLES.USER,
  },
  {
    email: "[email protected]",
    password: "user123",
    name: "Test User 3",
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
        console.log(`⊘ User already exists: ${userData.email}`);
        continue;
      }

      const userId = generateId();
      const hashedPassword = await hash(userData.password, 10);

      await db.insert(user).values({
        id: userId,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        emailVerified: false,
      });

      await db.insert(account).values({
        id: generateId(),
        accountId: userData.email,
        providerId: "credential",
        userId: userId,
        password: hashedPassword,
      });

      console.log(`✓ Created user: ${userData.email} (${userData.role})`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`✗ Failed to create user ${userData.email}:`, errorMessage);
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

