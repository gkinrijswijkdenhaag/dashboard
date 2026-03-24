import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Link, QrCode, X, Loader2, Calendar } from "lucide-react";

export function QrCodeUploadModal({ isOpen, onClose, onSubmit, dateString }) {
  // State for loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State for form values
  const [formValues, setFormValues] = useState({
    qrCodeLink: "",
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormValues({
        qrCodeLink: "",
      });
      setIsSubmitting(false);
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

  // Validate if the string is a valid URL
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent double-clicks
    if (isSubmitting) return;

    // Form validation
    let errorMessage = "";
    if (!formValues.qrCodeLink.trim()) {
      errorMessage = "Please provide a link to the QR code";
    } else if (!isValidUrl(formValues.qrCodeLink)) {
      errorMessage = "Please provide a valid URL for the QR code";
    }

    if (errorMessage) {
      // Display error without using alert
      const errorElement = document.getElementById("qrcode-form-error");
      if (errorElement) {
        errorElement.textContent = errorMessage;
        errorElement.style.display = "block";
      }
      return;
    }

    // Clear any previous errors
    const errorElement = document.getElementById("qrcode-form-error");
    if (errorElement) {
      errorElement.style.display = "none";
    }

    // Set submitting state
    setIsSubmitting(true);

    try {
      // Generate a title based on the date
      const formattedDate = dateString
        ? new Date(dateString).toLocaleDateString()
        : new Date().toLocaleDateString();
      const title = `QR Code for ${formattedDate} Service`;

      // Submit the data
      await onSubmit({
        qrCodeLink: formValues.qrCodeLink,
        title,
        uploadedAt: new Date().toISOString(),
      });

      // Note: The modal will be closed by the parent component after successful submission
    } catch (error) {
      console.error("Error submitting QR code:", error);
      if (errorElement) {
        errorElement.textContent =
          "An error occurred while saving the QR code. Please try again.";
        errorElement.style.display = "block";
      }
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
            <QrCode className="w-5 h-5 text-emerald-600" />
            Add QR Code Link
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {/* Error message display */}
          <div
            id="qrcode-form-error"
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm hidden"
          ></div>

          {/* Service date display */}
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-md">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <span className="font-medium text-emerald-800">
                QR Code for{" "}
                {dateString
                  ? new Date(dateString).toLocaleDateString()
                  : "Current"}{" "}
                Service
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="qrCodeLink" className="text-gray-700 mb-2 block">
                QR Code Link
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Link className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="qrCodeLink"
                  name="qrCodeLink"
                  value={formValues.qrCodeLink}
                  onChange={handleChange}
                  className="pl-10 border-gray-300 focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                  placeholder="Paste link to your QR code image (Google Drive, Dropbox, etc.)"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Please provide a direct link to the QR code image with public
                access enabled
              </p>
            </div>
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isSubmitting || !formValues.qrCodeLink.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save QR Code Link"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
