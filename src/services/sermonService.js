import api from "./api";

/**
 * Service for managing sermon translations
 */
const sermonService = {
  /**
   * Get sermon by ID
   * @param {string} sermonId - ID of the sermon to fetch
   * @returns {Promise} Promise with sermon data
   */
  getSermonById: async (sermonId) => {
    try {
      return await api.get(`/sermon/${sermonId}`);
    } catch (error) {
      console.error(`Error fetching sermon ${sermonId}:`, error);
      throw error;
    }
  },

  /**
   * Get sermons for a specific service date
   * @param {string} dateString - Service date in YYYY-MM-DD format
   * @returns {Promise} Promise with sermons data for the specified date
   */
  getSermonsByDate: async (dateString) => {
    try {
      return await api.get(`/sermon/date/${dateString}`);
    } catch (error) {
      console.error(`Error fetching sermons for date ${dateString}:`, error);
      throw error;
    }
  },

  /**
   * Submit a sermon for translation
   * @param {string} dateString - Service date in YYYY-MM-DD format
   * @param {string} title - Sermon title
   * @param {string} documentLink - Link to the sermon document
   * @returns {Promise} Promise with submission result
   */
  submitSermon: async (dateString, title, documentLink) => {
    try {
      return await api.post("/sermon/submit", {
        dateString,
        title,
        documentLink,
      });
    } catch (error) {
      console.error("Error submitting sermon:", error);
      throw error;
    }
  },

  /**
   * Submit a sermon translation
   * @param {string} dateString - Service date in YYYY-MM-DD format
   * @param {string} originalSermonLink - Link to the original sermon document
   * @param {boolean} translationComplete - Whether the translation is complete
   * @param {object} translator - Translator information (id, name, role, avatar)
   * @returns {Promise} Promise with translation submission result
   */
  submitSermonTranslation: async (
    dateString,
    originalSermonLink,
    translationComplete,
    translator
  ) => {
    try {
      return await api.post(`/sermon/translate`, {
        dateString,
        originalSermonLink,
        translationComplete,
        translator,
      });
    } catch (error) {
      console.error("Error submitting sermon translation:", error);
      throw error;
    }
  },
};

export default sermonService;
