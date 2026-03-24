import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Plus, X, Music, Save } from "lucide-react";
import { toast } from "react-hot-toast";

export function LyricsInputModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
}) {
  const [songs, setSongs] = useState([]);

  // Reset form when modal opens with initial data
  useEffect(() => {
    if (isOpen) {
      setSongs(initialData?.songs || [{ title: "", lyrics: "" }]);
    }
  }, [isOpen, initialData]);

  // Handle song changes
  const handleSongChange = (index, field, value) => {
    const updatedSongs = [...songs];
    updatedSongs[index][field] = value;
    setSongs(updatedSongs);
  };

  // Add a new song
  const handleAddSong = () => {
    setSongs([...songs, { title: "", lyrics: "" }]);
  };

  // Remove a song
  const handleRemoveSong = (index) => {
    const updatedSongs = [...songs];
    updatedSongs.splice(index, 1);
    setSongs(updatedSongs);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Filter out empty songs
    const validSongs = songs.filter(
      (song) => song.title.trim() || song.lyrics.trim()
    );

    if (validSongs.length === 0) {
      toast.error("Please add at least one song with title or lyrics");
      return;
    }

    onSubmit({
      songs: validSongs,
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-2 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto my-2 sm:my-8 animate-fadeIn"
        style={{ maxHeight: "calc(100vh - 1rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Made more compact on mobile */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-1 sm:gap-2 text-gray-800">
            <Music className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <span className="truncate">Song Lyrics Input</span>
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
          className="p-3 sm:p-4 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 8rem)" }}
        >
          <div className="space-y-4 sm:space-y-6">
            {/* Responsive header for instructions and add button */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <p className="text-xs sm:text-sm text-gray-600">
                Add songs and lyrics that will need translation
              </p>
              <Button
                type="button"
                onClick={handleAddSong}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1 w-full sm:w-auto"
                size="sm"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                Add Song
              </Button>
            </div>

            {/* Song list - improved for mobile */}
            {songs.map((song, index) => (
              <div
                key={index}
                className="p-3 sm:p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50"
              >
                <div className="flex justify-between items-center mb-2 sm:mb-3">
                  <h3 className="font-medium text-sm sm:text-base text-gray-700">
                    Song {index + 1}
                  </h3>
                  {songs.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => handleRemoveSong(index)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 p-1 h-auto"
                      variant="ghost"
                      size="sm"
                      aria-label={`Remove Song ${index + 1}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="grid gap-1 sm:gap-2">
                    <Label
                      htmlFor={`song-title-${index}`}
                      className="text-xs sm:text-sm text-gray-700"
                    >
                      Song Title
                    </Label>
                    <Input
                      id={`song-title-${index}`}
                      value={song.title}
                      onChange={(e) =>
                        handleSongChange(index, "title", e.target.value)
                      }
                      className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
                      placeholder="Enter song title"
                    />
                  </div>

                  <div className="grid gap-1 sm:gap-2">
                    <Label
                      htmlFor={`song-lyrics-${index}`}
                      className="text-xs sm:text-sm text-gray-700"
                    >
                      Lyrics
                    </Label>
                    <Textarea
                      id={`song-lyrics-${index}`}
                      rows={4}
                      value={song.lyrics}
                      onChange={(e) =>
                        handleSongChange(index, "lyrics", e.target.value)
                      }
                      className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
                      placeholder="Enter song lyrics"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer buttons - Made full width on mobile */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-4 sm:mt-6">
            <Button
              type="button"
              onClick={onClose}
              className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 w-full sm:w-auto order-2 sm:order-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto order-1 sm:order-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Lyrics
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
