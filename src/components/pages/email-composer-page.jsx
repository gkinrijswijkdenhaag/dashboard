import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  X,
  Send,
  Paperclip,
  Trash2,
  AlertCircle,
  User,
  Users,
  Plus,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";

export function EmailComposerPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // State from route or defaults
  const [recipients, setRecipients] = useState([]);
  const [serviceTitle, setServiceTitle] = useState("");
  const [defaultSubject, setDefaultSubject] = useState("");

  // Form state
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [cc, setCc] = useState([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [bcc, setBcc] = useState([]);
  const [newToRecipient, setNewToRecipient] = useState("");
  const [newCcRecipient, setNewCcRecipient] = useState("");
  const [newBccRecipient, setNewBccRecipient] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Extract data from state if available
    if (location.state) {
      const { recipients, serviceTitle, defaultSubject } = location.state;
      if (recipients && Array.isArray(recipients)) setRecipients(recipients);
      if (serviceTitle) setServiceTitle(serviceTitle);
      if (defaultSubject) {
        setDefaultSubject(defaultSubject);
        setSubject(defaultSubject);
      }
    }
  }, [location]);

  const handleSend = () => {
    if (recipients.length === 0) {
      setError("Please add at least one recipient");
      return;
    }

    if (!subject.trim()) {
      setError("Please enter a subject");
      return;
    }

    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }

    setError("");
    setSending(true);

    // Simulate sending email
    setTimeout(() => {
      setSending(false);
      handleClose(true);
    }, 1000);
  };

  const handleClose = (success) => {
    if (success) {
      // Could show a success toast here
      alert("Email sent successfully!");
    }
    navigate(-1); // Go back to previous page
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newAttachments = files.map((file) => ({
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
      }));

      setAttachments([...attachments, ...newAttachments]);
    }

    // Reset the input so the same file can be selected again
    e.target.value = "";
  };

  const removeAttachment = (id) => {
    setAttachments(attachments.filter((attachment) => attachment.id !== id));
  };

  const validateEmail = (email) => {
    return email.trim() !== "" && email.includes("@");
  };

  const addRecipient = (type, email) => {
    const emailToAdd =
      type === "to"
        ? newToRecipient
        : type === "cc"
        ? newCcRecipient
        : newBccRecipient;

    if (!validateEmail(emailToAdd)) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");

    if (type === "to") {
      setRecipients([...recipients, emailToAdd.trim()]);
      setNewToRecipient("");
    } else if (type === "cc") {
      setCc([...cc, emailToAdd.trim()]);
      setNewCcRecipient("");
    } else if (type === "bcc") {
      setBcc([...bcc, emailToAdd.trim()]);
      setNewBccRecipient("");
    }
  };

  const removeRecipient = (email, type) => {
    if (type === "to") {
      setRecipients(recipients.filter((recipient) => recipient !== email));
    } else if (type === "cc") {
      setCc(cc.filter((recipient) => recipient !== email));
    } else if (type === "bcc") {
      setBcc(bcc.filter((recipient) => recipient !== email));
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl mx-auto bg-white shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-blue-50">
          <div>
            <CardTitle className="text-lg text-gray-900">
              Compose Email
            </CardTitle>
            <p className="text-xs text-blue-600 mt-1 truncate max-w-[300px]">
              {subject
                ? subject
                : serviceTitle
                ? `Re: ${serviceTitle}`
                : "New Email"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-blue-100 text-gray-600"
            onClick={() => handleClose(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        {error && (
          <div className="mx-4 mt-4 p-2 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <CardContent className="p-4 space-y-4 bg-white">
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To:
              </label>
              <div className="flex gap-2">
                {!showCc && (
                  <button
                    type="button"
                    onClick={() => setShowCc(true)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Add Cc
                  </button>
                )}
                {!showBcc && (
                  <button
                    type="button"
                    onClick={() => setShowBcc(true)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Add Bcc
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-gray-50 min-h-[40px]">
              {recipients.map((recipient, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1"
                >
                  <User className="h-3 w-3" />
                  {recipient}
                  <button
                    type="button"
                    onClick={() => removeRecipient(recipient, "to")}
                    className="ml-1 text-blue-700 hover:text-blue-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <div className="flex flex-1 min-w-[150px] items-center">
                <input
                  type="email"
                  value={newToRecipient}
                  onChange={(e) => setNewToRecipient(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addRecipient("to")}
                  placeholder="Enter email address"
                  className="w-full border-none bg-transparent text-sm focus:outline-none text-gray-700"
                />
                {newToRecipient && (
                  <button
                    type="button"
                    onClick={() => addRecipient("to")}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {showCc && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cc:
              </label>
              <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-gray-50 min-h-[40px]">
                {cc.map((recipient, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1"
                  >
                    {recipient}
                    <button
                      type="button"
                      onClick={() => removeRecipient(recipient, "cc")}
                      className="ml-1 text-blue-700 hover:text-blue-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <div className="flex flex-1 min-w-[150px] items-center">
                  <input
                    type="email"
                    value={newCcRecipient}
                    onChange={(e) => setNewCcRecipient(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addRecipient("cc")}
                    placeholder="Enter email address"
                    className="w-full border-none bg-transparent text-sm focus:outline-none text-gray-700"
                  />
                  {newCcRecipient && (
                    <button
                      type="button"
                      onClick={() => addRecipient("cc")}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {showBcc && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bcc:
              </label>
              <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-gray-50 min-h-[40px]">
                {bcc.map((recipient, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1"
                  >
                    {recipient}
                    <button
                      type="button"
                      onClick={() => removeRecipient(recipient, "bcc")}
                      className="ml-1 text-blue-700 hover:text-blue-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <div className="flex flex-1 min-w-[150px] items-center">
                  <input
                    type="email"
                    value={newBccRecipient}
                    onChange={(e) => setNewBccRecipient(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addRecipient("bcc")}
                    placeholder="Enter email address"
                    className="w-full border-none bg-transparent text-sm focus:outline-none text-gray-700"
                  />
                  {newBccRecipient && (
                    <button
                      type="button"
                      onClick={() => addRecipient("bcc")}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Subject:
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-2 border rounded-md text-gray-700"
              placeholder="Enter email subject"
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Message:
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 border rounded-md min-h-[200px] text-gray-700"
              placeholder="Write your message here..."
            />
          </div>

          {/* Attachments section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Attachments:
              </label>
              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-1 px-2 rounded-md flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                <span>Add Files</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {attachments.length > 0 ? (
              <div className="space-y-2 max-h-[150px] overflow-y-auto p-2 border rounded-md bg-gray-50">
                {attachments.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between bg-white p-2 rounded border"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Paperclip className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-xs font-medium text-gray-700 truncate">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(file.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No files attached</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between gap-2 p-4 border-t bg-gray-50">
          <div className="flex items-center text-xs text-gray-500">
            <Users className="h-4 w-4 mr-1" />
            <span>
              {recipients.length + cc.length + bcc.length} recipient(s)
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              disabled={
                recipients.length === 0 ||
                !subject.trim() ||
                !message.trim() ||
                sending
              }
              onClick={handleSend}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {sending ? "Sending..." : "Send Email"}
              <Send className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
