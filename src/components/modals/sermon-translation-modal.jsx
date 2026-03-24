import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Book,
  X,
  Save,
  ExternalLink,
  Link as LinkIcon,
  User,
  Loader2,
  AlertCircle,
} from "lucide-react";
import authService from "../../services/authService";

export function SermonTranslationModal({
  isOpen,
  onClose,
  onSubmit,
  sermonData,
  isSubmitting = false,
}) {
  // No need for form values anymore, just tracking if translation is complete
  const [translationComplete, setTranslationComplete] = useState(false);
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTranslationComplete(false);
    }
  }, [isOpen]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!translationComplete) {
      // Use inline error message instead of alert
      document.getElementById("translation-error").classList.remove("hidden");
      return;
    }

    onSubmit({
      translationComplete: true,
      originalSermonId: sermonData?.id || "",
      originalSermonTitle: sermonData?.sermonTitle || "",
      originalSermonLink: sermonData?.sermonLink || "",
      translatedAt: new Date().toISOString(),
      dateString: sermonData?.dateString || "",
      translator: {
        id: currentUser?.id,
        name: currentUser?.username,
        role: currentUser?.role,
        avatar: currentUser?.avatar_url,
      },
    });
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
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 my-8 animate-fadeIn"
        style={{ maxHeight: "calc(100vh - 4rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <Book className="w-5 h-5 text-green-600" />
            Translate Sermon
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 10rem)" }}
        >
          {!sermonData || !sermonData.sermonLink ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
                <Book className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Sermon Available
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                A sermon document must be uploaded before translation can begin.
                Please ask the Pastor to create or upload a sermon first.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Original sermon section */}
              <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <Book className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    Sermon for{" "}
                    {new Date(sermonData.dateString).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    service
                  </h3>
                </div>
                <div className="space-y-3">
                  {sermonData.sermonLink && (
                    <div>
                      <Label className="text-sm text-gray-600 font-medium mb-2">
                        Sermon Document
                      </Label>
                      <a
                        href={sermonData.sermonLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 p-3 bg-white border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 flex items-center gap-2 group shadow-sm"
                      >
                        <LinkIcon className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">Open Google Doc</span>
                        <ExternalLink className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Translation section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">Translation Instructions</h3>
                </div>

                <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ExternalLink className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900 mb-3">
                        How to Translate
                      </h4>
                      <ol className="text-sm text-green-800 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-semibold">1</span>
                          <span>Click the sermon Google Doc link above to open it</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-semibold">2</span>
                          <span>Translate the sermon directly in the same document</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-semibold">3</span>
                          <span>When you're done, check the confirmation box below</span>
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="translationComplete"
                      checked={translationComplete}
                      onChange={() => {
                        setTranslationComplete(!translationComplete);
                        // Hide error message when checkbox is checked
                        if (!translationComplete) {
                          document
                            .getElementById("translation-error")
                            .classList.add("hidden");
                        }
                      }}
                      className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-0.5 cursor-pointer"
                    />
                    <label
                      htmlFor="translationComplete"
                      className="text-gray-900 font-medium cursor-pointer select-none"
                    >
                      I confirm that I have completed the translation in the document
                    </label>
                  </div>

                  {/* Error message - hidden by default */}
                  <div
                    id="translation-error"
                    className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium hidden flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Please confirm that you have completed the translation</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <Button
              type="button"
              onClick={onClose}
              className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-4 py-2"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!sermonData || !sermonData.sermonLink || !translationComplete || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Confirm Translation Complete
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
