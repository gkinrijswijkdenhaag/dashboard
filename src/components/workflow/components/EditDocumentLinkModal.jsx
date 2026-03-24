// src/components/workflow/components/EditDocumentLinkModal.jsx
import { useState, useEffect } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  X,
  Trash2,
  Edit,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

export const EditDocumentLinkModal = ({
  isOpen,
  onClose,
  documentType,
  initialLink,
  onSave,
  onDelete,
  metadata,
}) => {
  const [documentLink, setDocumentLink] = useState(initialLink || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Feedback states
  const [feedback, setFeedback] = useState({
    type: null, // 'success', 'error', or null
    message: "",
  });

  // Delete confirmation state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setDocumentLink(initialLink || "");
      setFeedback({ type: null, message: "" });
      setShowDeleteConfirmation(false);
      setIsSaving(false);
      setIsDeleting(false);
    }
  }, [isOpen, initialLink]);

  const handleSave = async () => {
    // Prevent double-clicks
    if (isSaving || isDeleting) return;

    try {
      setIsSaving(true);
      setFeedback({ type: null, message: "" });

      await onSave(documentType, documentLink);

      // Show success feedback
      setFeedback({
        type: "success",
        message: "Document link saved successfully!",
      });

      // Close the modal after a short delay
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error saving document link:", error);
      setFeedback({
        type: "error",
        message: error.message || "Failed to save document link",
      });
      setIsSaving(false);
    }
  };

  // Show delete confirmation UI instead of window.confirm
  const showDeleteConfirmationUI = () => {
    setShowDeleteConfirmation(true);
  };

  // Cancel delete action
  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  const handleDelete = async () => {
    // Prevent double-clicks
    if (isDeleting || isSaving) return;

    try {
      setIsDeleting(true);
      setFeedback({ type: null, message: "" });

      await onDelete(documentType);

      // Show success feedback
      setFeedback({
        type: "success",
        message: "Document link deleted successfully!",
      });

      // Close the modal after a short delay
      setTimeout(() => {
        setIsDeleting(false);
        setShowDeleteConfirmation(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error deleting document link:", error);
      setFeedback({
        type: "error",
        message: error.message || "Failed to delete document link",
      });
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  if (!isOpen) return null;

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";

    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => {
        // Close modal when clicking backdrop
        if (e.target === e.currentTarget && !isSaving && !isDeleting) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold capitalize">
            Edit {documentType} Document Link
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            disabled={isSaving || isDeleting}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {/* Feedback message */}
        {feedback.type && (
          <div
            className={`mb-4 p-3 rounded-md flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            )}
            <p className="text-sm">{feedback.message}</p>
          </div>
        )}

        {/* Document metadata */}
        {metadata && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md text-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium">Last updated:</span>
              <span>{formatDate(metadata.updatedAt)}</span>
            </div>
            {metadata.updatedBy && (
              <div className="flex justify-between items-center">
                <span className="font-medium">Updated by:</span>
                <span className="capitalize">{metadata.updatedBy}</span>
              </div>
            )}
          </div>
        )}

        <div className="mb-4">
          <Label htmlFor="documentLink" className="block mb-2">
            Document Link
          </Label>
          <Input
            id="documentLink"
            type="text"
            value={documentLink}
            onChange={(e) => setDocumentLink(e.target.value)}
            placeholder="Enter Google Drive link"
            className="w-full"
            autoFocus
          />
        </div>

        {/* Delete Confirmation UI */}
        {showDeleteConfirmation && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-red-700 mb-1">
                  Confirm Deletion
                </h3>
                <p className="text-sm text-red-600 mb-3">
                  Are you sure you want to delete the link for {documentType}?
                  This action cannot be undone.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelDelete}
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-all"
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    size="sm"
                    disabled={isDeleting}
                    className="flex items-center hover:bg-red-700 transition-all"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 size={14} className="mr-1 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Yes, Delete"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-2 justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={showDeleteConfirmationUI}
            className="flex items-center hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={
              !initialLink ||
              isDeleting ||
              isSaving ||
              showDeleteConfirmation ||
              feedback.type === "success"
            }
          >
            <Trash2 size={16} className="mr-1" />
            Delete Link
          </Button>

          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving || isDeleting || feedback.type === "success"}
              className="hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="flex items-center min-w-[90px] justify-center hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                !documentLink.trim() ||
                isSaving ||
                isDeleting ||
                showDeleteConfirmation ||
                feedback.type === "success"
              }
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
