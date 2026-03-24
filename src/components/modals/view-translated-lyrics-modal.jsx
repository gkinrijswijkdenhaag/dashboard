import { useState, useEffect } from "react";
import { X, Globe } from "lucide-react";

export function ViewTranslatedLyricsModal({ isOpen, onClose, lyricsData }) {
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

  // Check if there are translations available
  const hasTranslations = lyricsData?.translations?.length > 0;

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
            View Translated Lyrics
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          className="p-4 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 10rem)" }}
        >
          {!hasTranslations ? (
            <div className="text-center py-8 text-gray-600">
              No translated lyrics available. Please translate the lyrics first.
            </div>
          ) : (
            <div className="space-y-8">
              {lyricsData.translations.map((item, index) => (
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
                        <div className="text-gray-700 mb-2 font-medium">
                          Original Title
                        </div>
                        <div className="border border-gray-200 bg-white p-3 rounded min-h-[40px] text-gray-700">
                          {item.originalTitle || "No title provided"}
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-700 mb-2 font-medium">
                          Original Lyrics
                        </div>
                        <div className="border border-gray-200 bg-white p-3 rounded min-h-[200px] text-gray-700 whitespace-pre-line">
                          {item.originalLyrics || "No lyrics provided"}
                        </div>
                      </div>
                    </div>

                    {/* Right column - Translation */}
                    <div className="space-y-4 bg-green-50 p-4 rounded-md">
                      <div>
                        <div className="text-gray-700 mb-2 font-medium">
                          Translated Title
                        </div>
                        <div className="border border-gray-200 bg-white p-3 rounded min-h-[40px] text-gray-700">
                          {item.translatedTitle || "No translated title provided"}
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-700 mb-2 font-medium">
                          Translated Lyrics
                        </div>
                        <div className="border border-gray-200 bg-white p-3 rounded min-h-[200px] text-gray-700 whitespace-pre-line">
                          {item.translatedLyrics || "No translated lyrics provided"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
