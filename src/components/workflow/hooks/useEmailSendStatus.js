// src/components/workflow/hooks/useEmailSendStatus.js
import { useState, useEffect, useMemo } from "react";
import emailHistoryService from "../../../services/emailHistoryService";
import { useWorkflow } from "../context/WorkflowContext";

/**
 * Custom hook to check if emails have been sent for specific document types
 * @param {string} serviceDate - The service date to check
 * @param {Array} documentTypes - Array of document types to check
 * @returns {Object} Object containing send status for each document type and recipient type
 */
export const useEmailSendStatus = (serviceDate, documentTypes = []) => {
  const [emailSendStatus, setEmailSendStatus] = useState({});
  const [loading, setLoading] = useState(false);

  // Get refresh trigger from WorkflowContext
  const { emailStatusRefreshTrigger } = useWorkflow();

  // Memoize the document types key to prevent unnecessary re-renders
  const documentTypesKey = useMemo(
    () => documentTypes.join(","),
    [documentTypes]
  );

  useEffect(() => {
    if (!serviceDate || documentTypes.length === 0) {
      return;
    }

    const checkEmailSendStatus = async () => {
      setLoading(true);
      const statusResults = {};

      try {
        // Check for each document type and recipient type combination
        for (const documentType of documentTypes) {
          statusResults[documentType] = {};

          // Check pastor emails
          const pastorStatus = await emailHistoryService.getEmailSendStatus(
            documentType,
            serviceDate,
            "pastor"
          );
          statusResults[documentType].pastor = pastorStatus.data;

          // Check music emails
          const musicStatus = await emailHistoryService.getEmailSendStatus(
            documentType,
            serviceDate,
            "music"
          );
          statusResults[documentType].music = musicStatus.data;
        }

        setEmailSendStatus(statusResults);
      } catch (error) {
        console.error("Error checking email send status:", error);
        // On error, set empty status to avoid showing incorrect information
        setEmailSendStatus({});
      } finally {
        setLoading(false);
      }
    };

    checkEmailSendStatus();
  }, [serviceDate, documentTypesKey, emailStatusRefreshTrigger]); // Use memoized key instead of join

  /**
   * Get send status for a specific document type and recipient type
   * @param {string} documentType - The document type
   * @param {string} recipientType - The recipient type ('pastor' or 'music')
   * @returns {Object} Send status object
   */
  const getSendStatus = (documentType, recipientType) => {
    return (
      emailSendStatus[documentType]?.[recipientType] || {
        hasSent: false,
        lastSentBy: null,
        lastSentAt: null,
        emailCount: 0,
      }
    );
  };

  /**
   * Refresh the email send status (useful after sending a new email)
   */
  const refreshStatus = async () => {
    if (!serviceDate || documentTypes.length === 0) return;

    setLoading(true);
    const statusResults = {};

    try {
      for (const documentType of documentTypes) {
        statusResults[documentType] = {};

        const pastorStatus = await emailHistoryService.getEmailSendStatus(
          documentType,
          serviceDate,
          "pastor"
        );
        statusResults[documentType].pastor = pastorStatus.data;

        const musicStatus = await emailHistoryService.getEmailSendStatus(
          documentType,
          serviceDate,
          "music"
        );
        statusResults[documentType].music = musicStatus.data;
      }

      setEmailSendStatus(statusResults);
    } catch (error) {
      console.error("Error refreshing email send status:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    emailSendStatus,
    getSendStatus,
    refreshStatus,
    loading,
  };
};
