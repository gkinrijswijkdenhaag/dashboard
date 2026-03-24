import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Book, Link as LinkIcon, Loader2 } from "lucide-react";

export function SermonUploadModal({ isOpen, onClose, onSubmit }) {
  // State for loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State for form values
  const [formValues, setFormValues] = useState({
    sermonLink: "",
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormValues({
        sermonLink: "",
      });
    }
  }, [isOpen]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent double-clicks
    if (isSubmitting) return;

    // Form validation
    let errorMessage = "";
    if (!formValues.sermonLink.trim()) {
      errorMessage = "Please enter a Google Drive/Doc link";
    } else if (!formValues.sermonLink.startsWith("http")) {
      errorMessage =
        "Please enter a valid URL (starting with http:// or https://)";
    }

    if (errorMessage) {
      // Display error without using alert
      const errorElement = document.getElementById("sermon-form-error");
      if (errorElement) {
        errorElement.textContent = errorMessage;
        errorElement.style.display = "block";
      }
      return;
    }

    // Clear any previous errors
    const errorElement = document.getElementById("sermon-form-error");
    if (errorElement) {
      errorElement.style.display = "none";
    }

    // Set submitting state
    setIsSubmitting(true);

    try {
      // Submit the data
      await onSubmit({
        ...formValues,
        uploadedAt: new Date().toISOString(),
      });

      // Note: The modal will be closed by the parent component after successful submission
    } catch (error) {
      console.error("Error submitting sermon:", error);
      if (errorElement) {
        errorElement.textContent =
          "An error occurred while saving the sermon. Please try again.";
        errorElement.style.display = "block";
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle Escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (isOpen && e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

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
            <Book className="w-5 h-5 text-purple-600" />
            Upload Sermon
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 8rem)" }}
        >
          {/* Error message display */}
          <div
            id="sermon-form-error"
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm hidden"
          ></div>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="sermonLink" className="text-gray-700">
                Google Drive/Doc Link *
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <LinkIcon className="w-4 h-4 text-gray-500" />
                </div>
                <Input
                  id="sermonLink"
                  name="sermonLink"
                  type="url"
                  value={formValues.sermonLink}
                  onChange={handleChange}
                  className="pl-10 border-gray-300 focus:border-purple-500 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                  placeholder="https://docs.google.com/document/d/..."
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Please enter a Google Drive or Google Docs link to your sermon
                document
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              onClick={onClose}
              className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={isSubmitting || !formValues.sermonLink.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Sermon"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
