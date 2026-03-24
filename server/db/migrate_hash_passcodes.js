const bcrypt = require("bcrypt");
const db = require("../config/db");

const BCRYPT_ROUNDS = 12;

/**
 * One-time migration: hash all plain-text passcodes in the role_passcodes table.
 * Safe to run multiple times — already-hashed rows are skipped.
 */
async function migrateHashPasscodes() {
  const client = await db.getClient();

  try {
    console.log("Checking for plain-text passcodes to hash...");

    const result = await client.query("SELECT id, role, passcode FROM role_passcodes");

    let migrated = 0;
    for (const row of result.rows) {
      const isAlreadyHashed =
        row.passcode.startsWith("$2b$") || row.passcode.startsWith("$2a$");

      if (!isAlreadyHashed) {
        const hashed = await bcrypt.hash(row.passcode, BCRYPT_ROUNDS);
        await client.query(
          "UPDATE role_passcodes SET passcode = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
          [hashed, row.id]
        );
        console.log(`✓ Hashed passcode for role: ${row.role}`);
        migrated++;
      }
    }

    if (migrated === 0) {
      console.log("All passcodes are already hashed — nothing to migrate.");
    } else {
      console.log(`Passcode hashing migration complete: ${migrated} row(s) updated.`);
    }
  } catch (error) {
    console.error("Error during passcode hashing migration:", error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { migrateHashPasscodes };
