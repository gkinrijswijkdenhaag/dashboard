const { Pool } = require("pg");
const config = require("./config");

// Create a connection pool
const dbUrl = process.env.DATABASE_URL || '';
const isLocalDb = !dbUrl || dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
// Use SSL whenever connecting to a remote database (Render, Railway, etc.),
// regardless of NODE_ENV — so local dev pointing at a remote DB also works.
const sslConfig = isLocalDb ? false : { rejectUnauthorized: false };

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
  connectionTimeoutMillis: 60000, // 60 second timeout
  idleTimeoutMillis: 10000, // Shorter idle timeout
  query_timeout: 60000, // Query timeout
  max: 5, // Reduce max connections for free tier
  min: 1, // Keep at least 1 connection alive
  // Add retry logic
  keepAlive: true,
  keepAliveInitialDelayMillis: 3000,
});

// Test the connection on startup with retry logic
(async () => {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      console.log(
        `Attempting database connection (attempt ${
          retryCount + 1
        }/${maxRetries})...`
      );
      const res = await pool.query("SELECT NOW()");
      console.log("✅ Database connected successfully at:", res.rows[0].now);
      break;
    } catch (err) {
      retryCount++;
      console.error(
        `❌ Database connection attempt ${retryCount} failed:`,
        err.message
      );

      if (retryCount >= maxRetries) {
        console.error(
          "⚠️  Could not connect to database after",
          maxRetries,
          "attempts"
        );
        console.error("Please check:");
        console.error("1. DATABASE_URL is correct in .env file");
        console.error(
          "2. Database server is running (Render.com free tier may need time to wake up)"
        );
        console.error("3. Network/firewall allows connection");
      } else {
        console.log(`Waiting 3 seconds before retry...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }
})();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  getClient: async () => await pool.connect(),
};
