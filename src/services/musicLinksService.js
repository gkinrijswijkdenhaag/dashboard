import api from "./api";

/**
 * Service for managing music links
 */
const musicLinksService = {
  /**
   * Get music links for a specific service date
   * @param {string} dateString - Service date in YYYY-MM-DD format
   * @returns {Promise} Promise with music links
   */
  getMusicLinks: async (dateString) => {
    try {
      return await api.get(`/music-links/${dateString}`);
    } catch (error) {
      console.error("Error fetching music links:", error);
      throw error;
    }
  },

  /**
   * Save music links for a specific service date
   * @param {string} dateString - Service date in YYYY-MM-DD format
   * @param {Array} musicLinks - Array of music link objects with name and url properties
   * @param {string} title - Optional title for the music collection
   * @param {string} notes - Optional notes about the music
   * @returns {Promise} Promise with saved music links
   */
  saveMusicLinks: async (dateString, musicLinks, title, notes) => {
    try {
      return await api.post(`/music-links/${dateString}`, {
        musicLinks,
        title,
        notes,
      });
    } catch (error) {
      console.error("Error saving music links:", error);
      throw error;
    }
  },

  /**
   * Delete music links for a specific service date
   * @param {string} dateString - Service date in YYYY-MM-DD format
   * @returns {Promise} Promise with delete result
   */
  deleteMusicLinks: async (dateString) => {
    try {
      return await api.delete(`/music-links/${dateString}`);
    } catch (error) {
      console.error("Error deleting music links:", error);
      throw error;
    }
  },
};

export default musicLinksService;
