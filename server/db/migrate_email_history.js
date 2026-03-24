const db = require("../config/db");
const fs = require("fs");
const path = require("path");

async function migrateEmailHistory() {
  try {
    console.log("Checking if email_history table exists...");

    // Check if the table already exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'email_history'
      );
    `;

    const tableExists = await db.query(checkTableQuery);
    
    if (tableExists.rows[0].exists) {
      console.log("email_history table already exists. Skipping migration.");
      return;
    }

    console.log("Creating email_history table...");

    // Read and execute the email history schema
    const emailHistorySchemaSQL = fs.readFileSync(
      path.join(__dirname, "email_history_schema.sql"),
      "utf8"
    );

    await db.query(emailHistorySchemaSQL);
    console.log("email_history table created successfully!");

  } catch (error) {
    console.error("Error migrating email_history table:", error);
    throw error;
  }
}

// Export for use in other files
module.exports = { migrateEmailHistory };

// Run migration if this file is executed directly
if (require.main === module) {
  migrateEmailHistory()
    .then(() => {
      console.log("Email history migration completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Email history migration failed:", error);
      process.exit(1);
    });
}