import { useState, useEffect } from "react";
import {
  Mail,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Shield,
  FileText,
  Users,
  Video,
  Music,
  DollarSign,
  RefreshCw,
  X,
} from "lucide-react";
import {
  getAllRoleEmails,
  updateMultipleRoleEmails,
} from "../../services/roleEmailsService";

const roleConfigs = {
  liturgy: {
    name: "Liturgy Maker",
    icon: FileText,
    color: "bg-blue-500",
    textColor: "text-blue-700",
  },
  translation: {
    name: "Translator",
    icon: Users,
    color: "bg-green-500",
    textColor: "text-green-700",
  },
  beamer: {
    name: "Beamer Team",
    icon: Video,
    color: "bg-orange-500",
    textColor: "text-orange-700",
  },
  music: {
    name: "Musicians",
    icon: Music,
    color: "bg-pink-500",
    textColor: "text-pink-700",
  },
  treasurer: {
    name: "Treasurer",
    icon: DollarSign,
    color: "bg-emerald-500",
    textColor: "text-emerald-700",
  },
  admin: {
    name: "Administrator",
    icon: Shield,
    color: "bg-indigo-500",
    textColor: "text-indigo-700",
  },
};

export const RoleEmailManager = () => {
  const [roleEmails, setRoleEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [editedEmails, setEditedEmails] = useState({});

  useEffect(() => {
    fetchRoleEmails();
  }, []);

  const fetchRoleEmails = async () => {
    try {
      setIsLoading(true);
      const data = await getAllRoleEmails();
      setRoleEmails(data);

      // Initialize edited emails state
      const emails = {};
      data.forEach((item) => {
        emails[item.role] = item.email || "";
      });
      setEditedEmails(emails);
    } catch (error) {
      console.error("Error fetching role emails:", error);
      setMessage({
        type: "error",
        text: "Failed to load role emails",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (role, email) => {
    setEditedEmails((prev) => ({
      ...prev,
      [role]: email,
    }));

    // Clear messages when user starts typing
    if (message.text) {
      setMessage({ type: "", text: "" });
    }
  };

  const handleSave = async () => {
    // Validate all emails
    for (const [role, email] of Object.entries(editedEmails)) {
      if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setMessage({
          type: "error",
          text: `Invalid email format for ${roleConfigs[role]?.name || role}`,
        });
        return;
      }
    }

    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      // Prepare data for batch update
      const roleEmailsData = Object.entries(editedEmails).map(
        ([role, email]) => ({
          role,
          email: email || "",
        })
      );

      await updateMultipleRoleEmails(roleEmailsData);

      setMessage({
        type: "success",
        text: "Role emails updated successfully!",
      });

      // Refresh data
      await fetchRoleEmails();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);
    } catch (error) {
      console.error("Error updating role emails:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to update role emails",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const emails = {};
    roleEmails.forEach((item) => {
      emails[item.role] = item.email || "";
    });
    setEditedEmails(emails);
    setMessage({ type: "", text: "" });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
        <span className="text-sm font-medium text-slate-500">Loading role emails…</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      {/* Panel header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Mail className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Role Email Addresses</h3>
            <p className="text-xs text-slate-400">Shared email per role for notifications</p>
          </div>
        </div>
        <button
          onClick={fetchRoleEmails}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 rounded-lg px-3 py-1.5 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {/* Feedback strip */}
      {message.text && (
        <div
          className={`flex items-center gap-2.5 mx-6 mt-4 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="flex-1">{message.text}</span>
          <button onClick={() => setMessage({ type: "", text: "" })} className="opacity-60 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Role email rows */}
      <div className="divide-y divide-slate-100">
        {Object.entries(roleConfigs).map(([roleId, config]) => {
          const Icon = config.icon;
          const hasValue = !!(editedEmails[roleId]?.trim());
          return (
            <div key={roleId} className="px-6 py-4 flex items-center gap-4">
              {/* Role icon + name */}
              <div className="flex items-center gap-3 w-44 flex-shrink-0">
                <div className={`w-8 h-8 rounded-lg ${config.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-slate-700 truncate">{config.name}</span>
              </div>

              {/* Email input */}
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <Mail className="w-4 h-4 text-slate-300" />
                </div>
                <input
                  type="email"
                  id={`email-${roleId}`}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  placeholder={`${config.name} email address…`}
                  value={editedEmails[roleId] || ""}
                  onChange={(e) => handleEmailChange(roleId, e.target.value)}
                />
              </div>

              {/* Status dot */}
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${hasValue ? "bg-emerald-400" : "bg-slate-200"}`} title={hasValue ? "Email set" : "No email"} />
            </div>
          );
        })}
      </div>

      {/* Info callout */}
      <div className="mx-6 my-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">
          Each role shares one email address for all its users. <strong>Pastor (Voorganger)</strong> emails are managed through Service Assignments — a different email per service date.
        </p>
      </div>

      {/* Action footer */}
      <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-100">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-60"
        >
          {isSaving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
          ) : (
            <><Save className="w-4 h-4" /> Save All Changes</>
          )}
        </button>
        <button
          onClick={handleReset}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-60"
        >
          Reset
        </button>
      </div>
    </div>
  );
};
