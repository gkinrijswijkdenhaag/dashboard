import { useState, useEffect } from "react";
import { useTranslation } from "../../context/TranslationContext";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { Globe, Save, Check, X, AlertCircle, Clock } from "lucide-react";
import { toast } from "react-hot-toast";

export function TranslationForm({ lyric, onClose, canTranslate, onTranslationSuccess }) {
  const { submitTranslation } = useTranslation();

  const [translatedTitle, setTranslatedTitle] = useState("");
  const [translatedLyrics, setTranslatedLyrics] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with existing translation if available
  useEffect(() => {
    if (lyric?.translation) {
      setTranslatedTitle(lyric.translation.translated_title || "");
      setTranslatedLyrics(lyric.translation.translated_lyrics || "");
    } else {
      setTranslatedTitle("");
      setTranslatedLyrics("");
    }
  }, [lyric]);

  // Handle translation submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!translatedTitle.trim() || !translatedLyrics.trim()) {
      toast.error("Please provide both title and lyrics translations");
      return;
    }

    setIsSubmitting(true);

    try {
      await submitTranslation(
        lyric.id,
        translatedTitle.trim(),
        translatedLyrics.trim()
      );

      // Call the success callback to show banner
      if (onTranslationSuccess) {
        onTranslationSuccess(lyric.title || lyric.original_title);
      }
    } catch (error) {
      // Error is handled in the context
      console.error("Error in translation submission:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Approval functionality removed as per user request

  // Determine if form is editable - all users can translate unless the translation is approved
  const isEditable =
    !lyric.translation || lyric.translation.status !== "approved";

  // Get status badge
  const getStatusBadge = () => {
    if (!lyric.translation) {
      return (
        <div className="flex items-center text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-sm">
          <Clock className="h-4 w-4 mr-1" />
          Pending Translation
        </div>
      );
    }

    switch (lyric.translation.status) {
      case "completed":
        return (
          <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
            <Check className="h-4 w-4 mr-1" />
            Translated
          </div>
        );
      case "approved":
        return (
          <div className="flex items-center text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm">
            <Check className="h-4 w-4 mr-1" />
            Approved
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm">
            <AlertCircle className="h-4 w-4 mr-1" />
            Needs Revision
          </div>
        );
      default:
        return (
          <div className="flex items-center text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-sm">
            <Clock className="h-4 w-4 mr-1" />
            In Progress
          </div>
        );
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 bg-blue-50 border-b border-blue-100 flex flex-wrap justify-between items-center">
        <div className="flex items-center mb-2 sm:mb-0">
          <Globe className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
          <h2 className="text-lg font-medium text-gray-800 truncate">
            Translate Lyrics
          </h2>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {getStatusBadge()}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 flex-shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Left column - Original */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700 flex items-center">
              Original Lyrics
            </h3>

            <div className="space-y-3">
              <div>
                <Label htmlFor="original-title" className="text-gray-600">
                  Song Title
                </Label>
                <div className="mt-1 p-2 border border-gray-200 rounded-md bg-gray-50 break-words overflow-auto max-h-[100px]">
                  {lyric.title}
                </div>
              </div>

              <div>
                <Label htmlFor="original-lyrics" className="text-gray-600">
                  Lyrics
                </Label>
                <div className="mt-1 p-2 border border-gray-200 rounded-md bg-gray-50 min-h-[300px] max-h-[500px] overflow-auto whitespace-pre-line break-words">
                  {lyric.lyrics}
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Translation */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700 flex flex-wrap items-center">
              <span className="mr-2">Translation</span>
              {lyric.translation?.translated_by && (
                <span className="text-xs text-gray-500 font-normal inline-flex items-center">
                  by{" "}
                  <span className="ml-1 truncate max-w-[150px]">
                    {lyric.translation.translated_by.name}
                  </span>
                </span>
              )}
            </h3>

            <div className="space-y-3">
              <div>
                <Label htmlFor="translated-title" className="text-gray-600">
                  Translated Title
                </Label>
                <Input
                  id="translated-title"
                  value={translatedTitle}
                  onChange={(e) => setTranslatedTitle(e.target.value)}
                  className="mt-1 overflow-ellipsis"
                  placeholder="Enter translated title"
                  disabled={!isEditable}
                  spellCheck="true"
                />
              </div>

              <div>
                <Label htmlFor="translated-lyrics" className="text-gray-600">
                  Translated Lyrics
                </Label>
                <Textarea
                  id="translated-lyrics"
                  value={translatedLyrics}
                  onChange={(e) => setTranslatedLyrics(e.target.value)}
                  className="mt-1 min-h-[300px] max-h-[500px] overflow-auto resize-y"
                  placeholder="Enter translated lyrics"
                  disabled={!isEditable}
                  spellCheck="true"
                  wrap="soft"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2">
          {isEditable && (
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Translation
                </>
              )}
            </Button>
          )}

          {/* Approval button removed as per user request */}
        </div>
      </form>
    </Card>
  );
}
