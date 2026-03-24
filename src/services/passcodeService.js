import api from './api';

/**
 * Service for managing role passcodes
 */
const passcodeService = {
  /**
   * Get all role passcodes (admin/treasurer only)
   * @returns {Promise} Promise with passcodes data
   */
  getAllPasscodes: async () => {
    try {
      return await api.get('/passcodes');
    } catch (error) {
      console.error('Error fetching passcodes:', error);
      throw error;
    }
  },
  
  /**
   * Update a role passcode (admin/treasurer only)
   * @param {string} role - Role ID
   * @param {string} passcode - New passcode
   * @returns {Promise} Promise with success message
   */
  updatePasscode: async (role, passcode) => {
    try {
      return await api.put('/passcodes', { role, passcode });
    } catch (error) {
      console.error('Error updating passcode:', error);
      throw error;
    }
  }
};

export default passcodeService;
