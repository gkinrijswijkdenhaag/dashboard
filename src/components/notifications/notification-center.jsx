import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Bell, AtSign, MessageCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNotifications } from "../../context/NotificationContext";

// Role colors mapping - same as in ChatInput.jsx for consistency
const roleColors = {
  liturgy: {
    bg: "bg-blue-600",
    text: "text-blue-600",
    light: "bg-blue-50",
    border: "border-blue-200",
  },
  pastor: {
    bg: "bg-purple-600",
    text: "text-purple-600",
    light: "bg-purple-50",
    border: "border-purple-200",
  },
  translation: {
    bg: "bg-green-800",
    text: "text-green-800",
    light: "bg-green-50",
    border: "border-green-200",
  },
  beamer: {
    bg: "bg-orange-600",
    text: "text-orange-600",
    light: "bg-orange-50",
    border: "border-orange-200",
  },
  music: {
    bg: "bg-pink-600",
    text: "text-pink-600",
    light: "bg-pink-50",
    border: "border-pink-200",
  },
  treasurer: {
    bg: "bg-emerald-600",
    text: "text-emerald-600",
    light: "bg-emerald-50",
    border: "border-emerald-200",
  },
};

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, mentions, markAsRead } = useNotifications();
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        panelRef.current &&
        !panelRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="outline"
        size="sm"
        className="relative bg-white border border-gray-400 hover:bg-gray-100 shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-4 h-4 text-gray-800" />
        {unreadCount > 0 && (
          <Badge className="notification-badge absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-700 text-white font-medium shadow-sm">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 z-[9999] w-[320px] max-w-[95vw]"
        >
          <NotificationPanel isMobile={isMobile} />
        </div>
      )}
    </div>
  );
}

