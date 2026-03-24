import { useState, useEffect, useRef } from "react";
import chatService from "../../services/chatService";
import { Loader2, AlertCircle, MessageCircle, Clock } from "lucide-react";

export function ChatMessageList({
  messages,
  isLoading,
  error,
  formatDate,
  formatTime,
  highlightMentions,
  currentUser,
}) {
  const chatEndRef = useRef(null);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    if (!message || !message.created_at) {
      return groups;
    }

    try {
      const date = new Date(message.created_at).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    } catch (error) {
      return groups;
    }
  }, {});

  // Scroll to bottom when messages change or component mounts
  const scrollToBottom = () => {
    if (chatEndRef.current) {
      const chatContainer = chatEndRef.current.parentElement;
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    // Only run this effect if there are messages
    if (messages.length === 0) return;

    // Immediate scroll attempt
    scrollToBottom();

    // Just two more attempts should be sufficient
    const timer1 = setTimeout(() => scrollToBottom(), 100);
    const timer2 = setTimeout(() => scrollToBottom(), 300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [messages]);

  // Scroll to bottom on initial load and when component becomes visible
  useEffect(() => {
    // Immediate scroll attempt
    scrollToBottom();

    // Set up fewer delayed attempts
    const timer1 = setTimeout(() => scrollToBottom(), 100);
    const timer2 = setTimeout(() => scrollToBottom(), 300);

    // Create an observer to detect when the chat becomes visible
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // When chat becomes visible, scroll to bottom
            scrollToBottom();
          }
        });
      },
      { threshold: 0.1 }
    );

    // Create a mutation observer to detect when new messages are added to the DOM
    const mutationObserver = new MutationObserver((mutations) => {
      // Check if any nodes were added
      const nodesAdded = mutations.some(
        (mutation) =>
          mutation.type === "childList" && mutation.addedNodes.length > 0
      );

      if (nodesAdded) {
        // If nodes were added, scroll to bottom
        scrollToBottom();
      }
    });

    // Start observing the chat container
    if (chatEndRef.current && chatEndRef.current.parentElement) {
      visibilityObserver.observe(chatEndRef.current.parentElement);

      // Observe for changes to the DOM
      mutationObserver.observe(chatEndRef.current.parentElement, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      visibilityObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  // Function to check if this is the last message from this sender in a sequence
  const isLastMessageInSequence = (messages, index) => {
    if (index === messages.length - 1) return true;
    return messages[index].sender.id !== messages[index + 1].sender.id;
  };

  // Helper function to get the correct bubble classes based on position in sequence
  const getBubbleClasses = (isSender, isFirst, isLast) => {
    // Base classes that apply to all bubbles
    const baseClasses = isSender
      ? "bg-green-500 text-white"
      : "bg-white text-gray-800 border border-gray-200";

    // Single bubble (both first and last in sequence)
    if (isFirst && isLast) {
      return `${baseClasses} rounded-2xl`;
    }

    // First bubble in sequence
    if (isFirst) {
      return isSender
        ? `${baseClasses} rounded-t-2xl rounded-l-2xl rounded-br-md`
        : `${baseClasses} rounded-t-2xl rounded-r-2xl rounded-bl-md`;
    }

    // Last bubble in sequence
    if (isLast) {
      return isSender
        ? `${baseClasses} rounded-b-2xl rounded-l-2xl rounded-tr-md`
        : `${baseClasses} rounded-b-2xl rounded-r-2xl rounded-tl-md`;
    }

    // Middle bubble in sequence
    return isSender
      ? `${baseClasses} rounded-l-2xl rounded-tr-md rounded-br-md`
      : `${baseClasses} rounded-r-2xl rounded-tl-md rounded-bl-md`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
        <p className="text-gray-600 text-sm">
          {error || "Loading messages..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
        <p className="text-red-600 text-center">{error}</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          onClick={() => window.location.reload()}
        >
          Reload Page
        </button>
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <MessageCircle className="w-8 h-8 text-gray-400 mb-2" />
        <p className="text-gray-500 text-center">
          No messages yet. Be the first to send a message!
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-4 space-y-4 md:space-y-6">
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date} className="space-y-4">
          <div className="flex justify-center">
            <div className="text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full border border-gray-200 shadow-sm">
              {formatDate(dateMessages[0].created_at)}
            </div>
          </div>

          {dateMessages.map((message, index) => {
            const isLastInSequence = isLastMessageInSequence(
              dateMessages,
              index
            );
            const isSender = message.sender.id === currentUser.id;
            const isFirstMessage =
              index === 0 ||
              dateMessages[index - 1].sender.id !== message.sender.id;

            return (
              <div
                key={message.id}
                className={`flex gap-2 md:gap-3 ${
                  isSender ? "justify-end" : ""
                } ${!isFirstMessage ? "mt-0.5" : index > 0 ? "mt-3" : ""}`}
              >
                {!isSender && !isLastInSequence && (
                  <div className="w-8 h-8 md:w-9 md:h-9 flex-shrink-0"></div>
                )}

                {!isSender && isLastInSequence && (
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                    <img
                      src={
                        message.sender.avatar_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          message.sender.username
                        )}&background=random`
                      }
                      alt={message.sender.username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div
                  className={`max-w-[75%] md:max-w-[70%] ${getBubbleClasses(
                    isSender,
                    isFirstMessage,
                    isLastInSequence
                  )} shadow-sm p-3`}
                >
                  {isFirstMessage && (
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-medium ${
                            isSender ? "text-green-100" : "text-gray-700"
                          }`}
                        >
                          {isSender ? "You" : message.sender.username}
                        </span>
                        <span
                          className={`text-xs ${
                            isSender ? "text-green-200" : "text-gray-500"
                          }`}
                        >
                          ({message.sender.role})
                        </span>
                      </div>
                      <span
                        className={`text-xs ${
                          isSender ? "text-green-200" : "text-gray-500"
                        } flex items-center gap-1`}
                      >
                        <Clock className="w-3 h-3" />
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                  )}
                  <p
                    className={`text-sm break-words ${
                      isSender ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {highlightMentions(message.content)}
                  </p>
                </div>

                {isSender && !isLastInSequence && (
                  <div className="w-8 h-8 md:w-9 md:h-9 flex-shrink-0"></div>
                )}

                {isSender && isLastInSequence && (
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                    <img
                      src={
                        message.sender.avatar_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          message.sender.username
                        )}&background=random`
                      }
                      alt={message.sender.username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
      <div ref={chatEndRef} />
    </div>
  );
}
