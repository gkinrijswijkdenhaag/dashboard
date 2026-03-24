import { createContext, useContext, useState, useEffect } from 'react';
import chatService from '../services/chatService';
import authService from '../services/authService';

// Create context
const NotificationContext = createContext();

/**
 * Provider component for notifications
 */
export function NotificationProvider({ children }) {
  const [mentions, setMentions] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize and fetch mentions
  useEffect(() => {
    const initializeNotifications = async () => {
      if (!authService.isAuthenticated()) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Connect to chat service
        await chatService.connect();
        
        // Fetch initial mentions
        const mentionsData = await chatService.getMentions();
        setMentions(mentionsData);
        
        // Get unread count
        const count = await chatService.getUnreadMentionCount();
        setUnreadCount(count);
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing notifications:', error);
        setLoading(false);
      }
    };

    initializeNotifications();

    // Set up listeners
    chatService.onMention(handleNewMention);
    chatService.onConnectionChange(handleConnectionChange);

    // Add periodic refresh to ensure mentions are up-to-date
    // This helps when users log in after mentions were created
    const refreshInterval = setInterval(async () => {
      if (authService.isAuthenticated()) {
        try {
          // Only refresh if we're not currently loading
          if (!loading) {
            const count = await chatService.getUnreadMentionCount();
            if (count !== unreadCount) {
              // If count changed, refresh mentions
              await refreshMentions();
            }
          }
        } catch (error) {
          console.error('Error during periodic mention refresh:', error);
        }
      }
    }, 30000); // Check every 30 seconds

    // Clean up on unmount
    return () => {
      chatService.offMention(handleNewMention);
      chatService.offConnectionChange(handleConnectionChange);
      clearInterval(refreshInterval);
    };
  }, []);

  // Also refresh mentions when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && authService.isAuthenticated()) {
        // Page became visible, refresh mentions
        refreshMentions();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Handle connection status changes
  const handleConnectionChange = (connected) => {
    setIsConnected(connected);
  };

  // Handle new mentions
  const handleNewMention = (mention) => {
    
    // Check if this mention already exists in our list (by message_id)
    let isDuplicate = false;
    
    setMentions(prev => {
      // Check if we already have this mention by message_id
      const existingIndex = prev.findIndex(m => 
        (m.message_id && m.message_id === mention.messageId) || 
        (m.messageId && m.messageId === mention.messageId)
      );
      
      if (existingIndex >= 0) {
        isDuplicate = true;
        return prev;
      }
      
      // Ensure the mention has the proper structure
      const formattedMention = {
        ...mention,
        is_read: false, // Explicitly mark as unread
        // Store message_id in all possible formats for easier matching later
        id: mention.id || mention.messageId,
        messageId: mention.messageId || mention.id,
        message_id: mention.message_id || mention.messageId || mention.id,
        // Add a special flag to identify real-time mentions
        isRealTime: true,
        // Preserve sender information if available
        sender: mention.sender || null,
        // Add placeholder content if not available
        content: mention.content || `@${mention.value} mentioned`
      };
      
      
      // Add to mentions list
      return [formattedMention, ...prev];
    });
    
    // Only increment unread count if it's not a duplicate
    if (!isDuplicate) {
      setUnreadCount(prev => prev + 1);
    }
    
    // Force a refresh to ensure we have the server's version too
    setTimeout(() => {
      refreshMentions();
    }, 1000);
  };

  // Mark mentions as read
  const markAsRead = async (mentionIds) => {
    try {
      
      if (!mentionIds || mentionIds.length === 0) {
        console.error("No valid mention IDs provided");
        return;
      }
      
      // First, immediately set unread count to 0 for instant feedback
      setUnreadCount(0);
      
      // Then update local state for better UX
      let markedCount = 0;
      let markedMessageIds = []; // Track message IDs for more robust matching
      
      setMentions(prev => {
        const updatedMentions = prev.map(mention => {
          // Normalize the mention to ensure we have all ID formats
          const normalizedMention = {
            ...mention,
            id: mention.id || mention.messageId || mention.message_id,
            messageId: mention.messageId || mention.id || mention.message_id,
            message_id: mention.message_id || mention.messageId || mention.id
          };
          
          // Get all possible IDs from the mention object
          const mentionId = normalizedMention.id;
          const messageId = normalizedMention.message_id || normalizedMention.messageId;
          
          // Check if this mention should be marked as read by matching any of the IDs
          // We need to check all possible ID combinations
          const shouldMarkAsRead = mentionIds.some(id => {
            // Direct ID match
            if (id === mentionId || id === messageId || id === normalizedMention.messageId) {
              return true;
            }
            
            // Match by message_id (this is crucial for real-time mentions)
            const mentionMessageIds = [
              normalizedMention.message_id,
              normalizedMention.messageId,
              normalizedMention.id
            ].filter(Boolean);
            
            return mentionMessageIds.some(msgId => msgId === id);
          });
          
          if (shouldMarkAsRead) {
            markedCount++;
            
            // Track message IDs for more robust matching
            if (messageId) {
              markedMessageIds.push(messageId);
            }
            
            // Return a fully normalized mention with is_read set to true
            return { ...normalizedMention, is_read: true };
          }
          return mention;
        });
        return updatedMentions;
      });
      
      // Send to server - send both IDs and message IDs for robustness
      // Include all possible IDs to ensure the server marks the correct mention
      const idsToSend = [...new Set([...mentionIds, ...markedMessageIds])];
      
      // Send to server and await the response
      await chatService.markMentionsAsRead(idsToSend);
      
      // After server update, do a full refresh of mentions to ensure consistency
      await refreshMentions();
      
      return true; // Indicate success
    } catch (error) {
      console.error('Error marking mentions as read:', error);
      // Refresh mentions to ensure UI is in sync with server
      refreshMentions();
      return false; // Indicate failure
    }
  };

  // Mark all mentions as read
  const markAllAsRead = async () => {
    // Collect both id and messageId for more robust matching
    const unreadMentionIds = [];
    
    mentions
      .filter(mention => !mention.is_read)
      .forEach(mention => {
        if (mention.id) unreadMentionIds.push(mention.id);
        if (mention.messageId) unreadMentionIds.push(mention.messageId);
        if (mention.message_id) unreadMentionIds.push(mention.message_id);
      });
      
      
    if (unreadMentionIds.length > 0) {
      // First update local state immediately
      setMentions(prev => 
        prev.map(mention => ({ ...mention, is_read: true }))
      );
      
      // Reset unread count immediately
      setUnreadCount(0);
      
      // Then update server
      try {
        await chatService.markMentionsAsRead(unreadMentionIds);
        
        // Double-check with server to ensure consistency
        const count = await chatService.getUnreadMentionCount();
        
        // If server still reports unread mentions, do a full refresh
        if (count > 0) {
          refreshMentions();
        }
      } catch (error) {
        console.error('Error marking all mentions as read:', error);
        // Refresh mentions to ensure UI is in sync with server
        refreshMentions();
      }
    }
  };

  // Refresh mentions
  const refreshMentions = async () => {
    try {
      setLoading(true);
      
      // First get the unread count directly
      const count = await chatService.getUnreadMentionCount();
      
      // Update unread count immediately
      setUnreadCount(count);
      
      // Then get the full mentions data
      const mentionsData = await chatService.getMentions();
      
      // Update mentions state, but preserve real-time mentions that haven't been synced yet
      setMentions(prev => {
        // First, identify real-time mentions that don't have server counterparts
        const realTimeMentions = prev.filter(m => m.isRealTime);
        
                  // For each server mention, try to find a matching real-time mention
          const updatedMentions = mentionsData.map(serverMention => {
            // Try to find a matching real-time mention by message_id
            const matchingRealTimeMention = realTimeMentions.find(rtm => 
              (rtm.messageId && rtm.messageId === serverMention.message_id) ||
              (rtm.message_id && rtm.message_id === serverMention.message_id)
            );
            
            // Extract role from content if available
            let extractedRole = null;
            if (serverMention.content) {
              // Look for @role pattern in the content
              const roleMatch = serverMention.content.match(/@(\w+)/);
              if (roleMatch && roleMatch[1]) {
                extractedRole = roleMatch[1].toLowerCase();
              }
            }
            
            if (matchingRealTimeMention) {
              // Merge the two mentions, preferring real-time values for role information
              return {
                ...serverMention,
                isRealTime: true,
                // Keep all ID formats for easier matching
                messageId: serverMention.message_id || serverMention.messageId || serverMention.id,
                // If the real-time mention was marked as read, keep that status
                is_read: matchingRealTimeMention.is_read === true ? true : serverMention.is_read,
                // Ensure we have sender information
                sender: serverMention.sender || matchingRealTimeMention.sender,
                // Preserve the role value from the real-time mention
                value: matchingRealTimeMention.value || extractedRole || serverMention.value,
                type: matchingRealTimeMention.type || serverMention.type || 'role'
              };
            }
            
            // For server mentions without a real-time counterpart, extract role from content
            return {
              ...serverMention,
              // Add the role information
              value: extractedRole || serverMention.value,
              type: 'role'
            };
          });
        
        return updatedMentions;
      });
      
      // If the server says there are no unread mentions, make sure the UI reflects that
      if (count === 0) {
        // Force UI update to ensure badge is hidden
        setUnreadCount(0);
        
        // Update all mentions to be read
        setMentions(prev => 
          prev.map(mention => ({ ...mention, is_read: true }))
        );
      }
      
      setLoading(false);
      return { count, mentions: mentionsData };
    } catch (error) {
      console.error('Error refreshing mentions:', error);
      setLoading(false);
      return { error };
    }
  };

  // Context value
  const value = {
    mentions,
    unreadCount,
    loading,
    isConnected,
    markAsRead,
    markAllAsRead,
    refreshMentions
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to use the notification context
 */
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
