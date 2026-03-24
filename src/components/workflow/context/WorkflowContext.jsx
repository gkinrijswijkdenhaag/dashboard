// src/components/workflow/context/WorkflowContext.jsx
import { createContext, useState, useContext, useEffect, useMemo } from "react";
import workflowService from "../../../services/workflowService";
import lyricsService from "../../../services/lyricsService";
import musicLinksService from "../../../services/musicLinksService";
import emailHistoryService from "../../../services/emailHistoryService";

const WorkflowContext = createContext();

export const useWorkflow = () => useContext(WorkflowContext);

// Define document types outside to prevent re-creation
const EMAIL_DOCUMENT_TYPES = ["concept", "final", "sermon"];

export const WorkflowProvider = ({
  children,
  service,
  currentUserRole,
  onStartAction,
  dateString,
  refreshKey,
}) => {
  // State for loading status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for triggering email status refresh
  const [emailStatusRefreshTrigger, setEmailStatusRefreshTrigger] = useState(0);

  // State for email send status (shared across all TaskCards)
  const [emailSendStatus, setEmailSendStatus] = useState({});
  const [emailStatusLoading, setEmailStatusLoading] = useState(false);

  // State for QR code status
  const [qrCodeStatus, setQrCodeStatus] = useState("pending");

  // State for completed tasks
  const [completedTasks, setCompletedTasks] = useState({
    // Document links (empty by default, will be populated from input)
    documentLinks: {
      concept: "",
      sermon: "",
      final: "",
      qrcode: "",
      slides: "",
      music: "",
    },
  });

  // Modal states
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isSermonModalOpen, setIsSermonModalOpen] = useState(false);
  const [currentDocumentType, setCurrentDocumentType] = useState("concept");
  const [isSendToPastorModalOpen, setIsSendToPastorModalOpen] = useState(false);
  const [currentDocumentToSend, setCurrentDocumentToSend] = useState(null);
  const [isSendToMusicModalOpen, setIsSendToMusicModalOpen] = useState(false);
  const [currentDocumentToSendMusic, setCurrentDocumentToSendMusic] =
    useState(null);
  const [isSermonUploadModalOpen, setIsSermonUploadModalOpen] = useState(false);
  const [isPastorNotifyModalOpen, setIsPastorNotifyModalOpen] = useState(false);
  const [currentDocumentToNotify, setCurrentDocumentToNotify] = useState(null);
  const [isLyricsModalOpen, setIsLyricsModalOpen] = useState(false);
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);
  const [currentLyrics, setCurrentLyrics] = useState(null);
  const [isViewTranslatedLyricsModalOpen, setIsViewTranslatedLyricsModalOpen] =
    useState(false);
  const [isSermonTranslationModalOpen, setIsSermonTranslationModalOpen] =
    useState(false);
  const [currentSermon, setCurrentSermon] = useState(null);
  const [isSlidesUploadModalOpen, setIsSlidesUploadModalOpen] = useState(false);
  const [isQrCodeModalOpen, setIsQrCodeModalOpen] = useState(false);
  const [isMusicUploadModalOpen, setIsMusicUploadModalOpen] = useState(false);
  const [isEditDocumentLinkModalOpen, setIsEditDocumentLinkModalOpen] =
    useState(false);
  const [isEditMusicLinksModalOpen, setIsEditMusicLinksModalOpen] =
    useState(false);
  const [isViewMusicLinksModalOpen, setIsViewMusicLinksModalOpen] =
    useState(false);
  const [documentToEdit, setDocumentToEdit] = useState(null);
  const [musicLinksToEdit, setMusicLinksToEdit] = useState(null);
  const [musicLinksToView, setMusicLinksToView] = useState(null);
  const [isFetchingMusicLinks, setIsFetchingMusicLinks] = useState(false);

  // Fetch email send status once for all tasks (shared state)
  useEffect(() => {
    if (!dateString) return;

    const fetchEmailSendStatus = async () => {
      setEmailStatusLoading(true);
      const statusResults = {};

      try {
        // Fire all 6 requests in parallel (3 doc types × 2 recipients)
        const requests = EMAIL_DOCUMENT_TYPES.flatMap((documentType) => [
          emailHistoryService
            .getEmailSendStatus(documentType, dateString, "pastor")
            .then((res) => ({ documentType, recipient: "pastor", data: res.data })),
          emailHistoryService
            .getEmailSendStatus(documentType, dateString, "music")
            .then((res) => ({ documentType, recipient: "music", data: res.data })),
        ]);

        const results = await Promise.all(requests);

        results.forEach(({ documentType, recipient, data }) => {
          if (!statusResults[documentType]) statusResults[documentType] = {};
          statusResults[documentType][recipient] = data;
        });

        setEmailSendStatus(statusResults);
      } catch (error) {
        console.error("Error checking email send status:", error);
        setEmailSendStatus({});
      } finally {
        setEmailStatusLoading(false);
      }
    };

    fetchEmailSendStatus();
  }, [dateString, emailStatusRefreshTrigger]);

  // Load workflow tasks for the current service
  useEffect(() => {
    const fetchWorkflowTasks = async () => {
      if (!dateString) return;

      setLoading(true);
      setError(null);

      // Reset QR code status when date changes
      setQrCodeStatus("pending");

      try {
        const response = await workflowService.getWorkflowTasks(dateString);

        // Also check if there are any translated lyrics for this date
        let hasTranslatedLyrics = false;
        try {
          const lyricsResponse = await lyricsService.getLyricsByDate(
            dateString
          );
          if (lyricsResponse && lyricsResponse.lyrics) {
            // Check if any lyrics have translations
            hasTranslatedLyrics = lyricsResponse.lyrics.some(
              (lyric) =>
                lyric.translation &&
                (lyric.translation.status === "completed" ||
                  lyric.translation.status === "approved")
            );
          }
        } catch (lyricsErr) {
          // If there's an error or no lyrics, we'll assume no translations
          console.log("No lyrics found or error fetching lyrics:", lyricsErr);
          // Don't treat this as a fatal error, just continue with hasTranslatedLyrics = false
        }

        // Check for sermon translations
        let hasSermonTranslation = false;
        try {
          // Check if we have a completed sermon translation task
          hasSermonTranslation = !!(
            response.tasks &&
            (response.tasks["translate-sermon"]?.status === "completed" ||
              response.tasks["translate_sermon"]?.status === "completed")
          );
        } catch (sermonErr) {
          console.log("Error checking sermon translation status:", sermonErr);
        }

        if (response && response.tasks) {
          // Reset completedTasks and only include tasks for the current date
          const tasks = {
            documentLinks: {}, // Keep an empty documentLinks object for backward compatibility
            ...response.tasks,
          };

          // If we have translated lyrics but the task isn't marked as completed,
          // mark it as completed
          if (
            hasTranslatedLyrics &&
            (!tasks["translate_lyrics"] ||
              tasks["translate_lyrics"].status !== "completed")
          ) {
            tasks["translate_lyrics"] = {
              status: "completed",
              updatedAt: new Date().toISOString(),
              updatedBy: "translator",
            };
          }

          // Normalize the sermon translation task ID to ensure consistency
          // First, check if we have either format of the task ID
          const hasHyphenatedTask = !!tasks["translate-sermon"];
          const hasUnderscoreTask = !!tasks["translate_sermon"];

          // If we have the hyphenated version, use it as the standard
          if (hasHyphenatedTask) {
            const taskData = tasks["translate-sermon"];
            // Make sure both formats point to the same data
            tasks["translate_sermon"] = taskData;
          }
          // If we only have the underscore version, copy it to the hyphenated version
          else if (hasUnderscoreTask) {
            const taskData = tasks["translate_sermon"];
            tasks["translate-sermon"] = taskData;
          }
          // If we have sermon translation data from the API but no task, create it
          else if (hasSermonTranslation) {
            const translationTask = {
              status: "completed",
              updatedAt: new Date().toISOString(),
              updatedBy: "translator",
            };
            tasks["translate-sermon"] = translationTask;
            tasks["translate_sermon"] = translationTask;
          }

          setCompletedTasks(tasks);

          // Special handling for qrcode status
          if (response.tasks.qrcode) {
            setQrCodeStatus(response.tasks.qrcode.status);
          } else {
            // Reset QR code status to pending when there's no QR code task for this date
            setQrCodeStatus("pending");
          }
        }
      } catch (err) {
        console.error("Error fetching workflow tasks:", err);
        setError("Failed to load workflow tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflowTasks();
  }, [dateString, refreshKey]);

  // Load music links for the current service date
  useEffect(() => {
    const fetchMusicLinks = async () => {
      if (!dateString) return;

      try {
        // Fetch music links from the API
        const response = await musicLinksService.getMusicLinks(dateString);
        const apiMusicLinks = response.musicLinks || [];

        // If we have links from the API, update the completedTasks state
        if (apiMusicLinks.length > 0) {
          setCompletedTasks((prev) => {
            // If we already have a music task, update it with the API data
            if (prev.music) {
              return {
                ...prev,
                music: {
                  ...prev.music,
                  musicLinks: apiMusicLinks,
                  // Keep other properties like status, documentLink, etc.
                },
              };
            }
            // If we don't have a music task yet, don't add one
            return prev;
          });
        }
      } catch (error) {
        console.error("Error fetching music links on init:", error);
        // No need to show an error to the user, just log it
      }
    };

    fetchMusicLinks();
  }, [dateString]);

  // Update task status in the backend
  const updateTaskStatus = async (taskId, status, documentLink, assignedTo) => {
    if (!dateString) return;

    try {
      const response = await workflowService.updateTaskStatus(
        dateString,
        taskId,
        status,
        documentLink,
        assignedTo
      );

      // Get current timestamp for local updates
      const updatedAt = new Date().toISOString();
      const userRole =
        typeof currentUserRole === "string"
          ? currentUserRole
          : currentUserRole?.id || currentUserRole?.role?.id || "user";

      // Update local state with metadata
      setCompletedTasks((prevState) => ({
        ...prevState,
        [taskId]: {
          ...prevState[taskId],
          status,
          documentLink,
          assignedTo: assignedTo || prevState[taskId]?.assignedTo,
          updatedAt,
          updatedBy: userRole,
        },
      }));

      // Special handling for qrcode status
      if (taskId === "qrcode") {
        setQrCodeStatus(status);
      }

      // Fetch the updated data to ensure we have the correct server-side metadata
      const refreshedData = await workflowService.getWorkflowTasks(dateString);
      if (refreshedData && refreshedData.tasks) {
        // Only update the specific task that was changed, preserve other tasks for current date
        if (refreshedData.tasks[taskId]) {
          setCompletedTasks((prevState) => ({
            ...prevState,
            [taskId]: {
              ...prevState[taskId],
              ...refreshedData.tasks[taskId],
            },
          }));
        }
      }

      return true;
    } catch (err) {
      console.error(`Error updating task ${taskId} status:`, err);
      return false;
    }
  };

  // Helper function to check role
  const hasRole = (roleId) => {
    if (!currentUserRole) return false;

    // Handle string roles (most common case now with the new backend)
    if (typeof currentUserRole === "string") {
      return currentUserRole.toLowerCase() === roleId.toLowerCase();
    }

    // Handle object roles (legacy format)
    if (typeof currentUserRole === "object") {
      // Check direct id
      if (
        currentUserRole.id &&
        currentUserRole.id.toLowerCase() === roleId.toLowerCase()
      ) {
        return true;
      }

      // Check nested role object (old format)
      if (
        currentUserRole.role &&
        typeof currentUserRole.role === "object" &&
        currentUserRole.role.id &&
        currentUserRole.role.id.toLowerCase() === roleId.toLowerCase()
      ) {
        return true;
      }
    }

    return false;
  };

  // Role checks
  const isPastor = hasRole("pastor");
  const isLiturgyMaker = hasRole("liturgy");
  const isTreasurer = hasRole("treasurer");

  // Completely delete a workflow task
  const deleteDocumentLink = async (taskId) => {
    if (!dateString) return false;

    try {
      // Use the delete endpoint to completely remove the task from the database
      await workflowService.deleteWorkflowTask(dateString, taskId);

      // Update local state by removing the task
      setCompletedTasks((prevState) => {
        // Create a new state object without the task
        const newState = { ...prevState };

        // If the task exists in the state, remove it completely
        if (newState[taskId]) {
          delete newState[taskId];
        }

        return newState;
      });

      // Special handling for qrcode status
      if (taskId === "qrcode") {
        setQrCodeStatus("pending");
      }

      return true;
    } catch (err) {
      console.error(`Error deleting workflow task ${taskId}:`, err);
      return false;
    }
  };

  // Task status function
  const getTaskStatus = (taskId) => {
    // Special handling for qrcode task to use local state
    if (taskId === "qrcode") {
      return qrCodeStatus;
    }

    // Handle both formats of sermon translation task ID
    if (taskId === "translate-sermon" || taskId === "translate_sermon") {
      // Check both formats and return completed if either is completed
      if (
        completedTasks?.["translate-sermon"]?.status === "completed" ||
        completedTasks?.translate_sermon?.status === "completed"
      ) {
        return "completed";
      }
    }

    // Check our local completedTasks state first
    if (
      completedTasks &&
      completedTasks[taskId] &&
      completedTasks[taskId].status
    ) {
      return completedTasks[taskId].status;
    }

    return "pending";
  };

  // Function to trigger email status refresh
  const triggerEmailStatusRefresh = () => {
    setEmailStatusRefreshTrigger((prev) => prev + 1);
  };

  // Helper function to get send status for a specific document type and recipient type
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

  // Check if the current user can work on this category
  const isUserCategory = (roleStr) => {
    if (!roleStr || !currentUserRole) return false;

    // Handle when currentUserRole is an object with an id property
    const userRoleId =
      typeof currentUserRole === "object" && currentUserRole.role
        ? currentUserRole.role.id.toLowerCase() // Access the nested role object
        : typeof currentUserRole === "object" && currentUserRole.id
        ? currentUserRole.id.toLowerCase()
        : currentUserRole.toLowerCase();

    return roleStr.toLowerCase().includes(userRoleId);
  };

  const value = {
    // States
    loading,
    error,
    qrCodeStatus,
    setQrCodeStatus,
    completedTasks,
    setCompletedTasks,
    emailSendStatus,
    emailStatusLoading,
    getSendStatus,
    isDocumentModalOpen,
    setIsDocumentModalOpen,
    isSermonModalOpen,
    setIsSermonModalOpen,
    currentDocumentType,
    setCurrentDocumentType,
    isSendToPastorModalOpen,
    setIsSendToPastorModalOpen,
    currentDocumentToSend,
    setCurrentDocumentToSend,
    isSendToMusicModalOpen,
    setIsSendToMusicModalOpen,
    currentDocumentToSendMusic,
    setCurrentDocumentToSendMusic,
    isSermonUploadModalOpen,
    setIsSermonUploadModalOpen,
    isPastorNotifyModalOpen,
    setIsPastorNotifyModalOpen,
    currentDocumentToNotify,
    setCurrentDocumentToNotify,
    isLyricsModalOpen,
    setIsLyricsModalOpen,
    isTranslationModalOpen,
    setIsTranslationModalOpen,
    currentLyrics,
    setCurrentLyrics,
    isViewTranslatedLyricsModalOpen,
    setIsViewTranslatedLyricsModalOpen,
    isSermonTranslationModalOpen,
    setIsSermonTranslationModalOpen,
    currentSermon,
    setCurrentSermon,
    isSlidesUploadModalOpen,
    setIsSlidesUploadModalOpen,
    isQrCodeModalOpen,
    setIsQrCodeModalOpen,
    isMusicUploadModalOpen,
    setIsMusicUploadModalOpen,
    isEditDocumentLinkModalOpen,
    setIsEditDocumentLinkModalOpen,
    isEditMusicLinksModalOpen,
    setIsEditMusicLinksModalOpen,
    isViewMusicLinksModalOpen,
    setIsViewMusicLinksModalOpen,
    documentToEdit,
    setDocumentToEdit,
    musicLinksToEdit,
    setMusicLinksToEdit,
    musicLinksToView,
    setMusicLinksToView,
    isFetchingMusicLinks,
    setIsFetchingMusicLinks,

    // Helper functions
    hasRole,
    isPastor,
    isLiturgyMaker,
    isTreasurer,
    getTaskStatus,
    isUserCategory,
    updateTaskStatus,
    deleteDocumentLink,

    // External props
    onStartAction,
    service,
    currentUserRole,
    dateString,
    emailStatusRefreshTrigger,
    triggerEmailStatusRefresh,
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};
