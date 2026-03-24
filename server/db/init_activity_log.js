const fs = require("fs");
const path = require("path");
const db = require("../config/db");

/**
 * Initialize the activity_log table
 */
async function initActivityLog() {
  try {
    console.log("Initializing activity_log table...");

    // Read activity schema SQL file
    const activitySchemaSQL = fs.readFileSync(
      path.join(__dirname, "activity_schema.sql"),
      "utf8"
    );

    // Execute schema SQL
    await db.query(activitySchemaSQL);

    console.log("Activity log table created successfully");

    return true;
  } catch (error) {
    console.error("Error initializing activity_log table:", error);
    throw error;
  }
}

// Export the function to be called from other files
module.exports = { initActivityLog };

// If this script is run directly, execute the initialization
if (require.main === module) {
  initActivityLog()
    .then(() => {
      console.log("Activity log initialization script completed");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Activity log initialization failed:", err);
      process.exit(1);
    });
}
