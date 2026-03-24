// src/components/workflow/hooks/useWorkflowHandlers.js
import { useState } from "react";
import { useWorkflow } from "../context/WorkflowContext";
import { toast } from "react-hot-toast";
import sermonService from "../../../services/sermonService";
import musicLinksService from "../../../services/musicLinksService";

export const useWorkflowHandlers = () => {
  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    documentEdit: false,
    documentDelete: false,
    documentSave: false,
    conceptDocument: false,
    sermonDocument: false,
    sermonEdit: false,
    sermonDelete: false,
    qrcodeDocument: false,
    qrcodeEdit: false,
    qrcodeDelete: false,
    sermonTranslation: false,
    slidesSubmission: false,
    musicSubmission: false,
    musicLinks: false,
  });

  const {
    setQrCodeStatus,
    completedTasks,
    setCompletedTasks,
    setIsDocumentModalOpen,
    setIsSermonModalOpen,
    setCurrentDocumentType,
    setIsSendToPastorModalOpen,
    setCurrentDocumentToSend,
    setIsSendToMusicModalOpen,
    setCurrentDocumentToSendMusic,
    setIsSermonUploadModalOpen,
    setIsPastorNotifyModalOpen,
    setCurrentDocumentToNotify,
    setIsLyricsModalOpen,
    setIsTranslationModalOpen,
    setCurrentLyrics,
    setIsViewTranslatedLyricsModalOpen,
    setIsSermonTranslationModalOpen,
    setCurrentSermon,
    setIsSlidesUploadModalOpen,
    setIsQrCodeModalOpen,
    setIsMusicUploadModalOpen,
    setIsEditDocumentLinkModalOpen,
    setIsEditMusicLinksModalOpen,
    setIsViewMusicLinksModalOpen,
    setDocumentToEdit,
    setMusicLinksToEdit,
    setMusicLinksToView,
    setIsFetchingMusicLinks,
    onStartAction,
    updateTaskStatus,
    deleteDocumentLink,
    dateString,
    currentUserRole,
  } = useWorkflow();

  // Handle QR code upload actions
  const handleQrCodeAction = (stage) => {
    if (stage === "upload") {
      // Set loading state
      setLoadingStates((prev) => ({ ...prev, qrcodeEdit: true }));

      try {
        // Open the QR code upload modal instead of directly changing status
        setIsQrCodeModalOpen(true);
      } finally {
        // Reset loading state after modal is opened
        setLoadingStates((prev) => ({ ...prev, qrcodeEdit: false }));
      }
    } else if (stage === "complete") {
      // Mark the QR code task as completed
      updateTaskStatus(
        "qrcode",
        "completed",
        completedTasks?.documentLinks?.qrcode
      );
      setQrCodeStatus("completed");
      onStartAction && onStartAction("qrcode");
    } else {
      onStartAction && onStartAction("qrcode");
    }
  };

  // This function will handle sermon submission from the modal
  const handleSermonSubmit = (sermonData) => {
    // Here you would handle the saved sermon
    // console.log("Sermon submitted:", sermonData);

    // Update the task status in the backend
    updateTaskStatus(
      "sermon",
      "completed",
      completedTasks?.documentLinks?.sermon,
      "pastor"
    );

    // Update the local completed tasks state
    setCompletedTasks((prev) => ({
      ...prev,
      sermon: {
        status: "completed",
        documentLink: prev?.documentLinks?.sermon,
        assignedTo: "pastor",
      },
      // Store the actual sermon data if needed
      sermonData: sermonData,
    }));

    // Close the sermon modal
    setIsSermonModalOpen(false);

    // Update the service status for this task if needed
    if (onStartAction) {
      onStartAction(`sermon-completed`);
    }

    // Show a success message
    alert(`Sermon "${sermonData.sermonTitle}" has been saved successfully!`);
  };

  // This function will handle document submission from the modal
  const handleDocumentSubmit = async (documentData) => {
    // Here you would handle the saved document
    // console.log("Document submitted:", documentData);

    // Set loading state for concept document specifically
    if (documentData.documentType === "concept") {
      setLoadingStates((prev) => ({ ...prev, conceptDocument: true }));
    }

    try {
      // Get the document link from completedTasks or from the submitted data
      const documentLink =
        completedTasks?.documentLinks?.[documentData.documentType] ||
        documentData?.documentLink;

      // Update the task status in the backend
      await updateTaskStatus(
        documentData.documentType,
        "completed",
        documentLink,
        "liturgy"
      );

      // Update the local completed tasks state
      setCompletedTasks((prev) => ({
        ...prev,
        [documentData.documentType]: {
          status: "completed",
          documentLink: documentLink,
          assignedTo: "liturgy",
          updatedAt: new Date().toISOString(),
          updatedBy: "liturgy",
        },
        // Store the actual document data if needed
        [`${documentData.documentType}Data`]: documentData,
      }));

      // Update the service status for this task if needed
      if (onStartAction) {
        onStartAction(`${documentData.documentType}-completed`);
      }

      // Return success - no alert needed as the modal already shows loading state
      return true;
    } catch (error) {
      console.error(
        `Error saving ${documentData.documentType} document:`,
        error
      );
      return false;
    } finally {
      // Reset loading state
      if (documentData.documentType === "concept") {
        setLoadingStates((prev) => ({ ...prev, conceptDocument: false }));
      }
    }
  };

  // Handle sending document to pastor
  const handleSendToPastor = (taskId) => {
    // console.log(`Preparing to send document: ${taskId} to pastor`);
    setCurrentDocumentToSend(taskId);
    setIsSendToPastorModalOpen(true);
  };

  // Handle submission from send to pastor modal
  const handleSendToPastorSubmit = async (emailData) => {
    // console.log("Sending document to pastor:", emailData);

    try {
      // Get the actual document link from completedTasks
      let documentLink;
      if (
        completedTasks[emailData.documentType] &&
        completedTasks[emailData.documentType].documentLink
      ) {
        documentLink = completedTasks[emailData.documentType].documentLink;
      } else if (
        completedTasks?.documentLinks &&
        completedTasks.documentLinks[emailData.documentType]
      ) {
        documentLink = completedTasks.documentLinks[emailData.documentType];
      } else {
        documentLink = emailData.documentLink; // Use the one from the form as fallback
      }

      // Import the email service
      const emailService = (await import("../../../services/emailService"))
        .default;

      // Make API call to send the email
      await emailService.sendEmail({
        to: emailData.email,
        cc: emailData.cc,
        subject: emailData.subject,
        message: emailData.message,
        documentType: emailData.documentType,
        documentLink: documentLink,
        serviceDate: dateString,
        recipientType: "pastor",
      });

      // Update the status if needed
      if (onStartAction) {
        onStartAction(`${emailData.documentType}-sent-to-pastor`);
      }

      // Return success - the modal will handle showing feedback
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      // Propagate the error to the modal
      throw error;
    }
  };

  // Handle sending document to music team
  const handleSendToMusic = (taskId) => {
    // console.log(`Preparing to send document: ${taskId} to music team`);
    setCurrentDocumentToSendMusic(taskId);
    setIsSendToMusicModalOpen(true);
  };

  // Handle submission from send to music modal
  const handleSendToMusicSubmit = async (emailData) => {
    // console.log("Sending document to music team:", emailData);

    try {
      // Get the actual document link from completedTasks
      let documentLink;
      if (
        completedTasks[emailData.documentType] &&
        completedTasks[emailData.documentType].documentLink
      ) {
        documentLink = completedTasks[emailData.documentType].documentLink;
      } else if (
        completedTasks?.documentLinks &&
        completedTasks.documentLinks[emailData.documentType]
      ) {
        documentLink = completedTasks.documentLinks[emailData.documentType];
      } else {
        documentLink = emailData.documentLink; // Use the one from the form as fallback
      }

      // Import the email service
      const emailService = (await import("../../../services/emailService"))
        .default;

      // Make API call to send the email
      await emailService.sendEmail({
        to: emailData.email,
        cc: emailData.cc,
        subject: emailData.subject,
        message: emailData.message,
        documentType: emailData.documentType,
        documentLink: documentLink,
        serviceDate: dateString,
        recipientType: "music",
      });

      // Update the status if needed
      if (onStartAction) {
        onStartAction(`${emailData.documentType}-sent-to-music`);
      }

      // Return success - the modal will handle showing feedback
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      // Propagate the error to the modal
      throw error;
    }
  };

  // Handle opening the sermon upload modal
  const handleUploadSermon = (taskId) => {
    // console.log(`Upload sermon for task: ${taskId}`);

    // Set loading state
    setLoadingStates((prev) => ({ ...prev, sermonEdit: true }));

    try {
      setIsSermonUploadModalOpen(true);
    } finally {
      // Reset loading state after modal is opened
      setLoadingStates((prev) => ({ ...prev, sermonEdit: false }));
    }
  };

  // Handler for sermon upload submission
  const handleSermonUploadSubmit = async (sermonData) => {
    // console.log("Sermon upload submitted:", sermonData);

    // Add a default title if not provided
    const enhancedSermonData = {
      ...sermonData,
      sermonTitle:
        sermonData.sermonTitle ||
        `Sermon Document (${new Date().toLocaleDateString()})`,
    };

    // Set loading state for sermon document
    setLoadingStates((prev) => ({ ...prev, sermonDocument: true }));

    try {
      // Update the task status in the backend using the same pattern as concept documents
      await updateTaskStatus(
        "sermon",
        "completed",
        sermonData.sermonLink, // Use the link from the form data
        "pastor" // Assign to pastor role
      );

      // Update the local completed tasks state with proper metadata
      setCompletedTasks((prev) => ({
        ...prev,
        sermon: {
          status: "completed",
          documentLink: sermonData.sermonLink,
          assignedTo: "pastor",
          updatedAt: new Date().toISOString(),
          updatedBy: currentUserRole
            ? typeof currentUserRole === "string"
              ? currentUserRole
              : currentUserRole?.id || currentUserRole?.role?.id || "pastor"
            : "pastor", // Fallback to pastor if currentUserRole is not available
        },
        // Store the actual sermon data with default title if needed
        sermonData: enhancedSermonData,
      }));

      // Update the service status for this task if needed
      if (onStartAction) {
        onStartAction(`sermon-uploaded`);
      }

      // Close the upload modal - no alert needed
      setIsSermonUploadModalOpen(false);

      return true;
    } catch (error) {
      console.error("Error saving sermon document:", error);
      return false;
    } finally {
      // Reset loading state
      setLoadingStates((prev) => ({ ...prev, sermonDocument: false }));
    }
  };

  // Update your handleActionStart function to remove role restrictions
  const handleActionStart = (taskId) => {
    // console.log(`Action started for task: ${taskId}`);

    // For sermon task, open the sermon upload modal instead
    if (taskId === "sermon") {
      setIsSermonUploadModalOpen(true);
    }
    // For document creation tasks, open the document modal (for anyone)
    else if (taskId === "concept" || taskId === "final") {
      setCurrentDocumentType(taskId);
      setIsDocumentModalOpen(true);
    } else {
      // For other actions, use the original handler
      onStartAction && onStartAction(taskId);
    }
  };

  // Handle document viewing
  const handleViewDocument = (taskId) => {
    // console.log(`Viewing document: ${taskId}`);

    // Special handling for music task which might have multiple links
    if (taskId === "music" && completedTasks?.music?.musicLinks?.length > 0) {
      return handleViewMusicLinks();
    }

    // Get the document name for the alert
    const documentTypes = {
      concept: "Concept Document",
      final: "Final Liturgy",
      sermon: "Sermon",
      qrcode: "QR Code",
      slides: "Presentation Slides",
      music: "Music Files",
    };

    // Get the document link from the task status data
    let documentUrl;

    if (completedTasks[taskId] && completedTasks[taskId].documentLink) {
      // Get from task status data (from backend)
      documentUrl = completedTasks[taskId].documentLink;
      // console.log(`Using document link from task status: ${documentUrl}`);
    } else if (
      completedTasks?.documentLinks &&
      completedTasks.documentLinks[taskId]
    ) {
      // Use links from the input
      documentUrl = completedTasks.documentLinks[taskId];
      // console.log(`Using document link from input: ${documentUrl}`);
    } else {
      // console.log(`No document link available for ${taskId}`);
      documentUrl = null;
    }

    if (documentUrl) {
      // Open the document in a new tab
      window.open(documentUrl, "_blank");

      // Don't show any alerts when opening documents
      // Alert removed as requested
    } else {
      // Show an alert when no document URL is available
      alert(
        `No document link available for ${
          documentTypes[taskId] || taskId
        }. Please provide a link first.`
      );
    }

    // If you need to call the parent handler
    onStartAction && onStartAction(`view-${taskId}`);
  };

  // Handle viewing multiple music links in a modal
  const handleViewMusicLinks = async () => {
    // console.log("Viewing music links in modal");

    // Set loading states
    setIsFetchingMusicLinks(true);
    setLoadingStates((prev) => ({ ...prev, musicLinks: true }));

    // Open the modal first to show loading state
    setMusicLinksToView({
      musicLinks: completedTasks?.music?.musicLinks || [],
      title: completedTasks?.music?.title || "Music Links",
    });
    setIsViewMusicLinksModalOpen(true);

    try {
      // Fetch music links from the API
      const response = await musicLinksService.getMusicLinks(dateString);
      const apiMusicLinks = response.musicLinks || [];

      // Update the modal data with API results
      setMusicLinksToView({
        musicLinks: apiMusicLinks,
        title: response.title || completedTasks?.music?.title || "Music Links",
      });

      // Also update local state with API data for UI consistency
      if (apiMusicLinks.length > 0) {
        setCompletedTasks((prev) => ({
          ...prev,
          music: {
            ...prev.music,
            musicLinks: apiMusicLinks,
            title: response.title || prev.music?.title,
          },
        }));
      }

      // If you need to call the parent handler
      onStartAction && onStartAction(`view-music`);
    } catch (error) {
      console.error("Error fetching music links from API:", error);

      // If API call fails, just use the local state data
      const musicLinks = completedTasks?.music?.musicLinks || [];

      if (musicLinks.length === 0) {
        // Keep the modal open but show empty state
        setMusicLinksToView({
          musicLinks: [],
          title: completedTasks?.music?.title || "Music Links",
        });
      }
    } finally {
      // Clear loading states
      setIsFetchingMusicLinks(false);
      setLoadingStates((prev) => ({ ...prev, musicLinks: false }));
    }
  };

  // Handle pastor editing document
  const handlePastorEdit = (taskId) => {
    // console.log(`Pastor editing document: ${taskId}`);

    // Get document types
    const documentTypes = {
      concept: "Concept Document",
      final: "Final Liturgy",
      sermon: "Sermon",
      qrcode: "QR Code",
      slides: "Presentation Slides",
    };

    // Get the document link from the task status data
    let documentUrl;

    if (completedTasks[taskId] && completedTasks[taskId].documentLink) {
      // Get from task status data (from backend)
      documentUrl = completedTasks[taskId].documentLink;
      // console.log(`Using document link from task status: ${documentUrl}`);
    } else if (
      completedTasks?.documentLinks &&
      completedTasks.documentLinks[taskId]
    ) {
      // Use links from the input
      documentUrl = completedTasks.documentLinks[taskId];
      // console.log(`Using document link from input: ${documentUrl}`);
    } else {
      // console.log(`No document link available for ${taskId}`);
      documentUrl = null;
    }

    if (documentUrl) {
      // Update task status to reflect pastor is reviewing
      updateTaskStatus(taskId, "in-progress", documentUrl, "pastor");

      // Open the document in a new tab
      window.open(documentUrl, "_blank");

      // Show a confirmation when window is refocused that they can notify teams when done
      window.addEventListener(
        "focus",
        function onFocus() {
          // Remove this listener so it only runs once
          window.removeEventListener("focus", onFocus);

          // Ask if they want to notify teams now
          const confirmed = window.confirm(
            `Have you finished editing the ${documentTypes[taskId]}? Would you like to notify the teams now?`
          );

          if (confirmed) {
            // Update task status to completed after pastor review
            updateTaskStatus(taskId, "completed", documentUrl, "pastor");

            handlePastorNotifyTeams(taskId);
          }
        },
        { once: true }
      );
    } else {
      // Show an alert when no document URL is available
      alert(
        `No document link available for ${
          documentTypes[taskId] || taskId
        }. Please provide a link first.`
      );
    }
  };

  // Handle pastor notifying teams after editing
  const handlePastorNotifyTeams = (taskId) => {
    // console.log(`Pastor notifying teams about document: ${taskId}`);
    setCurrentDocumentToNotify(taskId);
    setIsPastorNotifyModalOpen(true);
  };

  // Handle submission from pastor notify modal
  const handlePastorNotifySubmit = (notificationData) => {
    // console.log("Pastor sending notifications:", notificationData);

    // Here you would typically make an API call to send the emails

    // Show success message
    alert(
      `Notifications sent to teams about the ${notificationData.documentType}!`
    );

    // Close the modal
    setIsPastorNotifyModalOpen(false);

    // Update the status if needed
    if (onStartAction) {
      onStartAction(`${notificationData.documentType}-pastor-reviewed`);
    }
  };

  // Add these handler functions for lyrics and translations
  const handleAddLyrics = () => {
    // console.log("Opening lyrics input modal");
    setIsLyricsModalOpen(true);
  };

  const handleLyricsSubmit = async (lyricsData) => {
    // console.log("Lyrics submitted:", lyricsData);

    try {
      // Set loading state
      setLoadingStates((prev) => ({ ...prev, lyricsSubmit: true }));

      // Import the lyrics service dynamically
      const lyricsService = (await import("../../../services/lyricsService"))
        .default;

      // Save the lyrics to the database
      await lyricsService.submitLyrics(dateString, lyricsData.songs);

      // Update the local state to store the lyrics
      setCompletedTasks((prev) => ({
        ...prev,
        lyrics: "completed",
        lyricsData: lyricsData,
      }));

      // Update workflow task status
      await updateTaskStatus("translate_lyrics", "in-progress");

      // Close the modal
      setIsLyricsModalOpen(false);

      // Update the service status if needed
      if (onStartAction) {
        onStartAction("lyrics-added");
      }

      // Show a success message
      alert("Song lyrics have been saved to the database successfully!");
    } catch (error) {
      console.error("Error saving lyrics to database:", error);
      alert("Failed to save lyrics to the database. Please try again.");
    } finally {
      setLoadingStates((prev) => ({ ...prev, lyricsSubmit: false }));
    }
  };

  const handleTranslateLyrics = () => {
    // console.log("Opening translation modal");
    // Get the current lyrics data from the completedTasks
    const lyricsData = completedTasks?.lyricsData || { songs: [] };
    setCurrentLyrics(lyricsData);
    setIsTranslationModalOpen(true);
  };

  const handleViewTranslatedLyrics = () => {
    // console.log("Opening view translated lyrics modal");
    // Get the current lyrics data and translation data from the completedTasks
    const lyricsData = completedTasks?.lyricsData || { songs: [] };
    const translationData = completedTasks?.translationData;

    // Combine the data for the view modal
    const combinedData = {
      songs: lyricsData.songs || [],
      translations: translationData?.translations || [],
    };

    setCurrentLyrics(combinedData);
    setIsViewTranslatedLyricsModalOpen(true);
  };

  const handleTranslationSubmit = (translationData) => {
    // console.log("Translation submitted:", translationData);

    // Update the local state to store the translations
    setCompletedTasks((prev) => ({
      ...prev,
      translate_lyrics: "completed",
      translationData: translationData,
    }));

    // Close the modal
    setIsTranslationModalOpen(false);

    // Update the service status if needed
    if (onStartAction) {
      onStartAction("lyrics-translated");
    }

    // Show a success message
    alert("Translations have been saved successfully!");
  };

  // Add this handler function for sermon translation
  const handleTranslateSermon = () => {
    // console.log("Opening sermon translation modal");

    // Get the sermon document link
    let documentUrl;
    if (completedTasks["sermon"] && completedTasks["sermon"].documentLink) {
      documentUrl = completedTasks["sermon"].documentLink;
    } else if (
      completedTasks?.documentLinks &&
      completedTasks.documentLinks["sermon"]
    ) {
      documentUrl = completedTasks.documentLinks["sermon"];
    }

    // Get the sermon title
    const sermonTitle =
      completedTasks?.sermonData?.sermonTitle || "Sermon Document";

    // Create sermon data object with the link (can be null if no sermon exists)
    const sermonData = documentUrl
      ? {
          sermonTitle: sermonTitle,
          sermonLink: documentUrl,
          dateString: dateString,
        }
      : null;

    // Set the current sermon data and open the modal
    // The modal will handle the empty state if sermonData is null
    setCurrentSermon(sermonData);
    setIsSermonTranslationModalOpen(true);
  };

  // Add this handler for sermon translation submission
  const handleSermonTranslationSubmit = async (translationData) => {
    // console.log("Sermon translation submitted:", translationData);

    try {
      // Set loading state
      setLoadingStates((prev) => ({ ...prev, sermonTranslation: true }));

      // Get the sermon document link from the workflow tasks
      let documentLink;
      if (completedTasks["sermon"] && completedTasks["sermon"].documentLink) {
        documentLink = completedTasks["sermon"].documentLink;
      } else if (
        completedTasks?.documentLinks &&
        completedTasks.documentLinks["sermon"]
      ) {
        documentLink = completedTasks.documentLinks["sermon"];
      }

      if (!documentLink) {
        toast.error("Sermon document link not found");
        return;
      }

      // Submit the translation to the backend using the sermon service with dateString and document link
      const response = await sermonService.submitSermonTranslation(
        dateString,
        documentLink,
        translationData.translationComplete,
        translationData.translator
      );

      // console.log("Sermon translation response:", response);

      // Only update the hyphen version explicitly to avoid duplicate activity logs
      try {
        await updateTaskStatus("translate-sermon", "completed", documentLink);
        // console.log("Workflow task status explicitly updated to completed");
      } catch (taskUpdateError) {
        console.error("Error updating workflow task status:", taskUpdateError);
        // Continue with the function even if this fails
      }

      // Update the local state to store the translations and set task status properly
      setCompletedTasks((prev) => ({
        ...prev,
        "translate-sermon": {
          status: "completed",
          updatedAt: new Date().toISOString(),
          updatedBy: "translator",
          documentLink,
        },
        translate_sermon: {
          status: "completed",
          updatedAt: new Date().toISOString(),
          updatedBy: "translator",
          documentLink,
        },
        sermonTranslationData: {
          ...translationData,
          documentLink,
          translator:
            response.sermonTranslation?.translator ||
            translationData.translator,
          translatedAt:
            response.sermonTranslation?.translated_at ||
            translationData.translatedAt,
        },
      }));

      // Close the modal
      setIsSermonTranslationModalOpen(false);

      // Update the service status if needed
      if (onStartAction) {
        onStartAction("sermon-translated");
      }

      // Show a success message using toast instead of alert
      toast.success("Sermon translation has been marked as completed!");
    } catch (error) {
      console.error("Error updating sermon translation status:", error);
      toast.error("Failed to update sermon translation status");
    } finally {
      // Reset loading state
      setLoadingStates((prev) => ({ ...prev, sermonTranslation: false }));
    }
  };

  // FOR DEMO ONLY: Add a function to simulate sermon creation
  const simulateSermonCreation = () => {
    setCompletedTasks((prev) => ({
      ...prev,
      sermon: "completed",
      sermonData: {
        sermonTitle: "Demo Sermon for Testing",
        sermonText:
          "This is a sample sermon text for testing the translation functionality. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        serviceDate: "2023-07-23",
        documentType: "sermon",
        documentTitle: "Sunday Service - Demo Sermon",
      },
    }));
    alert("Demo sermon created! Now translators can translate it.");
  };

  // FOR DEMO ONLY: Add a function to reset sermon status
  const resetSermonStatus = () => {
    setCompletedTasks((prev) => {
      const newState = { ...prev };
      delete newState.sermon;
      delete newState.sermonData;
      return newState;
    });
    alert("Sermon status has been reset for demo purposes.");
  };

  const handleUploadSlides = () => {
    // console.log("Opening slides upload modal");
    setIsSlidesUploadModalOpen(true);
  };

  const handleSlidesUploadSubmit = async (slidesData) => {
    // console.log("Slides link submitted:", slidesData);

    try {
      // Set loading state for slides submission
      setLoadingStates((prev) => ({ ...prev, slidesSubmission: true }));

      // Get the document link from the submitted data
      const documentLink = slidesData?.documentLink;

      if (!documentLink) {
        toast.error("No document link provided");
        return Promise.reject(new Error("No document link provided"));
      }

      // Get current timestamp for local updates
      const updatedAt = new Date().toISOString();

      // Get the current user role
      const userRole =
        typeof currentUserRole === "string"
          ? currentUserRole
          : currentUserRole?.id || currentUserRole?.role?.id || "beamer";

      // Update the task status in the backend
      await updateTaskStatus("slides", "completed", documentLink, "beamer");

      // Update the local state to store the slides data
      setCompletedTasks((prev) => ({
        ...prev,
        slides: {
          status: "completed",
          documentLink: documentLink,
          assignedTo: "beamer",
          updatedAt: updatedAt,
          updatedBy: userRole,
          title: slidesData.title,
        },
        slidesData: slidesData,
      }));

      // Close the modal
      setIsSlidesUploadModalOpen(false);

      // Update the service status if needed
      if (onStartAction) {
        onStartAction("slides-uploaded");
      }

      // Show a success message using toast instead of alert
      toast.success(`Slides link has been saved successfully!`);

      return Promise.resolve();
    } catch (error) {
      console.error("Error saving slides link:", error);
      toast.error("Failed to save slides link");
      return Promise.reject(error);
    } finally {
      // Reset loading state
      setLoadingStates((prev) => ({ ...prev, slidesSubmission: false }));
    }
  };

  // Handler for QR code upload submission
  const handleQrCodeUploadSubmit = async (qrCodeData) => {
    // console.log("QR code upload submitted:", qrCodeData);

    // Set loading state for QR code document
    setLoadingStates((prev) => ({ ...prev, qrcodeDocument: true }));
    setQrCodeStatus("active"); // Show active status during upload

    try {
      // Update the task status in the backend using the same pattern as other documents
      await updateTaskStatus(
        "qrcode",
        "completed",
        qrCodeData.qrCodeLink, // Use the link from the form data
        "admin" // Assign to admin role
      );

      // Update the local completed tasks state with proper metadata
      setCompletedTasks((prev) => ({
        ...prev,
        qrcode: {
          status: "completed",
          documentLink: qrCodeData.qrCodeLink,
          assignedTo: "admin",
          updatedAt: new Date().toISOString(),
          updatedBy: currentUserRole
            ? typeof currentUserRole === "string"
              ? currentUserRole
              : currentUserRole?.id || currentUserRole?.role?.id || "admin"
            : "admin", // Fallback to admin if currentUserRole is not available
        },
        // Store the actual QR code data
        qrcodeData: qrCodeData,
      }));

      // Update QR code status
      setQrCodeStatus("completed");

      // Update the service status if needed
      if (onStartAction) {
        onStartAction("qrcode-uploaded");
      }

      // Close the modal - no alert needed
      setIsQrCodeModalOpen(false);

      return true;
    } catch (error) {
      console.error("Error saving QR code:", error);
      setQrCodeStatus("pending"); // Reset to pending on error
      return false;
    } finally {
      // Reset loading state
      setLoadingStates((prev) => ({ ...prev, qrcodeDocument: false }));
    }
  };

  const handleUploadMusic = () => {
    // console.log("Opening music upload modal");
    setIsMusicUploadModalOpen(true);
  };

  const handleMusicUploadSubmit = async (musicData) => {
    // console.log("Music links submitted:", musicData);

    try {
      // Set loading state for music submission
      setLoadingStates((prev) => ({ ...prev, musicSubmission: true }));

      // Get the primary link (first link) for the database
      const primaryLink =
        musicData.musicLinks && musicData.musicLinks.length > 0
          ? musicData.musicLinks[0].url
          : "";

      if (!primaryLink) {
        toast.error("No music links provided");
        return Promise.reject(new Error("No music links provided"));
      }

      // Get current timestamp for local updates
      const updatedAt = new Date().toISOString();

      // Get the current user role
      const userRole =
        typeof currentUserRole === "string"
          ? currentUserRole
          : currentUserRole?.id || currentUserRole?.role?.id || "music";

      // Save music links to the database using the music links service
      await musicLinksService.saveMusicLinks(
        dateString,
        musicData.musicLinks,
        musicData.title,
        musicData.notes
      );

      // Update the local state to store all the music data
      setCompletedTasks((prev) => ({
        ...prev,
        music: {
          status: "completed",
          documentLink: primaryLink,
          assignedTo: "music",
          updatedAt: updatedAt,
          updatedBy: userRole,
          title: musicData.title,
          // Store all links in the task data
          musicLinks: musicData.musicLinks,
          notes: musicData.notes,
        },
        musicData: musicData,
      }));

      // Close the modal
      setIsMusicUploadModalOpen(false);

      // Update the service status if needed
      if (onStartAction) {
        onStartAction("music-uploaded");
      }

      // Show a success message using toast instead of alert
      toast.success(`Music links have been saved successfully!`);

      return Promise.resolve();
    } catch (error) {
      console.error("Error saving music links:", error);
      toast.error("Failed to save music links");
      return Promise.reject(error);
    } finally {
      // Reset loading state
      setLoadingStates((prev) => ({ ...prev, musicSubmission: false }));
    }
  };

  // Handle opening the edit document link modal
  const handleEditDocumentLink = async (taskId) => {
    // console.log(`Opening edit document link modal for: ${taskId}`);

    // Set loading state
    setLoadingStates((prev) => ({ ...prev, documentEdit: true }));

    try {
      // Get the current document link and metadata
      const documentData = completedTasks[taskId] || {};

      // Special handling for music task
      if (taskId === "music") {
        // Try to get music links from the API
        try {
          const response = await musicLinksService.getMusicLinks(dateString);
          const musicLinks = response.musicLinks || [];

          // If we have links from the API, use them
          if (musicLinks.length > 0) {
            setMusicLinksToEdit({
              musicLinks: musicLinks.map((link) => ({
                name: link.name || "",
                url: link.url || "",
              })),
              title: documentData.title || "",
              notes: documentData.notes || "",
              metadata: {
                updatedAt: documentData.updatedAt,
                updatedBy: documentData.updatedBy,
              },
            });

            // Open the music links modal
            setIsEditMusicLinksModalOpen(true);
            return;
          }
        } catch (error) {
          console.error("Error fetching music links:", error);
          // Fall back to using local state if API call fails
        }

        // If we have music links in the local state, use them
        if (documentData.musicLinks && documentData.musicLinks.length > 0) {
          setMusicLinksToEdit({
            musicLinks: documentData.musicLinks,
            title: documentData.title || "",
            notes: documentData.notes || "",
            metadata: {
              updatedAt: documentData.updatedAt,
              updatedBy: documentData.updatedBy,
            },
          });

          // Open the music links modal
          setIsEditMusicLinksModalOpen(true);
          return;
        }

        // If we don't have music links, create a default one with the document link
        setMusicLinksToEdit({
          musicLinks: [
            {
              name: "Primary Music Link",
              url: documentData.documentLink || "",
            },
          ],
          title: documentData.title || "",
          notes: documentData.notes || "",
          metadata: {
            updatedAt: documentData.updatedAt,
            updatedBy: documentData.updatedBy,
          },
        });

        // Open the music links modal
        setIsEditMusicLinksModalOpen(true);
        return;
      }

      // For non-music tasks, use the regular document link modal
      setDocumentToEdit({
        taskId,
        documentLink: documentData.documentLink || "",
        metadata: {
          updatedAt: documentData.updatedAt,
          updatedBy: documentData.updatedBy,
        },
      });

      // Open the modal
      setIsEditDocumentLinkModalOpen(true);
    } finally {
      setLoadingStates((prev) => ({ ...prev, documentEdit: false }));
    }
  };

  // Handle saving an edited document link
  const handleSaveDocumentLink = async (taskId, newLink) => {
    // console.log(`Saving document link for: ${taskId}`, newLink);

    // Set loading state
    setLoadingStates((prev) => ({ ...prev, documentSave: true }));

    try {
      // Get current status
      const currentStatus = completedTasks[taskId]?.status || "pending";
      const assignedTo = completedTasks[taskId]?.assignedTo;

      // Update the task with the new link
      const success = await updateTaskStatus(
        taskId,
        currentStatus,
        newLink,
        assignedTo
      );

      if (success) {
        // Show success message
        alert(`Document link for ${taskId} has been updated successfully!`);
      } else {
        // Show error message
        alert(`Failed to update document link for ${taskId}.`);
      }

      return success;
    } finally {
      setLoadingStates((prev) => ({ ...prev, documentSave: false }));
    }
  };

  // Handle completely deleting a workflow task
  const handleDeleteDocumentLink = async (taskId) => {
    // console.log(`Completely deleting workflow task: ${taskId}`);

    // Set loading state
    setLoadingStates((prev) => ({ ...prev, documentDelete: true }));

    try {
      const success = await deleteDocumentLink(taskId);

      if (success) {
        // Call onStartAction to update any UI that depends on task status
        if (onStartAction) {
          onStartAction(`${taskId}-deleted`);
        }
      }

      return success;
    } finally {
      setLoadingStates((prev) => ({ ...prev, documentDelete: false }));
    }
  };

  // Handle saving music links
  const handleSaveMusicLinks = async (musicData) => {
    // console.log("Saving music links:", musicData);

    // Set loading state
    setLoadingStates((prev) => ({ ...prev, documentSave: true }));

    try {
      // Get the primary link (first link) for the database
      const primaryLink =
        musicData.musicLinks && musicData.musicLinks.length > 0
          ? musicData.musicLinks[0].url
          : "";

      if (!primaryLink) {
        toast.error("No music links provided");
        return Promise.reject(new Error("No music links provided"));
      }

      // Save music links to the API
      await musicLinksService.saveMusicLinks(
        dateString,
        musicData.musicLinks,
        musicData.title,
        musicData.notes
      );

      // Get current timestamp for local updates
      const updatedAt = new Date().toISOString();

      // Get the current user role
      const userRole =
        typeof currentUserRole === "string"
          ? currentUserRole
          : currentUserRole?.id || currentUserRole?.role?.id || "music";

      // Update local state
      setCompletedTasks((prev) => ({
        ...prev,
        music: {
          ...prev.music,
          status: "completed",
          documentLink: primaryLink,
          updatedAt: updatedAt,
          updatedBy: userRole,
          title: musicData.title,
          musicLinks: musicData.musicLinks,
          notes: musicData.notes,
        },
      }));

      // Close the modal
      setIsEditMusicLinksModalOpen(false);

      // Show success message
      toast.success("Music links saved successfully!");

      return true;
    } catch (error) {
      console.error("Error saving music links:", error);
      toast.error("Failed to save music links");
      return false;
    } finally {
      setLoadingStates((prev) => ({ ...prev, documentSave: false }));
    }
  };

  // Handle deleting music links
  const handleDeleteMusicLinks = async () => {
    // console.log("Deleting music links");

    // Set loading state
    setLoadingStates((prev) => ({ ...prev, documentDelete: true }));

    try {
      // Delete music links from the API
      await musicLinksService.deleteMusicLinks(dateString);

      // Update local state
      setCompletedTasks((prev) => {
        const newState = { ...prev };
        if (newState.music) {
          newState.music = {
            ...newState.music,
            status: "pending",
            documentLink: null,
            musicLinks: [],
            title: "",
            notes: "",
          };
        }
        return newState;
      });

      // Close the modal
      setIsEditMusicLinksModalOpen(false);

      // Show success message
      toast.success("Music links deleted successfully!");

      // Call onStartAction to update any UI that depends on task status
      if (onStartAction) {
        onStartAction("music-deleted");
      }

      return true;
    } catch (error) {
      console.error("Error deleting music links:", error);
      toast.error("Failed to delete music links");
      return false;
    } finally {
      setLoadingStates((prev) => ({ ...prev, documentDelete: false }));
    }
  };

  return {
    handleQrCodeAction,
    handleSermonSubmit,
    handleDocumentSubmit,
    handleSendToPastor,
    handleSendToPastorSubmit,
    handleSendToMusic,
    handleSendToMusicSubmit,
    handleUploadSermon,
    handleSermonUploadSubmit,
    handleActionStart,
    handleViewDocument,
    handleViewMusicLinks,
    handlePastorEdit,
    handlePastorNotifyTeams,
    handlePastorNotifySubmit,
    handleAddLyrics,
    handleLyricsSubmit,
    handleTranslateLyrics,
    handleViewTranslatedLyrics,
    handleTranslationSubmit,
    handleTranslateSermon,
    handleSermonTranslationSubmit,
    simulateSermonCreation,
    resetSermonStatus,
    handleUploadSlides,
    handleSlidesUploadSubmit,
    handleQrCodeUploadSubmit,
    handleUploadMusic,
    handleMusicUploadSubmit,
    handleEditDocumentLink,
    handleSaveDocumentLink,
    handleDeleteDocumentLink,
    handleSaveMusicLinks,
    handleDeleteMusicLinks,
    loadingStates,
  };
};
