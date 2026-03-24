const { Pool } = require("pg");
const config = require("../config/config");

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function migrateUserEmail() {
  const client = await pool.connect();

  try {
    console.log("Starting user email migration...");

    // Begin transaction
    await client.query("BEGIN");

    // Check if email column already exists
    const columnExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email'
      );
    `);

    if (!columnExists.rows[0].exists) {
      // Add email column to users table
      await client.query("ALTER TABLE users ADD COLUMN email VARCHAR(255)");
      console.log("Added email column to users table");
    } else {
      console.log("Email column already exists in users table");
    }

    // Commit transaction
    await client.query("COMMIT");
    console.log("User email migration completed successfully");
  } catch (error) {
    // Rollback transaction on error
    await client.query("ROLLBACK");
    console.error("Error during user email migration:", error);
    throw error;
  } finally {
    // Release client
    client.release();
    // Close pool
    await pool.end();
  }
}

// Run the migration
migrateUserEmail().catch((err) => {
  console.error("Failed to migrate user email:", err);
  process.exit(1);
});
