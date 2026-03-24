import api from './api';

/**
 * Admin service for administrative operations
 */
const adminService = {
  /**
   * Clear all messages and related data
   * @returns {Promise} Promise with the response
   */
  async clearAllMessages() {
    try {
      const response = await api.post('/admin/clear-messages');
      return response;
    } catch (error) {
      console.error('Error clearing messages:', error);
      throw error;
    }
  },

  /**
   * Get message statistics
   * @returns {Promise} Promise with the statistics
   */
  async getMessageStats() {
    try {
      const response = await api.get('/admin/message-stats');
      return response;
    } catch (error) {
      console.error('Error getting message statistics:', error);
      throw error;
    }
  },

  /**
   * Get system status and health information
   * @returns {Promise} Promise with system status
   */
  async getSystemStatus() {
    try {
      const response = await api.get('/admin/system-status');
      return response;
    } catch (error) {
      console.error('Error getting system status:', error);
      throw error;
    }
  }
};

export default adminService;
