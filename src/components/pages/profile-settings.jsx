import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  User,
  Mail,
  Save,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Calendar,
  Shield,
  Lock,
  Pencil,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import api from "../../services/api";
import { getMyRoleEmail } from "../../services/roleEmailsService";

export function ProfileSettings() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState({
    username: "",
    email: "",
    role: "",
    id: null,
    created_at: null,
    last_active: null,
  });
  const [roleEmail, setRoleEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [formData, setFormData] = useState({
    username: "",
  });

  // Get current user from auth service
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUserProfile(currentUser);
      setFormData({
        username: currentUser.username || "",
      });
    }
    fetchProfile();
    fetchRoleEmail();
  }, []);

  // Fetch user profile from API
  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const profile = await api.get("/profile");
      setUserProfile(profile);
      setFormData({
        username: profile.username || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      setMessage({
        type: "error",
        text: "Failed to load profile information",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch role email from API
  const fetchRoleEmail = async () => {
    try {
      const response = await getMyRoleEmail();
      setRoleEmail(response.email || "");
    } catch (error) {
      console.error("Error fetching role email:", error);
      // Don't show error message, just leave email empty
    }
  };

  // Handle form submission
  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.username.trim()) {
      setMessage({
        type: "error",
        text: "Username is required",
      });
      return;
    }

    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await api.put("/profile", formData);

      // Update local user data
      const updatedUser = { ...userProfile, ...response.user };
      setUserProfile(updatedUser);

      // Update localStorage to maintain session
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        const updatedUserData = { ...currentUser, ...response.user };
        localStorage.setItem("currentUser", JSON.stringify(updatedUserData));
      }

      setMessage({
        type: "success",
        text: "Profile updated successfully!",
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to update profile",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear messages when user starts typing
    if (message.text) {
      setMessage({ type: "", text: "" });
    }
  };

  // Role display configuration
  const getRoleConfig = (role) => {
    const configs = {
      liturgy: {
        name: "Liturgy Maker",
        color: "bg-blue-500",
        textColor: "text-blue-700",
      },
      pastor: {
        name: "Pastor",
        color: "bg-purple-500",
        textColor: "text-purple-700",
      },
      translation: {
        name: "Translator",
        color: "bg-green-500",
        textColor: "text-green-700",
      },
      beamer: {
        name: "Beamer Team",
        color: "bg-orange-500",
        textColor: "text-orange-700",
      },
      music: {
        name: "Musicians",
        color: "bg-pink-500",
        textColor: "text-pink-700",
      },
      treasurer: {
        name: "Treasurer",
        color: "bg-emerald-500",
        textColor: "text-emerald-700",
      },
      admin: {
        name: "Administrator",
        color: "bg-indigo-500",
        textColor: "text-indigo-700",
      },
    };
    return (
      configs[role] || {
        name: role,
        color: "bg-gray-500",
        textColor: "text-gray-700",
      }
    );
  };

  const roleConfig = getRoleConfig(userProfile.role);

  const avatarInitials = userProfile.username
    ? userProfile.username.slice(0, 2).toUpperCase()
    : "??";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-gray-500">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60">
      {/* Top nav bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-900">
            Profile Settings
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {/* Profile header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-xl ${roleConfig.color} flex items-center justify-center text-white text-lg font-bold flex-shrink-0 select-none`}
          >
            {avatarInitials}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">
              {userProfile.username || "—"}
            </h1>
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${roleConfig.color} text-white`}
            >
              <Shield className="w-3 h-3" />
              {roleConfig.name}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            {
              label: "Role",
              value: roleConfig.name,
              icon: Shield,
              iconBg: roleConfig.color,
            },
            {
              label: "Member Since",
              value: userProfile.created_at
                ? new Date(userProfile.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "—",
              icon: Calendar,
              iconBg: "bg-emerald-500",
            },
            {
              label: "Last Active",
              value: userProfile.last_active
                ? new Date(userProfile.last_active).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "—",
              icon: User,
              iconBg: "bg-blue-500",
              className: "col-span-2 sm:col-span-1",
            },
          ].map(({ label, value, icon: Icon, iconBg, className = "" }) => (
            <div
              key={label}
              className={`bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 ${className}`}
            >
              <div
                className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  {label}
                </p>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Edit form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Pencil className="w-4 h-4 text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900">
              Personal Information
            </h2>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Username */}
            <div className="space-y-1.5">
              <label
                htmlFor="username"
                className="text-sm font-medium text-gray-700"
              >
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="username"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Role email (read-only) */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="role-email"
                  className="text-sm font-medium text-gray-700"
                >
                  Role Email
                </label>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  <Lock className="w-2.5 h-2.5" />
                  Admin managed
                </span>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <Mail className="w-4 h-4 text-gray-300" />
                </div>
                <input
                  type="email"
                  id="role-email"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-100 rounded-xl bg-gray-50 text-gray-400 cursor-not-allowed"
                  placeholder="No email set for this role"
                  value={roleEmail}
                  disabled
                  readOnly
                />
              </div>
              <p className="text-xs text-gray-400 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
                {userProfile.role === "pastor"
                  ? `Pastor email is determined by the "Voorganger" assigned in Service Assignments.`
                  : `All ${roleConfig.name} users share this email. Contact an admin to change it.`}
              </p>
            </div>

            {/* Feedback message */}
            {message.text && (
              <div
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium ${
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
                {message.text}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 h-10 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({ username: userProfile.username || "" });
                  setMessage({ type: "", text: "" });
                }}
                className="h-10 px-5 text-sm font-medium rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Reset
              </Button>
            </div>
          </form>
        </div>

        {/* About role email note */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">
              About Role Email
            </p>
            <p className="text-sm text-blue-700 leading-relaxed">
              {userProfile.role === "pastor"
                ? `Pastor emails are managed through Service Assignments. Notifications are sent to whichever pastor is assigned for each specific service date.`
                : `Your role's email is managed by the administrator. All ${roleConfig.name} users share the same address for notifications and system updates.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
