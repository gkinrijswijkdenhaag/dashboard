import api from './api';

/**
 * Email Settings service for managing SMTP configuration
 */
const emailSettingsService = {
  /**
   * Get email settings
   * @returns {Promise} Promise with the settings
   */
  async getEmailSettings() {
    try {
      const response = await api.get('/email-settings');
      return response;
    } catch (error) {
      console.error('Error getting email settings:', error);
      throw error;
    }
  },

  /**
   * Update email settings
   * @param {Array} settings - Array of setting objects
   * @returns {Promise} Promise with the response
   */
  async updateEmailSettings(settings) {
    try {
      const response = await api.put('/email-settings', { settings });
      return response;
    } catch (error) {
      console.error('Error updating email settings:', error);
      throw error;
    }
  },

  /**
   * Test email configuration
   * @param {string} testEmail - Email address to send test to
   * @returns {Promise} Promise with the response
   */
  async testEmailSettings(testEmail) {
    try {
      const response = await api.post('/email-settings/test', { testEmail });
      return response;
    } catch (error) {
      console.error('Error testing email settings:', error);
      throw error;
    }
  }
};

export default emailSettingsService;