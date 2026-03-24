const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const config = require("../config/config");

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function migratePasscodes() {
  const client = await pool.connect();

  try {
    console.log("Starting passcode migration...");

    // Begin transaction
    await client.query("BEGIN");

    // Read and execute the schema SQL file
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, "passcodes_schema.sql"),
      "utf8"
    );
    await client.query(schemaSQL);
    console.log("Created role_passcodes table");

    // Check if we already have passcodes in the database
    const existingPasscodes = await client.query(
      "SELECT COUNT(*) FROM role_passcodes"
    );

    if (parseInt(existingPasscodes.rows[0].count) === 0) {
      console.log(
        "No existing passcodes found, inserting default values from config..."
      );

      // Insert passcodes from config
      for (const [role, passcode] of Object.entries(config.passcodes)) {
        await client.query(
          "INSERT INTO role_passcodes (role, passcode) VALUES ($1, $2)",
          [role, passcode]
        );
        console.log(`Added passcode for role: ${role}`);
      }
    } else {
      console.log(
        `Found ${existingPasscodes.rows[0].count} existing passcodes, skipping insertion`
      );
    }

    // Commit transaction
    await client.query("COMMIT");
    console.log("Passcode migration completed successfully");
  } catch (error) {
    // Rollback transaction on error
    await client.query("ROLLBACK");
    console.error("Error during passcode migration:", error);
    throw error;
  } finally {
    // Release client
    client.release();
    // Close pool
    pool.end();
  }
}

// Run the migration
migratePasscodes().catch((err) => {
  console.error("Failed to migrate passcodes:", err);
  process.exit(1);
});
