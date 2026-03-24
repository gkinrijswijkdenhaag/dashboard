const db = require("../config/db");
const fs = require("fs");
const path = require("path");

async function optimizeChatQueries() {
  try {
    console.log("Optimizing chat queries...");

    // Read and execute the optimization SQL file
    const optimizationSQL = fs.readFileSync(
      path.join(__dirname, "optimize_chat_queries.sql"),
      "utf8"
    );

    await db.query(optimizationSQL);

    console.log("Chat query optimization completed successfully!");
  } catch (error) {
    console.error("Error optimizing chat queries:", error);
    throw error;
  }
}

// Export for use in other files
module.exports = { optimizeChatQueries };

// Run optimization if this file is executed directly
if (require.main === module) {
  optimizeChatQueries()
    .then(() => {
      console.log("Chat optimization script completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Chat optimization script failed:", error);
      process.exit(1);
    });
}
