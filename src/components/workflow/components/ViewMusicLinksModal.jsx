// src/components/workflow/components/ViewMusicLinksModal.jsx
import { useState, useEffect } from "react";
import { Button } from "../../ui/button";
import {
  X,
  Link as LinkIcon,
  Loader2,
  Music,
  ExternalLink,
  Play,
  Download,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../../ui/card";

export const ViewMusicLinksModal = ({
  isOpen,
  onClose,
  musicLinks,
  title,
  isLoading,
}) => {
  const [selectedLink, setSelectedLink] = useState(null);

  // Reset selected link when modal opens/closes
  useEffect(() => {
    setSelectedLink(null);
  }, [isOpen]);

  // Handle opening a link
  const openLink = (link) => {
    setSelectedLink(link);
    window.open(link.url, "_blank");
  };

  // Function to determine link type based on URL
  const getLinkType = (url) => {
    if (!url) return "unknown";

    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be"))
      return "youtube";
    if (lowerUrl.includes("spotify.com")) return "spotify";
    if (lowerUrl.includes("soundcloud.com")) return "soundcloud";
    if (lowerUrl.includes("drive.google.com")) return "drive";
    if (lowerUrl.includes("dropbox.com")) return "dropbox";
    if (
      lowerUrl.includes(".mp3") ||
      lowerUrl.includes(".wav") ||
      lowerUrl.includes(".ogg")
    )
      return "audio";
    if (lowerUrl.includes(".pdf")) return "pdf";

    return "link";
  };

  // Get icon based on link type
  const getLinkIcon = (type) => {
    switch (type) {
      case "youtube":
        return <Play className="w-4 h-4 text-red-500" />;
      case "spotify":
        return <Play className="w-4 h-4 text-green-500" />;
      case "soundcloud":
        return <Play className="w-4 h-4 text-orange-500" />;
      case "drive":
        return <Download className="w-4 h-4 text-blue-500" />;
      case "dropbox":
        return <Download className="w-4 h-4 text-blue-400" />;
      case "audio":
        return <Music className="w-4 h-4 text-purple-500" />;
      case "pdf":
        return <Download className="w-4 h-4 text-red-400" />;
      default:
        return <LinkIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  // No filtering needed as all links are audio

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4 sm:p-0">
      <Card className="w-full max-w-md my-8">
        <CardHeader className="border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Music className="h-5 w-5 mr-2 text-blue-500" />
              <CardTitle>Music Links</CardTitle>
              {musicLinks && musicLinks.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  {musicLinks.length}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Title if available */}
          {title && (
            <p className="text-sm text-gray-500 mt-2 truncate">{title}</p>
          )}
        </CardHeader>

        <CardContent
          className="overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 12rem)" }}
        >
          {/* No category tabs needed */}

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-gray-200"></div>
                <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-t-4 border-blue-500 animate-spin"></div>
                <Music className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-500" />
              </div>
              <p className="text-gray-600 font-medium mt-4">
                Loading music links...
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Fetching the latest music for this service
              </p>
            </div>
          )}

          {/* No links available */}
          {!isLoading && (!musicLinks || musicLinks.length === 0) && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="bg-gray-100 rounded-full p-3 mb-3">
                <Music className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-700 font-medium mb-1">
                No music links available
              </p>
              <p className="text-sm text-gray-500 max-w-xs">
                Use the "Edit Links" button to add music links for this service
              </p>
            </div>
          )}

          {/* Links list */}
          {!isLoading && musicLinks && musicLinks.length > 0 && (
            <div className="space-y-2">
              {musicLinks.map((link, index) => {
                const linkType = getLinkType(link.url);
                const linkIcon = getLinkIcon(linkType);

                return (
                  <button
                    key={index}
                    className={`w-full flex items-center p-3 rounded-md border text-left ${
                      selectedLink === link
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                    onClick={() => openLink(link)}
                  >
                    <div className="bg-white rounded-md p-1.5 mr-3 border border-gray-200">
                      {linkIcon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900 truncate block">
                          {link.name || `Music ${index + 1}`}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 ml-2" />
                      </div>
                      <span className="text-xs text-gray-500 truncate block mt-0.5">
                        {link.url}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t border-gray-100 justify-end">
          <Button onClick={onClose} variant="default" className="w-full">
            Close
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
