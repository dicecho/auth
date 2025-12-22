/**
 * User Migration Script
 *
 * Migrates users from the legacy MongoDB database to the new PostgreSQL database.
 * Supports incremental updates - running multiple times will not create duplicate data.
 *
 * Usage:
 *   pnpm migrate:users           # Run migration
 *   pnpm migrate:users:dry       # Dry run (preview only)
 *
 * Or directly:
 *   npx tsx scripts/migrate-users.ts [options]
 *
 * Environment variables required (create .env file):
 *   MONGODB_URI - MongoDB connection string (legacy database)
 *   DATABASE_URL - PostgreSQL connection string (new database)
 *
 * Options:
 *   --dry-run    Preview changes without writing to database
 *   --batch=N    Process N users at a time (default: 100)
 *   --skip=N     Skip first N users (for resuming)
 */

import { config } from "dotenv";
config(); // Load .env file

import { MongoClient, type Collection } from "mongodb";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import * as schema from "../packages/db/src/schema/auth";

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const BATCH_SIZE = parseInt(
  args.find((a) => a.startsWith("--batch="))?.split("=")[1] ?? "100"
);
const SKIP = parseInt(
  args.find((a) => a.startsWith("--skip="))?.split("=")[1] ?? "0"
);

// Environment variables
const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_URL = process.env.DATABASE_URL;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI environment variable is required");
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error("Error: DATABASE_URL environment variable is required");
  process.exit(1);
}

// Legacy user interface (MongoDB)
interface LegacyUser {
  _id: { toString(): string };
  email: string;
  nickName?: string;
  password?: string;
  salt?: string;
  verified?: boolean;
  avatarUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastLoginAt?: Date;
}

// Statistics
interface MigrationStats {
  total: number;
  migrated: number;
  skipped: number;
  updated: number;
  errors: number;
}

const stats: MigrationStats = {
  total: 0,
  migrated: 0,
  skipped: 0,
  updated: 0,
  errors: 0,
};

/**
 * Format legacy password to the new format
 * New format: "legacy-md5:{salt}:{md5hash}"
 */
function formatLegacyPassword(password: string, salt: string): string {
  return `legacy-md5:${salt}:${password}`;
}

/**
 * Generate a deterministic ID from MongoDB ObjectId
 * This ensures the same user always gets the same ID
 */
function generateUserId(mongoId: string): string {
  // Use a prefix to make it identifiable as migrated
  return `migrated_${mongoId}`;
}

/**
 * Migrate a single user
 */
async function migrateUser(
  legacyUser: LegacyUser,
  db: ReturnType<typeof drizzle>
): Promise<"migrated" | "skipped" | "updated" | "error"> {
  const email = legacyUser.email?.toLowerCase();

  if (!email) {
    console.warn(`  Skipping user ${legacyUser._id}: No email`);
    return "error";
  }

  try {
    // Check if user already exists
    const existingUser = await db.query.user.findFirst({
      where: eq(schema.user.email, email),
    });

    if (existingUser) {
      // User exists - check if we need to update
      // For now, we skip existing users to ensure idempotency
      console.log(`  Skipping existing user: ${email}`);
      return "skipped";
    }

    // Generate new user ID (deterministic based on MongoDB ID)
    const userId = generateUserId(legacyUser._id.toString());

    // Prepare user data
    const userData = {
      id: userId,
      name: legacyUser.nickName || email.split("@")[0] || "User",
      email: email,
      emailVerified: legacyUser.verified ?? false,
      image: legacyUser.avatarUrl || null,
      locale: "zh", // Default locale for migrated users
      createdAt: legacyUser.createdAt || new Date(),
      updatedAt: legacyUser.updatedAt || new Date(),
    };

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would create user: ${email}`);
      return "migrated";
    }

    // Insert user
    await db.insert(schema.user).values(userData);

    // Create credential account if password exists
    if (legacyUser.password && legacyUser.salt) {
      const accountId = randomUUID();
      const formattedPassword = formatLegacyPassword(
        legacyUser.password,
        legacyUser.salt
      );

      await db.insert(schema.account).values({
        id: accountId,
        accountId: email,
        providerId: "credential",
        userId: userId,
        password: formattedPassword,
        createdAt: legacyUser.createdAt || new Date(),
        updatedAt: legacyUser.updatedAt || new Date(),
      });
    }

    console.log(`  Migrated user: ${email}`);
    return "migrated";
  } catch (error) {
    console.error(`  Error migrating user ${email}:`, error);
    return "error";
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log("=".repeat(60));
  console.log("User Migration Script");
  console.log("=".repeat(60));
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no changes will be made)" : "LIVE"}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Skip: ${SKIP}`);
  console.log("");

  // Connect to MongoDB
  console.log("Connecting to MongoDB...");
  const mongoClient = new MongoClient(MONGODB_URI!);
  await mongoClient.connect();
  const mongodb = mongoClient.db();
  const usersCollection: Collection<LegacyUser> = mongodb.collection("users");

  // Connect to PostgreSQL
  console.log("Connecting to PostgreSQL...");
  const sql = neon(DATABASE_URL!);
  const db = drizzle(sql, { schema });

  try {
    // Get total count
    stats.total = await usersCollection.countDocuments({ verified: true });
    console.log(`\nTotal verified users to migrate: ${stats.total}`);
    console.log("");

    // Process in batches
    let processed = 0;
    let batch = 0;

    const cursor = usersCollection
      .find({ verified: true })
      .sort({ createdAt: 1 })
      .skip(SKIP);

    const users: LegacyUser[] = [];

    // Fetch all users into memory (or use streaming for very large datasets)
    for await (const user of cursor) {
      users.push(user);
    }

    console.log(`Fetched ${users.length} users from MongoDB`);
    console.log("");

    // Process in batches
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      batch++;
      const batchUsers = users.slice(i, i + BATCH_SIZE);
      console.log(
        `\nProcessing batch ${batch} (${i + 1} - ${Math.min(i + BATCH_SIZE, users.length)} of ${users.length})...`
      );

      for (const user of batchUsers) {
        const result = await migrateUser(user, db);
        stats[result === "error" ? "errors" : result]++;
        processed++;
      }

      // Progress update
      const progress = ((processed / users.length) * 100).toFixed(1);
      console.log(`  Progress: ${progress}% (${processed}/${users.length})`);
    }
  } finally {
    // Cleanup
    await mongoClient.close();
  }

  // Print summary
  console.log("");
  console.log("=".repeat(60));
  console.log("Migration Summary");
  console.log("=".repeat(60));
  console.log(`Total users:     ${stats.total}`);
  console.log(`Migrated:        ${stats.migrated}`);
  console.log(`Skipped:         ${stats.skipped}`);
  console.log(`Updated:         ${stats.updated}`);
  console.log(`Errors:          ${stats.errors}`);
  console.log("=".repeat(60));

  if (DRY_RUN) {
    console.log("\nThis was a DRY RUN. No changes were made to the database.");
    console.log("Run without --dry-run to perform the actual migration.");
  }
}

// Run migration
migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
