import { AtSign, X, ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { CardHeader, CardTitle, CardDescription } from "../ui/card";

export function ChatHeader({ isConnected, toggleChat, isMobileView }) {
  return (
    <>
      {/* Mobile header with close button */}
      {isMobileView && (
        <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AtSign className="w-5 h-5" />
            <h2 className="font-medium">General Chat</h2>
            {!isConnected && (
              <Badge variant="outline" className="bg-red-500 text-white border-red-600 text-xs">
                Offline
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full text-white hover:bg-blue-700"
            onClick={toggleChat}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Desktop header */}
      {!isMobileView && (
        <CardHeader className="border-b border-gray-200 pb-3 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-blue-100">
                <AtSign className="w-4 h-4 text-blue-700" />
              </div>
              General Chat
              {!isConnected && (
                <Badge variant="outline" className="bg-red-500 text-white border-red-600 text-xs ml-2">
                  Offline
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full"
              onClick={toggleChat}
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
          </div>
          <CardDescription className="text-gray-600">
            Use @role to notify team members
          </CardDescription>
        </CardHeader>
      )}
    </>
  );
}
