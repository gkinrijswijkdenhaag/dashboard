// src/components/music-upload-modal.jsx
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Link, Music, X, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export function MusicUploadModal({ isOpen, onClose, onSubmit, dateString }) {
  // State for form values
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [musicLinks, setMusicLinks] = useState([{ name: "", url: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setNotes("");
      setMusicLinks([{ name: "", url: "" }]);
      setIsSubmitting(false);
      setErrors({});
    }
  }, [isOpen]);

  // Generate title based on the date if not provided
  const generateTitle = () => {
    if (title.trim()) return title;

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

  // Add a new music link input field
  const addMusicLink = () => {
    setMusicLinks([...musicLinks, { name: "", url: "" }]);
  };

  // Remove a music link input field
  const removeMusicLink = (index) => {
    if (musicLinks.length === 1) {
      // Don't remove the last item, just clear it
      setMusicLinks([{ name: "", url: "" }]);
      return;
    }

    const newLinks = [...musicLinks];
    newLinks.splice(index, 1);
    setMusicLinks(newLinks);
  };

  // Update a music link field
  const updateMusicLink = (index, field, value) => {
    const newLinks = [...musicLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setMusicLinks(newLinks);

    // Clear errors when user types
    if (errors[`link${index}`]) {
      setErrors((prev) => ({ ...prev, [`link${index}`]: null }));
    }
  };

  // Validate if the string is a valid music link
  const isValidLink = (link) => {
    // Basic validation - checks if it's a URL or contains drive.google.com/youtube.com
    if (!link) return false;
    return (
      link.includes("drive.google.com") ||
      link.includes("youtube.com") ||
      link.includes("youtu.be") ||
      link.includes("soundcloud.com") ||
      link.includes("http://") ||
      link.includes("https://")
    );
  };

  // Validate the form
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Check if at least one link is valid
    let hasValidLink = false;

    musicLinks.forEach((link, index) => {
      if (link.url.trim() && !isValidLink(link.url)) {
        newErrors[`link${index}`] = "Please provide a valid URL";
        isValid = false;
      } else if (link.url.trim()) {
        hasValidLink = true;
      }
    });

    if (!hasValidLink) {
      newErrors.general = "Please provide at least one music link";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent double-clicks
    if (isSubmitting) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Filter out empty links
      const filteredLinks = musicLinks.filter((link) => link.url.trim());

      // Generate title if not provided
      const finalTitle = generateTitle();

      await onSubmit({
        title: finalTitle,
        notes,
        musicLinks: filteredLinks,
        uploadedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error submitting music links:", error);
      toast.error("Failed to save music links");
      setIsSubmitting(false);
    }
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
        style={{ maxHeight: "calc(100vh - 4rem)", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <Music className="w-5 h-5 text-indigo-600" />
            Add Music Links
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
          <div className="space-y-5">
            <div>
              <Label htmlFor="title" className="text-gray-700">
                Music Title (Optional)
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                placeholder="Enter music title or leave empty for auto-generation"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                If left empty, a title will be generated based on the service
                date
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-gray-700">Music Links</Label>
                <Button
                  type="button"
                  onClick={addMusicLink}
                  className="text-xs h-7 px-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200"
                  disabled={isSubmitting}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Link
                </Button>
              </div>

              {musicLinks.map((link, index) => (
                <div
                  key={index}
                  className="p-3 border border-gray-200 rounded-md bg-gray-50"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Link {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMusicLink(index)}
                      className="text-red-500 hover:text-red-700"
                      disabled={isSubmitting || musicLinks.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <Label
                        htmlFor={`linkName${index}`}
                        className="text-xs text-gray-600"
                      >
                        Name/Description
                      </Label>
                      <Input
                        id={`linkName${index}`}
                        value={link.name}
                        onChange={(e) =>
                          updateMusicLink(index, "name", e.target.value)
                        }
                        className="border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm h-8"
                        placeholder="E.g., Piano Accompaniment, Minus One"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor={`linkUrl${index}`}
                        className="text-xs text-gray-600"
                      >
                        URL
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                          <Link className="h-3 w-3 text-gray-400" />
                        </div>
                        <Input
                          id={`linkUrl${index}`}
                          value={link.url}
                          onChange={(e) =>
                            updateMusicLink(index, "url", e.target.value)
                          }
                          className="pl-8 border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm h-8"
                          placeholder="Paste link to music file (Google Drive, YouTube, etc.)"
                          disabled={isSubmitting}
                        />
                      </div>
                      {errors[`link${index}`] && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors[`link${index}`]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {errors.general && (
                <p className="text-sm text-red-500">{errors.general}</p>
              )}

              <p className="text-xs text-gray-500">
                You can add links to Google Drive, YouTube, SoundCloud, or any
                other music source
              </p>
            </div>

            <div>
              <Label htmlFor="notes" className="text-gray-700">
                Notes (Optional)
              </Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                placeholder="Any additional notes about the music"
                disabled={isSubmitting}
              />
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
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Music Links"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
