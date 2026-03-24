import api from "./api";

/**
 * Service for managing lyrics translations
 */
const lyricsService = {
  /**
   * Get all lyrics that need translation
   * @returns {Promise} Promise with lyrics data
   */
  getAllLyrics: async () => {
    try {
      return await api.get("/lyrics");
    } catch (error) {
      console.error("Error fetching lyrics for translation:", error);
      throw error;
    }
  },

  /**
   * Get lyrics for a specific service date
   * @param {string} dateString - Service date in YYYY-MM-DD format
   * @returns {Promise} Promise with lyrics data for the specified date
   */
  getLyricsByDate: async (dateString) => {
    try {
      const response = await api.get(`/lyrics/${dateString}`);
      // console.log(`Lyrics service response for ${dateString}:`, response);
      return response;
    } catch (error) {
      console.error(`Error fetching lyrics for date ${dateString}:`, error);
      // If it's a 404 error, return an empty result instead of throwing
      if (error.message && error.message.includes("Service not found")) {
        return { dateString, lyrics: [], message: "No service found for this date yet" };
      }
      throw error;
    }
  },

  /**
   * Submit new lyrics for translation
   * @param {string} dateString - Service date in YYYY-MM-DD format
   * @param {Array} songs - Array of song objects with title and lyrics
   * @returns {Promise} Promise with submission result
   */
  submitLyrics: async (dateString, songs) => {
    try {
      return await api.post("/lyrics/submit", {
        dateString,
        songs,
      });
    } catch (error) {
      console.error("Error submitting lyrics:", error);
      throw error;
    }
  },

  /**
   * Submit translation for lyrics
   * @param {string} originalId - ID of the original lyrics
   * @param {string} translatedTitle - Translated title
   * @param {string} translatedLyrics - Translated lyrics
   * @returns {Promise} Promise with translation submission result
   */
  submitTranslation: async (originalId, translatedTitle, translatedLyrics) => {
    try {
      return await api.post(`/lyrics/translate/${originalId}`, {
        translatedTitle,
        translatedLyrics,
      });
    } catch (error) {
      console.error("Error submitting translation:", error);
      throw error;
    }
  },

  /**
   * Approve a translation
   * @param {string} translationId - ID of the translation to approve
   * @returns {Promise} Promise with approval result
   */
  approveTranslation: async (translationId) => {
    try {
      return await api.post(`/lyrics/approve/${translationId}`);
    } catch (error) {
      console.error("Error approving translation:", error);
      throw error;
    }
  },
};

export default lyricsService;
