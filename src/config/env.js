/**
 * Environment configuration for the frontend
 * This file centralizes all environment variables used in the application
 */

const env = {
  // API URL - fallback to localhost if not defined
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
};

export default env;
