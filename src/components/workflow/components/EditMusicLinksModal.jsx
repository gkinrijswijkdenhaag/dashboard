// src/components/workflow/components/EditMusicLinksModal.jsx
import { useState, useEffect } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  X,
  Trash2,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Plus,
  Link,
} from "lucide-react";

export const EditMusicLinksModal = ({
  isOpen,
  onClose,
  initialLinks,
  title,
  notes,
  onSave,
  onDelete,
  metadata,
  dateString,
}) => {
  const [musicLinks, setMusicLinks] = useState([{ name: "", url: "" }]);
  const [musicTitle, setMusicTitle] = useState("");
  const [musicNotes, setMusicNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(0);
  const [linksPerPage] = useState(5); // Show 5 links per page

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
      // Initialize with at least one empty link if no links are provided
      setMusicLinks(
        initialLinks?.length > 0 ? initialLinks : [{ name: "", url: "" }]
      );
      setMusicTitle(title || "");
      setMusicNotes(notes || "");
      setFeedback({ type: null, message: "" });
      setShowDeleteConfirmation(false);
      setPage(0); // Reset to first page
    }
  }, [isOpen, initialLinks, title, notes]);

  // Add a new music link
  const addMusicLink = () => {
    setMusicLinks([...musicLinks, { name: "", url: "" }]);
    // Move to the page where the new link is
    setPage(Math.floor(musicLinks.length / linksPerPage));
  };

  // Remove a music link
  const removeMusicLink = (index) => {
    if (musicLinks.length === 1) {
      // Don't remove the last item, just clear it
      setMusicLinks([{ name: "", url: "" }]);
      // Show feedback that the link was cleared
      setFeedback({
        type: "success",
        message: "Link cleared. At least one link slot is required.",
      });
      // Clear feedback after 3 seconds
      setTimeout(() => {
        setFeedback({ type: null, message: "" });
      }, 3000);
      return;
    }

    const newLinks = [...musicLinks];
    newLinks.splice(index, 1);
    setMusicLinks(newLinks);

    // Adjust page if needed
    const maxPage = Math.max(0, Math.ceil(newLinks.length / linksPerPage) - 1);
    if (page > maxPage) {
      setPage(maxPage);
    }

    // Show feedback that the link was deleted
    setFeedback({
      type: "success", 
      message: "Link deleted successfully.",
    });
    // Clear feedback after 3 seconds
    setTimeout(() => {
      setFeedback({ type: null, message: "" });
    }, 3000);
  };

  // Update a music link
  const updateMusicLink = (index, field, value) => {
    const newLinks = [...musicLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setMusicLinks(newLinks);
  };

  // Generate title based on the date if not provided
  const generateTitle = () => {
    if (musicTitle.trim()) return musicTitle;

    if (!dateString) return "Music for upcoming service";

    try {
      const date = new Date(dateString);
      const formattedDate = date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      return `Music for service on ${formattedDate}`;
    } catch (e) {
      return `Music for service on ${dateString}`;
    }
  };

  // Handle save
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setFeedback({ type: null, message: "" });

      // Filter out empty links
      const filteredLinks = musicLinks.filter((link) => link.url.trim());

      if (filteredLinks.length === 0) {
        setFeedback({
          type: "error",
          message: "Please provide at least one music link",
        });
        setIsSaving(false);
        return;
      }

      // Generate title if needed
      const finalTitle = generateTitle();

      await onSave({
        musicLinks: filteredLinks,
        title: finalTitle,
        notes: musicNotes,
      });

      // Show success feedback
      setFeedback({
        type: "success",
        message: "Music links saved successfully!",
      });

      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error saving music links:", error);
      setFeedback({
        type: "error",
        message: error.message || "Failed to save music links",
      });
      setIsSaving(false);
    }
  };

  // Show delete confirmation UI
  const showDeleteConfirmationUI = () => {
    setShowDeleteConfirmation(true);
  };

  // Cancel delete action
  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setFeedback({ type: null, message: "" });

      await onDelete();

      // Show success feedback
      setFeedback({
        type: "success",
        message: "Music links deleted successfully!",
      });

      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error deleting music links:", error);
      setFeedback({
        type: "error",
        message: error.message || "Failed to delete music links",
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

  // Calculate pagination
  const totalPages = Math.ceil(musicLinks.length / linksPerPage);
  const startIndex = page * linksPerPage;
  const endIndex = Math.min(startIndex + linksPerPage, musicLinks.length);
  const currentLinks = musicLinks.slice(startIndex, endIndex);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div
        className="bg-white rounded-lg p-6 w-full max-w-md my-8"
        style={{ maxHeight: "calc(100vh - 4rem)", overflowY: "auto" }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Music Links</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSaving || isDeleting}
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

        <div className="space-y-4">
          {/* Title field */}
          <div>
            <Label htmlFor="musicTitle" className="block mb-2">
              Title (Optional)
            </Label>
            <Input
              id="musicTitle"
              type="text"
              value={musicTitle}
              onChange={(e) => setMusicTitle(e.target.value)}
              placeholder="Enter title or leave empty for auto-generation"
              className="w-full"
              disabled={isSaving || isDeleting}
            />
            <p className="text-xs text-gray-500 mt-1">
              If left empty, a title will be generated based on the service date
            </p>
          </div>

          {/* Music links section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="block">
                Music Links {musicLinks.length > 0 && `(${musicLinks.length})`}
              </Label>
              <Button
                type="button"
                size="sm"
                onClick={addMusicLink}
                className="text-xs h-7 px-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200"
                disabled={isSaving || isDeleting}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Link
              </Button>
            </div>

            {/* Links list with pagination */}
            <div className="space-y-3">
              {currentLinks.map((link, idx) => {
                const actualIndex = startIndex + idx;
                return (
                  <div
                    key={actualIndex}
                    className="p-3 border border-gray-200 rounded-md bg-gray-50"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Link {actualIndex + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMusicLink(actualIndex)}
                        className={`${
                          musicLinks.length === 1
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-red-500 hover:text-red-700 cursor-pointer"
                        }`}
                        disabled={isSaving || isDeleting}
                        title={
                          musicLinks.length === 1
                            ? "Cannot delete the last link. Clear it instead."
                            : "Delete this link"
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <Label
                          htmlFor={`linkName${actualIndex}`}
                          className="text-xs text-gray-600"
                        >
                          Name/Description
                        </Label>
                        <Input
                          id={`linkName${actualIndex}`}
                          value={link.name}
                          onChange={(e) =>
                            updateMusicLink(actualIndex, "name", e.target.value)
                          }
                          className="border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm h-8"
                          placeholder="E.g., Piano Accompaniment, Minus One"
                          disabled={isSaving || isDeleting}
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor={`linkUrl${actualIndex}`}
                          className="text-xs text-gray-600"
                        >
                          URL
                        </Label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                            <Link className="h-3 w-3 text-gray-400" />
                          </div>
                          <Input
                            id={`linkUrl${actualIndex}`}
                            value={link.url}
                            onChange={(e) =>
                              updateMusicLink(
                                actualIndex,
                                "url",
                                e.target.value
                              )
                            }
                            className="pl-8 border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm h-8"
                            placeholder="Paste link to music file (Google Drive, YouTube, etc.)"
                            disabled={isSaving || isDeleting}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-3">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0 || isSaving || isDeleting}
                  className="text-xs h-7 px-2 bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page === totalPages - 1 || isSaving || isDeleting}
                  className="text-xs h-7 px-2 bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Next
                </Button>
              </div>
            )}
          </div>

          {/* Notes field */}
          <div>
            <Label htmlFor="musicNotes" className="block mb-2">
              Notes (Optional)
            </Label>
            <Input
              id="musicNotes"
              type="text"
              value={musicNotes}
              onChange={(e) => setMusicNotes(e.target.value)}
              placeholder="Any additional notes about the music"
              className="w-full"
              disabled={isSaving || isDeleting}
            />
          </div>
        </div>

        {/* Delete Confirmation UI */}
        {showDeleteConfirmation && (
          <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-red-700 mb-1">
                  Confirm Deletion
                </h3>
                <p className="text-sm text-red-600 mb-3">
                  Are you sure you want to delete all music links? This action
                  cannot be undone.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelDelete}
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-50"
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
                    className="flex items-center"
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

        <div className="flex space-x-2 justify-between mt-4">
          <Button
            type="button"
            variant="destructive"
            onClick={showDeleteConfirmationUI}
            className="flex items-center"
            disabled={
              musicLinks.length === 0 ||
              isDeleting ||
              isSaving ||
              showDeleteConfirmation ||
              feedback.type === "success"
            }
          >
            <Trash2 size={16} className="mr-1" />
            Delete All Links
          </Button>

          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving || isDeleting || feedback.type === "success"}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="flex items-center min-w-[90px] justify-center"
              disabled={
                musicLinks.every((link) => !link.url.trim()) ||
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
