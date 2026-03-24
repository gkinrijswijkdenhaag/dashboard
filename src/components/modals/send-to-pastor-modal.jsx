import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { useWorkflow } from "../workflow/context/WorkflowContext";
import { EmailHistory } from "../notifications/EmailHistory";

export function SendToPastorModal({ isOpen, onClose, onSubmit, documentType }) {
  // Import the WorkflowContext to get the actual document link
  const { completedTasks, dateString, triggerEmailStatusRefresh } = useWorkflow();
  // Default values
  const documentTypes = {
    concept: "Concept Document",
    final: "Final Liturgy",
    sermon: "Sermon",
  };

  const documentTitle = documentTypes[documentType] || "Document";

  // State for form values
  const [formValues, setFormValues] = useState({
    email: "user2003@andrewscreem.com", // Default pastor email (using your personal email)
    cc: "", // CC field
    subject: `[GKIN] ${documentTitle} for Review`,
    message: `Dear Pastor,\n\nPlease find attached the ${documentTitle} for the upcoming service.\n\nKind regards,\nLiturgy Team`,
  });

  // Loading and feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState(null); // 'success', 'error', or null
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Reset form when modal opens with a new document type
  useEffect(() => {
    if (isOpen) {
      setFormValues({
        email: "user2003@andrewscreem.com",
        cc: "",
        subject: `[GKIN] ${documentTitle} for Review`,
        message: `Dear Pastor,\n\nPlease find attached the ${documentTitle} for the upcoming service.\n\nKind regards,\nLiturgy Team`,
      });
      // Reset feedback states
      setIsSubmitting(false);
      setFeedbackStatus(null);
      setFeedbackMessage("");
    }
  }, [isOpen, documentTitle]);

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

    // Reset feedback state
    setFeedbackStatus(null);
    setFeedbackMessage("");

    // Set loading state
    setIsSubmitting(true);

    try {
      // Get the actual document link from completedTasks
      const documentLink =
        completedTasks[documentType]?.documentLink ||
        completedTasks?.documentLinks?.[documentType] ||
        (documentType === "concept"
          ? "https://docs.google.com/document/d/1example-concept-document/edit"
          : documentType === "final"
          ? "https://docs.google.com/document/d/1example-final-document/edit"
          : "https://docs.google.com/document/d/1example-document/edit");

      // Add the document type and link to the data being sent
      const dataToSubmit = {
        ...formValues,
        documentType,
        documentLink,
      };

      // Call the submit handler and wait for it to complete
      await onSubmit(dataToSubmit);

      // Show success feedback
      setFeedbackStatus("success");
      
      // Trigger email status refresh to update button states
      triggerEmailStatusRefresh();
      
      // Create success message including CC recipients if any
      let successMessage = `Email sent to ${formValues.email}`;
      if (formValues.cc && formValues.cc.trim()) {
        const ccEmails = formValues.cc.split(',').map(email => email.trim()).filter(email => email);
        if (ccEmails.length > 0) {
          successMessage += ` and CC'd to ${ccEmails.join(', ')}`;
        }
      }
      successMessage += ' successfully!';
      
      setFeedbackMessage(successMessage);

      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      // Show error feedback
      setFeedbackStatus("error");
      setFeedbackMessage(
        error.message || "Failed to send email. Please try again."
      );
    } finally {
      // Reset loading state
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-auto border border-gray-200 flex flex-col"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-50 rounded-t-xl flex-shrink-0">
          <h2 className="text-xl font-semibold flex items-center gap-3 text-gray-800">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-lg">Send {documentTitle} to Pastor</div>
              <div className="text-sm text-gray-500 font-normal">Share document for review</div>
            </div>
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:bg-white hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
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

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Email Fields Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Pastor's Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formValues.email}
                    onChange={handleChange}
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cc" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    CC (optional)
                  </Label>
                  <Input
                    id="cc"
                    name="cc"
                    type="email"
                    value={formValues.cc}
                    onChange={handleChange}
                    placeholder="Additional recipients (comma-separated)"
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                  />
                </div>
              </div>

              {/* Subject Field */}
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
                  </svg>
                  Subject
                </Label>
                <Input
                  id="subject"
                  name="subject"
                  value={formValues.subject}
                  onChange={handleChange}
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                  required
                />
              </div>

              {/* Message Field */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Message
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  rows={6}
                  value={formValues.message}
                  onChange={handleChange}
                  className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 resize-none"
                  required
                />
              </div>

              {/* Document Link Preview */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Document Link (will be included in the email)
                </h3>
                <div className="text-sm text-blue-700 break-all bg-white p-3 rounded border border-blue-200">
                  {completedTasks[documentType]?.documentLink ||
                    completedTasks?.documentLinks?.[documentType] ||
                    (documentType === "concept"
                      ? "https://docs.google.com/document/d/1example-concept-document/edit"
                      : documentType === "final"
                      ? "https://docs.google.com/document/d/1example-final-document/edit"
                      : "https://docs.google.com/document/d/1example-document/edit")}
                </div>
              </div>

              {/* Email History */}
              <EmailHistory 
                documentType={documentType} 
                serviceDate={dateString} 
                recipientType="pastor"
                isOpen={isOpen} 
              />
            </div>
          </form>
        </div>

        {/* Feedback message area */}
        {feedbackStatus && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div
              className={`p-4 rounded-lg border ${
                feedbackStatus === "success"
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-center gap-3">
                {feedbackStatus === "success" ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <p
                  className={`text-sm font-medium ${
                    feedbackStatus === "success"
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  {feedbackMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer - Fixed */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200 rounded-b-xl flex-shrink-0">
          <Button
            type="button"
            onClick={onClose}
            className="order-2 sm:order-1 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 h-11 px-6"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            className="order-1 sm:order-2 bg-blue-600 hover:bg-blue-700 text-white min-w-[120px] h-11 px-6"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>Send Email</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
