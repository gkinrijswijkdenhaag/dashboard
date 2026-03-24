import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "../ui/card";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";
import chatService from "../../services/chatService";
import authService from "../../services/authService";

// Enhanced role colors mapping with better contrast
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

export function ChatContainer({ toggleChat, isMobileView, markAllAsRead }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  // Get current user
  const currentUser = authService.getCurrentUser();

  // Track if we've already loaded messages in this session
  const hasLoadedMessagesRef = useRef(false);

  // Keep track of recently sent message IDs to prevent duplicates
  const recentlySentMessagesRef = useRef(new Set());

  // Initialize chat and connect to socket
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    const initializeChat = async () => {
      try {
        if (!isMounted) return;

        setIsLoading(true);
        setError(null);

        // Check if we already have messages and are just reopening the chat
        if (hasInitiallyLoaded && messages.length > 0) {
          setIsLoading(false);

          // Force scroll to bottom after a short delay to ensure rendering is complete
          setTimeout(() => {
            const chatContent = document.querySelector(".chat-content");
            if (chatContent) {
              chatContent.scrollTop = chatContent.scrollHeight;
            }
          }, 100);

          return;
        }

        // Check if we're already connected via the NotificationContext
        if (!chatService.connected) {
          // Only connect if not already connected
          try {
            await chatService.connect();
          } catch (connectionError) {
            // Continue anyway - we can still use the REST API
          }
        }

        // Update connection status
        setIsConnected(chatService.connected);

        // Reduced delay on dashboard direct load to ensure auth is ready
        // This helps with the race condition where messages don't load on first page load
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Try multiple times to load messages if needed
        let messageLoadAttempt = 0;
        let initialMessages = [];

        while (messageLoadAttempt < 2) {
          // Reduced from 3 to 2 attempts
          try {
            initialMessages = await chatService.getMessages();

            if (Array.isArray(initialMessages) && initialMessages.length > 0) {
              break;
            } else {
              await new Promise((resolve) => setTimeout(resolve, 500)); // Reduced from 1000ms to 500ms
              messageLoadAttempt++;
            }
          } catch (msgError) {
            await new Promise((resolve) => setTimeout(resolve, 500)); // Reduced from 1000ms to 500ms
            messageLoadAttempt++;
          }
        }

        // Only update state if component is still mounted
        if (isMounted) {
          // Force re-render with messages
          if (Array.isArray(initialMessages)) {
            setMessages([...initialMessages]);

            // Force scroll to bottom after a short delay to ensure rendering is complete
            setTimeout(() => {
              const chatContent = document.querySelector(".chat-content");
              if (chatContent) {
                chatContent.scrollTop = chatContent.scrollHeight;
              }
            }, 100); // Reduced from 200ms to 100ms
          } else {
            setMessages([]);
          }

          setIsLoading(false);
          hasLoadedMessagesRef.current = true;
          setHasInitiallyLoaded(true);
        }
      } catch (error) {
        if (!isMounted) return;

        console.error("Error initializing chat:", error);

        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying (${retryCount}/${maxRetries})...`);
          setError(
            `Loading messages... Retrying (${retryCount}/${maxRetries})`
          );

          // Wait a bit and retry
          setTimeout(() => {
            if (isMounted) {
              initializeChat();
            }
          }, 1000); // Reduced from 2000ms to 1000ms
        } else {
          setError(
            error.message ||
              "Failed to connect to chat. Please try again later."
          );
          setIsLoading(false);
        }
      }
    };

    // Call initialization function
    initializeChat();

    // Set up message listener
    chatService.onMessage(handleNewMessage);
    chatService.onConnectionChange(handleConnectionChange);

    // Set up a periodic refresh of messages (less frequent)
    const refreshInterval = setInterval(() => {
      if (!isLoading && isMounted) {
        chatService
          .getMessages()
          .then((newMessages) => {
            if (Array.isArray(newMessages) && isMounted) {
              setMessages([...newMessages]);
            }
          })
          .catch((err) => {
            if (isMounted) {
              console.error("Error refreshing messages:", err);
            }
          });
      }
    }, 60000); // Refresh every 60 seconds

    // Clean up on unmount - but don't disconnect since NotificationContext might still need the connection
    return () => {
      isMounted = false;
      chatService.offMessage(handleNewMessage);
      chatService.offConnectionChange(handleConnectionChange);
      clearInterval(refreshInterval);
    };
  }, []);

  // Handle connection status changes
  const handleConnectionChange = (connected) => {
    setIsConnected(connected);
  };

  // Function to scroll to bottom of chat
  const scrollToLatestMessage = () => {
    setTimeout(() => {
      const chatContent = document.querySelector(".chat-content");
      if (chatContent) {
        chatContent.scrollTop = chatContent.scrollHeight;
      }
    }, 50);
  };

  // Handle new incoming messages
  const handleNewMessage = (message) => {
    if (!message || !message.id) {
      return;
    }

    // Check if this message is from the current user and already in the messages array
    // or if it's in our recently sent messages set
    const isDuplicate =
      messages.some((existingMsg) => existingMsg.id === message.id) ||
      recentlySentMessagesRef.current.has(message.id);

    if (!isDuplicate) {
      setMessages((prevMessages) => {
        const newMessages = Array.isArray(prevMessages)
          ? [...prevMessages, message]
          : [message];
        // Trigger scroll to bottom after state update
        scrollToLatestMessage();
        return newMessages;
      });
    } else {
      // If it's a duplicate but from the socket, we can remove it from our tracking set
      // as we no longer need to track it
      if (recentlySentMessagesRef.current.has(message.id)) {
        recentlySentMessagesRef.current.delete(message.id);
      }
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Format date for message groups
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  // Highlight mentions in message text
  const highlightMentions = (text) => {
    return text.split(" ").map((word, index) => {
      if (word.startsWith("@")) {
        const role = word.substring(1).toLowerCase();
        const color = roleColors[role]?.text || "text-blue-600";

        return (
          <span key={index}>
            <span className={`${color} font-medium`}>{word}</span>{" "}
          </span>
        );
      }
      return <span key={index}>{word} </span>;
    });
  };

  // Send message
  const handleSendMessage = async (content) => {
    if (content.trim() === "" || isSending) return;

    try {
      setIsSending(true);

      // Extract mentions
      const mentions = chatService.extractMentions(content);

      // Send the message and get the saved message from the server
      const savedMessage = await chatService.sendMessage(content, mentions);

      // Track this message ID to prevent duplicates when socket sends it back
      if (savedMessage && savedMessage.id) {
        recentlySentMessagesRef.current.add(savedMessage.id);

        // Set a timeout to clean up the tracking set after a while
        // This prevents memory leaks if the socket never returns the message
        setTimeout(() => {
          recentlySentMessagesRef.current.delete(savedMessage.id);
        }, 10000); // 10 seconds should be plenty of time
      }

      // Add the message to our local state immediately
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages, savedMessage];
        // Ensure we scroll to bottom after sending a message
        scrollToLatestMessage();
        return newMessages;
      });

      setIsSending(false);
      return savedMessage;
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
      setIsSending(false);
      throw error;
    }
  };

  return (
    <Card className="h-full flex flex-col shadow-xl border border-gray-300 rounded-t-lg md:rounded-lg overflow-hidden">
      <ChatHeader
        isConnected={isConnected}
        toggleChat={toggleChat}
        isMobileView={isMobileView}
      />

      <CardContent className="flex-1 overflow-y-auto p-0 bg-gray-50 chat-content">
        <ChatMessageList
          messages={messages}
          isLoading={isLoading}
          error={error}
          formatDate={formatDate}
          formatTime={formatTime}
          highlightMentions={highlightMentions}
          currentUser={currentUser}
        />
      </CardContent>

      {!isConnected && (
        <div className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 text-center border-t border-yellow-200">
          Real-time updates disabled. Messages will still be sent and received.
        </div>
      )}

      <ChatInput onSendMessage={handleSendMessage} isSending={isSending} />
    </Card>
  );
}
