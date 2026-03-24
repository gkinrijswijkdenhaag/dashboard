import api from './api';

/**
 * Authentication service for handling user login, logout and auth state
 */
const authService = {
  /**
   * Log in a user with username, role and passcode
   * @param {string} username - User's name
   * @param {string} role - User's role ID
   * @param {string} passcode - Role-specific passcode
   * @returns {Promise} Promise with user data including token
   */
  login: async (username, role, passcode) => {
    try {
      const response = await api.post('/auth/login', {
        username,
        role,
        passcode
      }, false);
      
      // Save user data to localStorage
      localStorage.setItem('currentUser', JSON.stringify(response));
      
      // Dispatch custom event to notify components of auth state change
      window.dispatchEvent(new CustomEvent('authStateChanged'));
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  /**
   * Log out the current user
   */
  logout: () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/login';
  },
  
  /**
   * Get the current logged in user
   * @returns {Object|null} User object or null if not logged in
   */
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('currentUser');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },
  
  /**
   * Check if user is authenticated
   * @returns {boolean} True if user is logged in
   */
  isAuthenticated: () => {
    return !!authService.getCurrentUser();
  },
  
  /**
   * Verify token is valid with the backend
   * @returns {Promise} Promise with user data if token is valid
   */
  verifyToken: async () => {
    try {
      return await api.get('/auth/verify');
    } catch (error) {
      // If token verification fails, log out the user
      authService.logout();
      throw error;
    }
  }
};

export default authService;
