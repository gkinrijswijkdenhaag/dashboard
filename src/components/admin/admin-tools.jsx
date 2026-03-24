import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import {
  Trash2,
  AlertTriangle,
  BarChart3,
  Key,
  MessageSquare,
  Settings,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Home,
  Users,
  TrendingUp,
  Shield,
  Activity,
  Database,
  Mail,
  Send,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import adminService from "../../services/adminService";
import emailSettingsService from "../../services/emailSettingsService";
import { useNotifications } from "../../context/NotificationContext";
import { PasscodeManager } from "./passcode-manager";
import { RoleBasedPeopleManager } from "./role-based-people-manager";
import { RoleEmailManager } from "./role-email-manager";
import { Link } from "react-router-dom";

/**
 * Admin Tools component for administrative operations
 */
export function AdminTools() {
  const [activeTab, setActiveTab] = useState("messages");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [stats, setStats] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [emailSettings, setEmailSettings] = useState([]);
  const [showPasswords, setShowPasswords] = useState({});
  const [testEmail, setTestEmail] = useState("");
  const [error, setError] = useState(null);
  const { refreshMentions } = useNotifications();

  // Load stats on component mount
  useEffect(() => {
    if (activeTab === "messages") {
      fetchMessageStats();
      // Also fetch system status for the quick stats
      fetchSystemStatus();
    } else if (activeTab === "settings") {
      fetchSystemStatus();
      fetchEmailSettings();
    }
  }, [activeTab]);

  // Fetch email settings
  const fetchEmailSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await emailSettingsService.getEmailSettings();

      if (response && response.settings) {
        setEmailSettings(response.settings);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("Email settings fetch error:", error);
      setError(error.message || "Failed to fetch email settings");
      setEmailSettings([]);
    } finally {
      setLoading(false);
    }
  };

  // Update email settings
  const updateEmailSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const settingsToUpdate = emailSettings.map((setting) => ({
        setting_name: setting.setting_name,
        setting_value: setting.setting_value,
        is_encrypted: setting.is_encrypted,
      }));

      await emailSettingsService.updateEmailSettings(settingsToUpdate);

      alert("Email settings updated successfully!");
      fetchEmailSettings(); // Refresh settings
    } catch (error) {
      setError(error.message || "Failed to update email settings");
    } finally {
      setLoading(false);
    }
  };

  // Test email configuration
  const testEmailConfiguration = async () => {
    if (!testEmail) {
      setError("Please enter a test email address");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await emailSettingsService.testEmailSettings(testEmail);
      alert("Test email sent successfully! Check your inbox.");
    } catch (error) {
      setError(error.message || "Failed to send test email");
    } finally {
      setLoading(false);
    }
  };

  // Handle email setting change
  const handleEmailSettingChange = (index, value) => {
    const updatedSettings = [...emailSettings];
    updatedSettings[index].setting_value = value;
    setEmailSettings(updatedSettings);
  };

  // Toggle password visibility
  const togglePasswordVisibility = (settingName) => {
    setShowPasswords((prev) => ({
      ...prev,
      [settingName]: !prev[settingName],
    }));
  };

  // Fetch system status
  const fetchSystemStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminService.getSystemStatus();

      if (response && response.status) {
        setSystemStatus(response.status);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("System status fetch error:", error);
      setError(error.message || "Failed to fetch system status");
      // Set default status to prevent UI errors
      setSystemStatus({
        server: { status: "unknown", uptime: 0 },
        database: { status: "unknown", connected: false },
      });
    } finally {
      setLoading(false);
    }
  };

  // Tab options
  const tabs = [
    {
      id: "messages",
      label: "Messages",
      icon: MessageSquare,
      description: "Manage system messages and data",
    },
    {
      id: "passcodes",
      label: "Passcodes",
      icon: Key,
      description: "Configure access codes",
    },
    {
      id: "people",
      label: "Service Assignments",
      icon: Users,
      description: "Manage assignable people",
    },
    {
      id: "role-emails",
      label: "Role Emails",
      icon: Mail,
      description: "Configure role email addresses",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      description: "System and email configuration",
    },
  ];

  // Handle clearing all messages
  const handleClearMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call the API to clear messages
      const response = await adminService.clearAllMessages();

      // Reset confirmation dialog
      setShowConfirm(false);

      // Refresh mentions to update UI
      refreshMentions();

      // Show success message
      alert("All messages have been cleared successfully.");

      // Refresh stats
      fetchMessageStats();
    } catch (error) {
      setError(error.message || "Failed to clear messages");
    } finally {
      setLoading(false);
    }
  };

  // Fetch message statistics
  const fetchMessageStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminService.getMessageStats();

      // Make sure we have valid stats data
      if (response && response.stats) {
        setStats({
          messageCount: response.stats.messageCount || 0,
          mentionCount: response.stats.mentionCount || 0,
          topUsers: response.stats.topUsers || [],
        });
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("Stats fetch error:", error);
      setError(error.message || "Failed to fetch message statistics");
      // Set default empty stats to prevent UI errors
      setStats({
        messageCount: 0,
        mentionCount: 0,
        topUsers: [],
      });
    } finally {
      setLoading(false);
    }
  };

  // Render the Messages tab content
  const renderMessagesTab = () => {
    return (
      <div className="space-y-8">
        {/* Quick Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            {
              label: "Total Messages",
              value: stats ? stats.messageCount.toLocaleString() : "—",
              icon: MessageSquare,
              bg: "bg-indigo-500",
              light: "bg-indigo-50",
              text: "text-indigo-600",
            },
            {
              label: "Total Mentions",
              value: stats ? stats.mentionCount.toLocaleString() : "—",
              icon: AlertTriangle,
              bg: "bg-amber-500",
              light: "bg-amber-50",
              text: "text-amber-600",
            },
            {
              label: "Active Users",
              value: stats?.topUsers ? stats.topUsers.length : "—",
              icon: Users,
              bg: "bg-emerald-500",
              light: "bg-emerald-50",
              text: "text-emerald-600",
            },
            {
              label: "System Status",
              value:
                systemStatus?.server?.status === "online"
                  ? "Online"
                  : systemStatus?.server?.status
                  ? "Offline"
                  : "—",
              icon: Activity,
              bg:
                systemStatus?.server?.status === "online"
                  ? "bg-green-500"
                  : "bg-red-500",
              light:
                systemStatus?.server?.status === "online"
                  ? "bg-green-50"
                  : "bg-red-50",
              text:
                systemStatus?.server?.status === "online"
                  ? "text-green-600"
                  : "text-red-600",
            },
          ].map(({ label, value, icon: Icon, bg, light, text }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 sm:p-5 flex items-center gap-3 sm:gap-4"
            >
              <div
                className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide truncate">
                  {label}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Management Section */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Message Management</h3>
              <p className="text-xs text-slate-500">Manage and clear system message data</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-px" />
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-0.5">Data Deletion Warning</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  This permanently removes all messages, mentions and related data. This cannot be reversed.
                </p>
              </div>
            </div>

            {!showConfirm ? (
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="destructive"
                  onClick={() => setShowConfirm(true)}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl px-5 h-10 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All Messages
                </Button>
                <Button
                  variant="outline"
                  onClick={fetchMessageStats}
                  disabled={loading}
                  className="inline-flex items-center gap-2 h-10 px-5 text-sm font-medium rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh Data
                </Button>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-red-200 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-red-700" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-900 mb-1">Final Confirmation Required</p>
                    <p className="text-sm text-red-800 leading-relaxed">
                      You are about to permanently delete <strong>all messages</strong>,{" "}
                      <strong>all mentions</strong>, and <strong>all related data</strong>.
                      This action is <strong>irreversible</strong> and will affect all users.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 pt-4 border-t border-red-200">
                  <Button
                    variant="destructive"
                    onClick={handleClearMessages}
                    disabled={loading}
                    className="inline-flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded-xl px-5 h-10 shadow-sm"
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /><span>Deleting…</span></>
                    ) : (
                      <><Trash2 className="h-4 w-4" /><span>Yes, Delete Everything</span></>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirm(false)}
                    disabled={loading}
                    className="inline-flex items-center gap-2 h-10 px-5 text-sm font-medium rounded-xl border-slate-300 text-slate-600 hover:bg-white"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Message Analytics */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Analytics &amp; Statistics</h3>
                <p className="text-xs text-slate-500">Message data and user activity insights</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={fetchMessageStats}
              disabled={loading}
              className="inline-flex items-center gap-2 h-9 px-4 text-xs font-medium rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              {loading ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span>Loading…</span></>
              ) : (
                <><RefreshCw className="h-3.5 w-3.5" /><span>Refresh</span></>
              )}
            </Button>
          </div>

          {stats && (
            <div className="p-6 space-y-6">
              {/* Metric pair */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-indigo-400 uppercase tracking-wide">Total Messages</p>
                    <p className="text-3xl font-bold text-indigo-900">{stats.messageCount.toLocaleString()}</p>
                    <p className="text-xs text-indigo-500 mt-0.5">System-wide count</p>
                  </div>
                </div>

                <div className="rounded-xl bg-amber-50 border border-amber-100 p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-amber-400 uppercase tracking-wide">Total Mentions</p>
                    <p className="text-3xl font-bold text-amber-900">{stats.mentionCount.toLocaleString()}</p>
                    <p className="text-xs text-amber-500 mt-0.5">User notifications</p>
                  </div>
                </div>
              </div>

              {/* Top Users */}
              {stats.topUsers && stats.topUsers.length > 0 ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                    <h4 className="text-sm font-semibold text-slate-700">Top Active Users</h4>
                    <span className="text-xs text-slate-400">by message count</span>
                  </div>
                  <div className="space-y-2">
                    {stats.topUsers.map((user, index) => {
                      const maxCount = Math.max(...stats.topUsers.map((u) => u.message_count));
                      const percentage = (user.message_count / maxCount) * 100;
                      const rankColors = ["bg-indigo-500", "bg-indigo-400", "bg-indigo-300"];
                      const barColor = index < 3 ? rankColors[index] : "bg-slate-300";

                      return (
                        <div
                          key={index}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100"
                        >
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                              index < 3 ? "bg-indigo-500" : "bg-slate-400"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-semibold text-slate-800 truncate">
                                {user.username || "Unknown User"}
                              </span>
                              <span className="text-sm font-bold text-slate-600 ml-2 flex-shrink-0">
                                {user.message_count.toLocaleString()}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-500 ${barColor}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                    <Database className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">No user data available</p>
                  <p className="text-xs text-slate-400 mt-1">Activity statistics will appear once data is collected.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render the Passcodes tab content
  const renderPasscodesTab = () => {
    return <PasscodeManager isEmbedded={true} />;
  };

  // Render the People tab content
  const renderPeopleTab = () => {
    return <RoleBasedPeopleManager />;
  };

  // Render the Role Emails tab content
  const renderRoleEmailsTab = () => {
    return <RoleEmailManager />;
  };

  // Render the Settings tab content
  const renderSettingsTab = () => {
    // Helper function to format uptime
    const formatUptime = (seconds) => {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);

      if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    };

    return (
      <div className="space-y-4">
        {/* Email Configuration */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Email Configuration</h3>
                <p className="text-xs text-slate-400">SMTP settings for system notifications</p>
              </div>
            </div>
            <button
              onClick={fetchEmailSettings}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Refresh
            </button>
          </div>

          <div className="p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {emailSettings.length > 0 ? (
              <>
                {/* SMTP Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {emailSettings.map((setting, index) => (
                    <div key={setting.setting_name} className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide capitalize">
                        {setting.setting_name.replace("smtp_", "").replace(/_/g, " ")}
                      </label>
                      {setting.setting_name.includes("password") ? (
                        <div className="relative">
                          <input
                            type={showPasswords[setting.setting_name] ? "text" : "password"}
                            value={setting.setting_value === "••••••••" ? "" : setting.setting_value}
                            onChange={(e) => handleEmailSettingChange(index, e.target.value)}
                            placeholder={setting.setting_value === "••••••••" ? "Enter new password" : ""}
                            className="w-full px-3 py-2.5 pr-10 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(setting.setting_name)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPasswords[setting.setting_name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      ) : setting.setting_name === "smtp_secure" ? (
                        <select
                          value={setting.setting_value}
                          onChange={(e) => handleEmailSettingChange(index, e.target.value)}
                          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white"
                        >
                          <option value="true">Yes (SSL/TLS)</option>
                          <option value="false">No (Plain)</option>
                        </select>
                      ) : (
                        <input
                          type={setting.setting_name === "smtp_port" ? "number" : "text"}
                          value={setting.setting_value}
                          onChange={(e) => handleEmailSettingChange(index, e.target.value)}
                          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Save + Test row */}
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button
                    onClick={updateEmailSettings}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-60"
                  >
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Settings</>}
                  </button>

                  <div className="flex gap-2 flex-1">
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="Test email address…"
                      className="flex-1 px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    />
                    <button
                      onClick={testEmailConfiguration}
                      disabled={loading || !testEmail}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      Test
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-slate-400 text-sm">
                Click Refresh to load SMTP settings.
              </div>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Activity className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">System Health</h3>
                <p className="text-xs text-slate-400">Real-time server & database status</p>
              </div>
            </div>
            <button
              onClick={fetchSystemStatus}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Refresh
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Server */}
              {(() => {
                const online = systemStatus?.server?.status === "online";
                return (
                  <div className={`rounded-xl border p-5 flex items-center gap-4 ${online ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${online ? "bg-emerald-100" : "bg-red-100"}`}>
                      <Activity className={`w-5 h-5 ${online ? "text-emerald-600" : "text-red-600"}`} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Server</p>
                      <p className={`text-sm font-bold ${online ? "text-emerald-700" : "text-red-700"}`}>
                        {online ? "Online" : systemStatus?.server?.status === "offline" ? "Offline" : "Unknown"}
                      </p>
                      {systemStatus?.server?.uptime && (
                        <p className="text-xs text-slate-500 mt-0.5">Uptime: {formatUptime(systemStatus.server.uptime)}</p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Database */}
              {(() => {
                const connected = systemStatus?.database?.connected;
                return (
                  <div className={`rounded-xl border p-5 flex items-center gap-4 ${connected ? "border-blue-200 bg-blue-50" : "border-red-200 bg-red-50"}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${connected ? "bg-blue-100" : "bg-red-100"}`}>
                      <Database className={`w-5 h-5 ${connected ? "text-blue-600" : "text-red-600"}`} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Database</p>
                      <p className={`text-sm font-bold ${connected ? "text-blue-700" : "text-red-700"}`}>
                        {connected ? "Connected" : systemStatus?.database?.status === "disconnected" ? "Disconnected" : "Unknown"}
                      </p>
                      {systemStatus?.database?.error && (
                        <p className="text-xs text-red-500 mt-0.5">{systemStatus.database.error}</p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {systemStatus?.server?.timestamp && (
              <p className="text-xs text-slate-400 text-center mt-4">
                Last checked: {new Date(systemStatus.server.timestamp).toLocaleString()}
              </p>
            )}
          </div>
        </div>

      </div>
    );
  };

  // Get the active tab content
  const getActiveTabContent = () => {
    switch (activeTab) {
      case "messages":
        return renderMessagesTab();
      case "passcodes":
        return renderPasscodesTab();
      case "people":
        return renderPeopleTab();
      case "role-emails":
        return renderRoleEmailsTab();
      case "settings":
        return renderSettingsTab();
      default:
        return renderMessagesTab();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav bar */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-semibold text-slate-900">Admin Tools</span>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-full">
            <Shield className="w-3.5 h-3.5" />
            Administrator
          </div>
        </div>
      </div>

      {/* Page header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Admin Control Center</h1>
              <p className="text-slate-500 text-sm">System management, monitoring &amp; configuration</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="transition-all duration-200">
          {getActiveTabContent()}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-4 border-t border-slate-200">
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Restricted to authorized administrators only
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
