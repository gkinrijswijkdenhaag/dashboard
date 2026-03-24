// src/components/slides-upload-modal.jsx
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Link, Presentation, X, Loader2 } from "lucide-react";

export function SlidesUploadModal({ isOpen, onClose, onSubmit, dateString }) {
  // State for form values
  const [documentLink, setDocumentLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setDocumentLink("");
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Generate title based on the date
  const generateTitle = () => {
    if (!dateString) return "Presentation for upcoming service";

    // Format the date for display
    try {
      const date = new Date(dateString);
      const formattedDate = date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      return `Presentation for upcoming service (${formattedDate})`;
    } catch (e) {
      return `Presentation for upcoming service (${dateString})`;
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!documentLink.trim()) {
      setError("Please enter a Google Drive or Google Slides link");
      return;
    }

    setIsSubmitting(true);
    setError("");

    // Submit with auto-generated title
    onSubmit({
      title: generateTitle(),
      documentLink: documentLink.trim(),
      uploadedAt: new Date().toISOString(),
    }).catch((err) => {
      console.error("Error submitting slides:", err);
      setError("Failed to save slides link. Please try again.");
      setIsSubmitting(false);
    });
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  // Handle Escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (isOpen && e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, isSubmitting]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 my-8 animate-fadeIn"
        style={{ maxHeight: "calc(100vh - 4rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <Presentation className="w-5 h-5 text-orange-600" />
            {dateString
              ? (() => {
                  try {
                    const date = new Date(dateString);
                    const formattedDate = date.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    });
                    return `Presentation for upcoming service (${formattedDate})`;
                  } catch (e) {
                    return `Presentation for upcoming service (${dateString})`;
                  }
                })()
              : "Presentation for upcoming service"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close"
            disabled={isSubmitting}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="documentLink" className="text-gray-700">
                Presentation Link
              </Label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Link className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="documentLink"
                  value={documentLink}
                  onChange={(e) => setDocumentLink(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                  placeholder="Enter Google Drive or Google Slides link"
                  disabled={isSubmitting}
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Paste a link to your Google Slides or Google Drive document
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              onClick={onClose}
              className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Slides Link"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