// Create a separate component for the notification panel content
export function NotificationPanel({ isMobile }) {
  const { mentions, markAsRead, refreshMentions } = useNotifications();

  // Format timestamp
  const formatTime = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }
  };

  // Handle clicking on a notification
  const handleNotificationClick = async (mention) => {
    if (!mention) {
      console.error("Mention is undefined");
      return;
    }

    // Immediately mark this specific mention as read locally
    // This ensures the UI updates instantly
    const mentionElement = document.querySelector(
      `[data-mention-id="${mention.id || mention.messageId}"]`
    );
    if (mentionElement) {
      mentionElement.classList.remove("bg-blue-50");
      mentionElement.classList.add("bg-white");

      // Remove the "New" badge if it exists
      const newBadge = mentionElement.querySelector(".new-badge");
      if (newBadge) {
        newBadge.style.display = "none";
      }
    }

    // Create a normalized version of the mention with consistent IDs
    const normalizedMention = {
      ...mention,
      is_read: false, // Force to unread for marking
      id: mention.id || mention.messageId || mention.message_id,
      messageId: mention.messageId || mention.id || mention.message_id,
      message_id: mention.message_id || mention.messageId || mention.id,
    };

    // Collect all possible IDs from the mention object
    const possibleIds = new Set(); // Use a Set to avoid duplicates

    // Add any ID fields we find
    if (normalizedMention.id) possibleIds.add(normalizedMention.id);
    if (normalizedMention.messageId)
      possibleIds.add(normalizedMention.messageId);
    if (normalizedMention.message_id)
      possibleIds.add(normalizedMention.message_id);

    // Convert back to array
    const uniqueIds = Array.from(possibleIds);

    if (uniqueIds.length === 0) {
      console.error("Mention has no usable ID field:", mention);
      return;
    }

    try {
      // First, directly update the UI to show the notification as read
      // This provides immediate feedback to the user
      if (mention.is_read === false) {
        // Force unread count to decrement
        const notificationBadge = document.querySelector(".notification-badge");
        if (notificationBadge) {
          const currentCount = parseInt(notificationBadge.textContent || "0");
          if (currentCount > 0) {
            notificationBadge.textContent = (currentCount - 1).toString();
            if (currentCount - 1 === 0) {
              notificationBadge.style.display = "none";
            }
          }
        }
      }

      // Mark as read using all possible IDs for robustness
      await markAsRead(uniqueIds);

      // Force a refresh of all mentions to ensure we're in sync with the server
      // Use a shorter timeout for better responsiveness
      setTimeout(() => {
        refreshMentions();
      }, 100);
    } catch (error) {
      console.error("Error marking mention as read:", error);
      // If there's an error, force a refresh to ensure UI is in sync
      refreshMentions();
    }
  };

  return (
    <Card className="border border-gray-300 bg-white shadow-lg overflow-hidden w-full">
      <CardHeader className="pb-3 bg-gray-50 border-b border-gray-200">
        <CardTitle className="text-sm font-semibold text-gray-900">
          Notifications
        </CardTitle>
        <CardDescription className="text-gray-700">
          Recent notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 bg-white p-0 max-h-[80vh] md:max-h-80 overflow-y-auto">
        {mentions.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No notifications yet
          </div>
        ) : (
          mentions.map((mention) => {
            // Get unique key for the mention
            const mentionKey =
              mention.id ||
              mention.messageId ||
              Math.random().toString(36).substring(7);

            // Log the mention for debugging

            // Extract role from content if value is missing
            let roleValue = mention.value;

            if (!roleValue && mention.content) {
              const roleMatch = mention.content.match(/@(\w+)/);
              if (roleMatch && roleMatch[1]) {
                roleValue = roleMatch[1].toLowerCase();
              }
            }

            // Get role color or default to blue
            const role =
              mention.type === "role" ? roleValue || "default" : "default";
            const roleColor = roleColors[role]?.light || "bg-blue-50";
            const textColor = roleColors[role]?.text || "text-blue-800";

            // Get message content from either format
            const messageContent =
              mention.content ||
              mention.message?.content ||
              "You were mentioned in a message";

            // Check if the mention is read - be very explicit
            // For real-time mentions, we need to ensure they're properly marked as unread
            const isRead = mention.is_read === true; // Only true if explicitly set to true

            return (
              <div
                key={mentionKey}
                data-mention-id={mention.id || mention.messageId || mentionKey}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleNotificationClick(mention);
                }}
                className={`flex items-start gap-3 p-3 hover:bg-gray-50 border-b border-gray-100 cursor-pointer ${
                  !isRead ? "bg-blue-50" : "bg-white"
                }`}
              >
                {mention.sender && mention.sender.avatar_url ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
                    <img
                      src={mention.sender.avatar_url}
                      alt={mention.sender.username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className={`w-8 h-8 rounded-full ${roleColor} flex items-center justify-center flex-shrink-0`}
                  >
                    <AtSign className={`w-4 h-4 ${textColor}`} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    @{roleValue || "mention"} mentioned{" "}
                    {mention.sender ? `by ${mention.sender.username}` : ""}
                  </p>
                  <p className="text-xs text-gray-700 truncate">
                    {messageContent}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1"></span>
                    {mention.created_at
                      ? formatTime(mention.created_at)
                      : "Recently"}
                  </p>
                </div>
                {!isRead && (
                  <span className="new-badge px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                    New
                  </span>
                )}
              </div>
            );
          })
        )}
        <div className="p-2 bg-gray-50 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs font-medium text-blue-800 hover:bg-blue-50 hover:text-blue-900 border border-blue-100"
            onClick={async (e) => {
              e.stopPropagation();
              e.preventDefault();

              // Collect all possible IDs from unread mentions
              const unreadIds = [];
              mentions
                .filter((m) => !m.is_read)
                .forEach((mention) => {
                  if (mention.id) unreadIds.push(mention.id);
                  if (mention.messageId) unreadIds.push(mention.messageId);
                  if (mention.message_id) unreadIds.push(mention.message_id);
                });

              if (unreadIds.length > 0) {
                await markAsRead(unreadIds);
                // Force a refresh to ensure everything is in sync
                setTimeout(() => {
                  refreshMentions();
                }, 300);
              }
            }}
          >
            Mark all as read
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
