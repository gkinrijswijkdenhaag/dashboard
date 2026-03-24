import { useState, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

// Role colors mapping with better contrast
const roleColors = {
  liturgy: {
    bg: "bg-blue-600",
    text: "text-blue-600",
    light: "bg-blue-50",
    border: "border-blue-200",
  },
  admin: {
    bg: "bg-indigo-600",
    text: "text-indigo-600",
    light: "bg-indigo-50",
    border: "border-indigo-200",
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

export function ChatInput({ onSendMessage, isSending }) {
  const [newMessage, setNewMessage] = useState("");
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionPosition, setMentionPosition] = useState(0);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const inputRef = useRef(null);

  // Handle input changes and detect @ mentions
  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    // Check for @ mentions
    const lastAtSymbolIndex = value.lastIndexOf("@");
    if (
      lastAtSymbolIndex !== -1 &&
      lastAtSymbolIndex > value.lastIndexOf(" ")
    ) {
      setShowMentionSuggestions(true);
      setMentionPosition(lastAtSymbolIndex);
      const searchText = value.substring(lastAtSymbolIndex + 1).toLowerCase();
      setMentionSearch(searchText);

      // Filter suggestions based on roles and names
      const suggestions = [];

      // First check for role matches
      const roles = ["liturgy", "translation", "beamer", "music", "treasurer", "admin"];
      const matchingRoles = roles.filter((role) =>
        role.toLowerCase().includes(searchText)
      );

      matchingRoles.forEach((role) => {
        suggestions.push({ type: "role", value: role });
      });

      setFilteredSuggestions(suggestions);
    } else {
      setShowMentionSuggestions(false);
    }
  };

  // Apply selected mention
  const applyMention = (suggestion) => {
    const beforeMention = newMessage.substring(0, mentionPosition);
    let mentionText = "";

    if (suggestion.type === "role") {
      mentionText = `@${suggestion.value} `;
    } else {
      mentionText = `@${suggestion.value.name} `;
    }

    const afterMention = newMessage.substring(
      mentionPosition + mentionSearch.length + 1
    );

    setNewMessage(beforeMention + mentionText + afterMention);
    setShowMentionSuggestions(false);
    inputRef.current.focus();
  };

  // Send message
  const sendMessage = async () => {
    if (newMessage.trim() === "" || isSending) return;
    
    try {
      await onSendMessage(newMessage);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="p-3 md:p-4 border-t border-gray-200 bg-white relative flex-shrink-0">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="w-full px-4 py-2.5 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 shadow-sm"
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={isSending}
          />

          {showMentionSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute bottom-full left-0 mb-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
              <div className="p-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600">
                Suggestions
              </div>
              {filteredSuggestions.map((suggestion, index) => {
                if (suggestion.type === "role") {
                  const roleColor =
                    roleColors[suggestion.value]?.bg || "bg-blue-600";
                  const lightColor =
                    roleColors[suggestion.value]?.light || "bg-blue-50";

                  return (
                    <div
                      key={index}
                      className="p-2.5 hover:bg-gray-50 cursor-pointer flex items-center gap-2 border-b border-gray-100"
                      onClick={() => applyMention(suggestion)}
                    >
                      <div
                        className={`w-6 h-6 rounded-full ${lightColor} flex items-center justify-center`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full ${roleColor}`}
                        ></div>
                      </div>
                      <span className="font-medium text-gray-800">
                        {suggestion.value}
                      </span>
                      <Badge
                        variant="outline"
                        className="ml-auto text-xs bg-gray-50 border-gray-200 text-gray-600"
                      >
                        role
                      </Badge>
                    </div>
                  );
                } else {
                  const roleColor =
                    roleColors[suggestion.value.role]?.bg ||
                    "bg-blue-600";

                  return (
                    <div
                      key={index}
                      className="p-2.5 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-100"
                      onClick={() => applyMention(suggestion)}
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                        <img
                          src={suggestion.value.avatar}
                          alt={suggestion.value.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">
                          {suggestion.value.name}
                        </div>
                        <div className="text-xs flex items-center gap-1 text-gray-600">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${roleColor}`}
                          ></div>
                          {suggestion.value.role}
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>
        <Button
          onClick={sendMessage}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4"
          disabled={!newMessage.trim() || isSending}
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
