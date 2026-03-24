import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Mail, Check } from "lucide-react";

export function PastorNotifyModal({ isOpen, onClose, onSubmit, documentType }) {
  // Default values
  const documentTypes = {
    concept: "Concept Document",
    final: "Final Liturgy",
    sermon: "Sermon",
  };

  const documentTitle = documentTypes[documentType] || "Document";

  // State for form values and team selections
  const [formValues, setFormValues] = useState({
    subject: `[GKIN] Pastor Review Complete - ${documentTitle}`,
    message: `Dear Team,\n\nI have reviewed the ${documentTitle} and made necessary edits. You can now proceed with the next steps.\n\nKind regards,\nPastor`,
  });

  // Teams to notify
  const [selectedTeams, setSelectedTeams] = useState({
    liturgy: true,
    music: true,
    translation: true,
    beamer: false,
  });

  // Reset form when modal opens with a new document type
  useEffect(() => {
    if (isOpen) {
      setFormValues({
        subject: `[GKIN] Pastor Review Complete - ${documentTitle}`,
        message: `Dear Team,\n\nI have reviewed the ${documentTitle} and made necessary edits. You can now proceed with the next steps.\n\nKind regards,\nPastor`,
      });
      setSelectedTeams({
        liturgy: true,
        music: true,
        translation: true,
        beamer: false,
      });
    }
  }, [isOpen, documentTitle]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle team selection changes
  const handleTeamChange = (e) => {
    const { name, checked } = e.target;
    setSelectedTeams((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Create an array of selected team emails
    const teamEmails = [];
    if (selectedTeams.liturgy) teamEmails.push("liturgy@gkin.org");
    if (selectedTeams.music) teamEmails.push("music@gkin.org");
    if (selectedTeams.translation) teamEmails.push("translation@gkin.org");
    if (selectedTeams.beamer) teamEmails.push("beamer@gkin.org");

    onSubmit({
      ...formValues,
      documentType,
      teams: Object.keys(selectedTeams).filter((team) => selectedTeams[team]),
      teamEmails: teamEmails,
    });
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle Escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (isOpen && e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 my-8 animate-fadeIn"
        style={{ maxHeight: "calc(100vh - 4rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <Check className="w-5 h-5 text-green-600" />
            Notify Teams After Review
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 8rem)" }}
        >
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-gray-700 font-medium">
                Teams to Notify
              </Label>
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200 space-y-2">
                {Object.entries({
                  liturgy: "Liturgy Team",
                  music: "Music Team",
                  translation: "Translation Team",
                  beamer: "Beamer Team",
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`team-${key}`}
                      name={key}
                      checked={selectedTeams[key]}
                      onChange={handleTeamChange}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <Label htmlFor={`team-${key}`} className="cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subject" className="text-gray-700">
                Subject
              </Label>
              <Input
                id="subject"
                name="subject"
                value={formValues.subject}
                onChange={handleChange}
                className="border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="message" className="text-gray-700">
                Message
              </Label>
              <Textarea
                id="message"
                name="message"
                rows={6}
                value={formValues.message}
                onChange={handleChange}
                className="border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                required
              />
            </div>

            {/* Document info */}
            <div className="bg-green-50 p-4 rounded-md border border-green-200">
              <h3 className="text-sm font-medium text-green-800 mb-2">
                Document Information
              </h3>
              <div className="text-sm text-green-700">
                <p>
                  <span className="font-medium">Document Type:</span>{" "}
                  {documentTitle}
                </p>
                <p className="mt-1">
                  <span className="font-medium">Status:</span> Reviewed by
                  Pastor
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              onClick={onClose}
              className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Send Notifications
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
