import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Globe, X, Save } from "lucide-react";

export function TranslationModal({ isOpen, onClose, onSubmit, lyricsData }) {
  const [translations, setTranslations] = useState([]);

  // Initialize form with lyrics data when modal opens
  useEffect(() => {
    if (isOpen && lyricsData?.songs) {
      // Map existing lyrics to translation structure
      const initialTranslations = lyricsData.songs.map((song) => ({
        songId: song.title, // Use song title as identifier
        originalTitle: song.title,
        originalLyrics: song.lyrics,
        translatedTitle: song.translatedTitle || "", // Use existing if available
        translatedLyrics: song.translatedLyrics || "", // Use existing if available
      }));

      setTranslations(initialTranslations);
    }
  }, [isOpen, lyricsData]);

  // Handle translation changes
  const handleTranslationChange = (index, field, value) => {
    const updatedTranslations = [...translations];
    updatedTranslations[index][field] = value;
    setTranslations(updatedTranslations);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit({
      translations: translations,
      timestamp: new Date().toISOString(),
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
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 my-8 animate-fadeIn"
        style={{ maxHeight: "calc(100vh - 4rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <Globe className="w-5 h-5 text-green-600" />
            Translate Song Lyrics
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
          className="p-4 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 10rem)" }}
        >
          {translations.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No songs available for translation. Please ask the Liturgy team to
              add songs first.
            </div>
          ) : (
            <div className="space-y-8">
              {translations.map((item, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg shadow-sm"
                >
                  <h3 className="font-medium text-gray-700 mb-4">
                    Song {index + 1}: {item.originalTitle}
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    {/* Left column - Original */}
                    <div className="space-y-4 bg-gray-50 p-4 rounded-md">
                      <div>
                        <Label className="text-gray-700 mb-2 block">
                          Original Title
                        </Label>
                        <div className="border border-gray-200 bg-white p-3 rounded min-h-[40px] text-gray-700">
                          {item.originalTitle || "No title provided"}
                        </div>
                      </div>

                      <div>
                        <Label className="text-gray-700 mb-2 block">
                          Original Lyrics
                        </Label>
                        <div className="border border-gray-200 bg-white p-3 rounded min-h-[200px] text-gray-700 whitespace-pre-line">
                          {item.originalLyrics || "No lyrics provided"}
                        </div>
                      </div>
                    </div>

                    {/* Right column - Translation */}
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label
                          htmlFor={`translated-title-${index}`}
                          className="text-gray-700"
                        >
                          Translated Title
                        </Label>
                        <Textarea
                          id={`translated-title-${index}`}
                          rows={2}
                          value={item.translatedTitle}
                          onChange={(e) =>
                            handleTranslationChange(
                              index,
                              "translatedTitle",
                              e.target.value
                            )
                          }
                          className="border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                          placeholder="Enter translated title"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label
                          htmlFor={`translated-lyrics-${index}`}
                          className="text-gray-700"
                        >
                          Translated Lyrics
                        </Label>
                        <Textarea
                          id={`translated-lyrics-${index}`}
                          rows={8}
                          value={item.translatedLyrics}
                          onChange={(e) =>
                            handleTranslationChange(
                              index,
                              "translatedLyrics",
                              e.target.value
                            )
                          }
                          className="border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                          placeholder="Enter translated lyrics"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

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
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={translations.length === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Translations
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
