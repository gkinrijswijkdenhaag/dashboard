require("dotenv").config();

// In production, refuse to start with insecure fallback secrets
if (process.env.NODE_ENV === "production") {
  if (!process.env.JWT_SECRET) {
    throw new Error("FATAL: JWT_SECRET environment variable is not set. Refusing to start in production.");
  }
  if (!process.env.EMAIL_ENCRYPTION_KEY) {
    throw new Error("FATAL: EMAIL_ENCRYPTION_KEY environment variable is not set. Refusing to start in production.");
  }
}

module.exports = {
  port: process.env.PORT || 5000,
  jwtSecret:
    process.env.JWT_SECRET || "gkin_jwt_secret_key_change_in_production",
  jwtExpiration: process.env.JWT_EXPIRATION || "1d",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};
