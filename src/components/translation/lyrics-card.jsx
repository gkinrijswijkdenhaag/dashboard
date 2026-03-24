import { Music, Check, Clock, AlertCircle } from "lucide-react";
import { Badge } from "../ui/badge";
import { formatDistanceToNow } from "date-fns";

export function LyricsCard({ lyric, isSelected, onClick }) {
  // Determine status and badge color
  const getStatusInfo = () => {
    if (!lyric.translation) {
      return {
        label: "Pending Translation",
        variant: "outline",
        icon: <Clock className="h-3 w-3 mr-1" />,
      };
    }

    switch (lyric.translation.status) {
      case "completed":
        return {
          label: "Translated",
          variant: "secondary",
          icon: <Check className="h-3 w-3 mr-1" />,
        };
      case "approved":
        return {
          label: "Approved",
          variant: "success",
          icon: <Check className="h-3 w-3 mr-1" />,
        };
      case "rejected":
        return {
          label: "Needs Revision",
          variant: "destructive",
          icon: <AlertCircle className="h-3 w-3 mr-1" />,
        };
      default:
        return {
          label: "In Progress",
          variant: "outline",
          icon: <Clock className="h-3 w-3 mr-1" />,
        };
    }
  };

  const statusInfo = getStatusInfo();

  // Format relative time
  const getRelativeTime = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return "Unknown time";
    }
  };

  return (
    <div
      className={`border rounded-lg p-3 cursor-pointer transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <Music className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
          <h3 className="font-medium text-gray-800 truncate">{lyric.title}</h3>
        </div>
        <Badge
          variant={statusInfo.variant}
          className="flex items-center text-xs ml-2"
        >
          {statusInfo.icon}
          {statusInfo.label}
        </Badge>
      </div>

      <div className="mt-2 text-sm">
        <p className="text-gray-600 line-clamp-2">
          {lyric.lyrics.substring(0, 100)}
          {lyric.lyrics.length > 100 ? "..." : ""}
        </p>
      </div>

      <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
        <div className="flex items-center">
          {lyric.submitted_by_name && (
            <>
              <span>By: {lyric.submitted_by_name}</span>
              {lyric.submitted_by_avatar && (
                <img
                  src={lyric.submitted_by_avatar}
                  alt={lyric.submitted_by_name}
                  className="h-4 w-4 rounded-full ml-1"
                />
              )}
            </>
          )}
        </div>
        <span>{getRelativeTime(lyric.created_at)}</span>
      </div>

      {lyric.translation && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center">
            {lyric.translation.translated_by?.name && (
              <>
                <span>
                  Translated by: {lyric.translation.translated_by.name}
                </span>
                {lyric.translation.translated_by.avatar && (
                  <img
                    src={lyric.translation.translated_by.avatar}
                    alt={lyric.translation.translated_by.name}
                    className="h-4 w-4 rounded-full ml-1"
                  />
                )}
              </>
            )}
          </div>
          <span>{getRelativeTime(lyric.translation.updated_at)}</span>
        </div>
      )}
    </div>
  );
}
