import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../ui/card";
import { Button } from "../ui/button";
import {
  FileText,
  Link as LinkIcon,
  X,
  Check,
  Save,
  FileCode,
  ExternalLink,
  Loader2,
  Calendar,
} from "lucide-react";
import { getUpcomingSundays } from "../../lib/date-utils";

export function DocumentCreatorModal({
  isOpen,
  onClose,
  onSubmit,
  documentType = "concept",
  dateString,
}) {
  const [driveLink, setDriveLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLinkValid, setIsLinkValid] = useState(false);

  // No need to fetch upcoming services anymore

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setDriveLink("");
      setIsLinkValid(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Function to validate Google Drive link
  const validateLink = (link) => {
    return (
      link.includes("drive.google.com") || link.includes("docs.google.com")
    );
  };

  // Function to handle link change
  const handleLinkChange = (e) => {
    const link = e.target.value;
    setDriveLink(link);
    setIsLinkValid(validateLink(link));
  };

  // Function to handle completion
  const handleComplete = async () => {
    // Prevent double-clicks
    if (isSubmitting) return;

    if (!driveLink.trim() || !isLinkValid) {
      alert("Please enter a valid Google Drive link");
      return;
    }

    setIsSubmitting(true);

    try {
      const documentTitle = `${dateString} - ${
        documentType === "concept"
          ? "Concept Doc"
          : documentType === "sermon"
          ? "Sermon Doc"
          : "Final Doc"
      }`;

      // Submit the data to parent component
      const result = await onSubmit({
        serviceDate: dateString,
        documentLink: driveLink,
        documentTitle,
        documentType,
      });

      // If successful, close the modal
      if (result !== false) {
        onClose();
      }
    } catch (error) {
      console.error("Error submitting document:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="sticky top-0 bg-white p-3 flex justify-between items-center border-b">
          <h2 className="text-lg font-bold text-gray-900">
            Add{" "}
            {documentType === "concept"
              ? "Concept"
              : documentType === "sermon"
              ? "Sermon"
              : "Final"}{" "}
            Document
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-gray-100 p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-full">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700" />
                </div>
                <CardTitle className="text-base sm:text-lg font-bold text-gray-900">
                  Document Link
                </CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm text-gray-600">
                Add a link to your {documentType} document from Google Drive
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 p-3 sm:p-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Service Date
                  </span>
                </div>
                <div className="p-2 border border-gray-200 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-800">
                    {dateString}
                  </p>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                  {documentType === "concept"
                    ? "Concept Document"
                    : documentType === "final"
                    ? "Final Document"
                    : "Document"}{" "}
                  for this service date
                </p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="drive-link"
                  className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1.5"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-gray-500" />
                  Google Drive Link
                </label>
                <input
                  id="drive-link"
                  type="url"
                  className={`w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    driveLink && !isLinkValid
                      ? "border-red-300 bg-red-50"
                      : driveLink && isLinkValid
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300"
                  }`}
                  placeholder="https://drive.google.com/file/d/..."
                  value={driveLink}
                  onChange={handleLinkChange}
                />
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                  Paste the link to your document from Google Drive
                </p>
                {driveLink && !isLinkValid && (
                  <p className="text-[10px] sm:text-xs text-red-500">
                    Please enter a valid Google Drive link
                  </p>
                )}
              </div>

              {driveLink && isLinkValid && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-green-100 rounded-full">
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-green-800">
                          Valid link detected
                        </h4>
                        <p className="text-xs text-green-700 mt-0.5">
                          Your Google Drive document link is valid
                        </p>
                      </div>
                    </div>
                    <a
                      href={driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-green-300 rounded-lg text-xs text-green-700 hover:bg-green-50 transition-colors"
                    >
                      <span className="font-medium">Open Document</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="bg-gray-50 p-2.5 border-t border-gray-100 text-[10px] sm:text-xs text-gray-600 flex items-center gap-1.5 justify-between">
              <div className="flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-gray-500" />
                <span>
                  This document will be linked to the service workflow
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={onClose}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleComplete}
                  className="h-8 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                  disabled={isSubmitting || !isLinkValid}
                  size="sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Document</span>
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
