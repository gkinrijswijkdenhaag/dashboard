import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { FileText, X } from "lucide-react";
import { useState } from "react";

export function WelcomeBanner({
  userName,
  roleName,
  onStartAction,
  onDismiss,
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
      <CardContent className="p-3 md:p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h2 className="text-base md:text-lg font-medium text-gray-900">
                Welcome, {userName}!
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700 md:hidden h-6 w-6 min-h-0 p-0"
                onClick={handleDismiss}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
            <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">
              As the <span className="font-medium">{roleName}</span>, your first
              task is to create the liturgy concept document.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-3 w-full md:w-auto">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto h-8 md:h-9 text-xs md:text-sm"
              onClick={() => onStartAction && onStartAction(1)}
            >
              <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
              Upload Concept Document
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700 hidden md:flex h-8 md:h-9 min-h-0"
              onClick={handleDismiss}
            >
              <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
