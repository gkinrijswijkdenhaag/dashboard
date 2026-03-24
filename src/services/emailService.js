import api from "./api";

/**
 * Service for handling email operations
 */
const emailService = {
  /**
   * Send an email
   * @param {Object} emailData - Email data
   * @param {string} emailData.to - Recipient email
   * @param {string} [emailData.cc] - CC recipients (optional)
   * @param {string} emailData.subject - Email subject
   * @param {string} emailData.message - Email message
   * @param {string} emailData.documentType - Type of document being sent
   * @param {string} emailData.documentLink - Link to the document
   * @returns {Promise} Promise with send result
   */
  sendEmail: async (emailData) => {
    try {
      return await api.post("/email/send", emailData);
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  },
};

export default emailService;
