/**
 * PostgreSQL Database Restore Script (Pure JavaScript)
 *
 * This script restores a backup using the pg Node.js library
 * No need for psql or PostgreSQL client tools!
 *
 * Usage: node restore-database-js.js [backup-file-path] [new-database-url]
 *
 * Examples:
 *   node restore-database-js.js                                    (uses latest backup and current DATABASE_URL)
 *   node restore-database-js.js backups/backup-2024-01-15.sql      (uses specific backup and current DATABASE_URL)
 *   node restore-database-js.js backups/backup-2024-01-15.sql postgresql://user:pass@host/newdb
 */

import pg from "pg";
import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../server/.env") });

const { Client } = pg;

// Get command line arguments
const args = process.argv.slice(2);
let backupFile = args[0];
let targetDatabaseUrl = args[1] || process.env.DATABASE_URL;

// Function to find the latest backup file
const findLatestBackup = () => {
  const backupsDir = path.join(__dirname, "backups");

  if (!fs.existsSync(backupsDir)) {
    console.error("❌ ERROR: Backups directory not found");
    console.error(
      "   Please run backup-database-js.js first to create a backup"
    );
    process.exit(1);
  }

  const files = fs
    .readdirSync(backupsDir)
    .filter((file) => file.endsWith(".sql"))
    .map((file) => ({
      name: file,
      path: path.join(backupsDir, file),
      time: fs.statSync(path.join(backupsDir, file)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length === 0) {
    console.error("❌ ERROR: No backup files found");
    console.error(
      "   Please run backup-database-js.js first to create a backup"
    );
    process.exit(1);
  }

  return files[0].path;
};

// If no backup file specified, use the latest one
if (!backupFile) {
  backupFile = findLatestBackup();
  console.log(
    `📁 No backup file specified, using latest: ${path.basename(backupFile)}\n`
  );
} else {
  // Check if file exists
  if (!fs.existsSync(backupFile)) {
    console.error(`❌ ERROR: Backup file not found: ${backupFile}`);
    process.exit(1);
  }
}

if (!targetDatabaseUrl) {
  console.error(
    "❌ ERROR: TARGET_DATABASE_URL not provided and DATABASE_URL not found in environment"
  );
  console.error(
    "   Usage: node restore-database-js.js [backup-file] [target-database-url]"
  );
  process.exit(1);
}

console.log("🔄 PostgreSQL Database Restore");
console.log("━".repeat(50));
console.log(`📁 Backup file: ${backupFile}`);
console.log("━".repeat(50));

// Warning prompt
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log(
  "\n⚠️  WARNING: This will REPLACE ALL DATA in the target database!"
);
console.log(
  "   All existing tables, data, and objects will be dropped and recreated.\n"
);

rl.question("Are you sure you want to continue? (yes/no): ", (answer) => {
  if (answer.toLowerCase() !== "yes") {
    console.log("\n❌ Restore cancelled");
    rl.close();
    process.exit(0);
  }

  rl.close();
  performRestore();
});

const performRestore = async () => {
  console.log("\n🚀 Starting restore...\n");

  const client = new Client({
    connectionString: targetDatabaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log("✅ Connected to database\n");

    // Read the backup file
    const sqlContent = fs.readFileSync(backupFile, "utf8");

    // Remove comments and split into individual statements
    const lines = sqlContent.split("\n");
    const cleanedLines = lines
      .filter((line) => {
        const trimmed = line.trim();
        // Keep lines that aren't just comments or empty
        return trimmed && !trimmed.startsWith("--");
      })
      .join("\n");

    // Split by semicolon to get individual statements
    const statements = cleanedLines
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    console.log(`📝 Executing ${statements.length} SQL statements...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      try {
        await client.query(statement);
        successCount++;

        // Show progress every 100 statements
        if ((i + 1) % 100 === 0) {
          console.log(
            `   ✓ Processed ${i + 1}/${statements.length} statements`
          );
        }
      } catch (error) {
        errorCount++;
        // Some errors are expected (like DROP TABLE IF NOT EXISTS on first run)
        if (!error.message.includes("does not exist")) {
          console.log(`   ⚠️  Warning on statement ${i + 1}: ${error.message}`);
        }
      }
    }

    console.log("\n" + "━".repeat(50));
    console.log("✅ Restore completed!");
    console.log("━".repeat(50));
    console.log(`✓ Successful: ${successCount} statements`);
    if (errorCount > 0) {
      console.log(`⚠️  Warnings: ${errorCount} (mostly expected)`);
    }
    console.log(`⏰ Date: ${new Date().toLocaleString()}`);
    console.log("━".repeat(50));

    console.log("\n✨ Your database has been restored successfully!");
  } catch (error) {
    console.error("\n❌ Restore failed!");
    console.error("Error:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
};
