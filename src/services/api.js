/**
 * Base API configuration and helper functions
 */
import env from "../config/env";

// API base URL from environment config
const API_URL = env.API_URL;

/**
 * Get authentication token from localStorage
 * @returns {string|null} The JWT token or null if not found
 */
const getToken = () => {
  const user = localStorage.getItem("currentUser");
  if (user) {
    const parsedUser = JSON.parse(user);
    return parsedUser.token;
  }
  return null;
};

/**
 * Default headers for API requests
 * @param {boolean} includeAuth - Whether to include Authorization header
 * @returns {Object} Headers object
 */
const getHeaders = (includeAuth = true) => {
  const headers = {
    "Content-Type": "application/json",
  };

  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
};

/**
 * Generic API request function
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {Object} data - Request body
 * @param {boolean} includeAuth - Whether to include auth token
 * @returns {Promise} Response promise
 */
const apiRequest = async (
  endpoint,
  method = "GET",
  data = null,
  includeAuth = true
) => {
  const url = `${API_URL}${endpoint}`;

  const options = {
    method,
    headers: getHeaders(includeAuth),
  };

  if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);

    // Try to parse JSON response
    let result;
    try {
      const text = await response.text();
      // console.log(`Raw API response from ${url}:`, text.substring(0, 500));

      try {
        result = JSON.parse(text);
      } catch (jsonError) {
        console.error("JSON parse error:", jsonError);
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
      }
    } catch (parseError) {
      throw new Error(`Failed to parse response: ${parseError.message}`);
    }

    if (!response.ok) {
      // Special handling for authentication errors
      if (response.status === 401) {
        console.error(
          "Authentication error:",
          result.message || "Unauthorized"
        );
        // If it's an auth endpoint, don't redirect
        if (!endpoint.includes("/auth/")) {
          // console.log("Redirecting to login due to authentication error");
          // Clear user data
          localStorage.removeItem("currentUser");
          // Set session expired flag for login page to display message
          localStorage.setItem("sessionExpired", "true");
          // Use timeout to avoid state updates during render
          setTimeout(() => {
            window.location.href = "/login";
          }, 100);
        }
      }
      throw new Error(
        result.message ||
          `API request failed: ${response.status} ${response.statusText}`
      );
    }

    return result;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    // Add more context to the error
    if (
      error.name === "TypeError" &&
      error.message.includes("Failed to fetch")
    ) {
      console.error("Network error - Is the server running?");
    }
    throw error;
  }
};

export default {
  // Base request methods
  get: (endpoint, includeAuth = true) =>
    apiRequest(endpoint, "GET", null, includeAuth),
  post: (endpoint, data, includeAuth = true) =>
    apiRequest(endpoint, "POST", data, includeAuth),
  put: (endpoint, data, includeAuth = true) =>
    apiRequest(endpoint, "PUT", data, includeAuth),
  patch: (endpoint, data, includeAuth = true) =>
    apiRequest(endpoint, "PATCH", data, includeAuth),
  delete: (endpoint, includeAuth = true) =>
    apiRequest(endpoint, "DELETE", null, includeAuth),

  // Helper methods
  getBaseUrl: () => API_URL,
};
