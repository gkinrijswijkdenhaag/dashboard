import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import {
  AlertCircle,
  Lock,
  Shield,
  Search,
  SortAsc,
  SortDesc,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Key,
  ArrowLeft,
} from "lucide-react";
import passcodeService from "../../services/passcodeService";
import authService from "../../services/authService";

// Add animation styles
const animationStyles = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.2s ease-out forwards;
}
`;

// Function to evaluate password strength
const evaluatePasswordStrength = (password) => {
  if (!password) return { score: 0, label: "None", color: "bg-gray-200" };

  // Calculate score based on different criteria
  let score = 0;

  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Character variety checks
  if (/[A-Z]/.test(password)) score += 1; // Has uppercase
  if (/[a-z]/.test(password)) score += 1; // Has lowercase
  if (/[0-9]/.test(password)) score += 1; // Has number
  if (/[^A-Za-z0-9]/.test(password)) score += 1; // Has special char

  // Map score to strength level
  const strength = {
    0: { label: "Very Weak", color: "bg-red-500" },
    1: { label: "Weak", color: "bg-red-400" },
    2: { label: "Fair", color: "bg-yellow-400" },
    3: { label: "Good", color: "bg-yellow-500" },
    4: { label: "Strong", color: "bg-green-400" },
    5: { label: "Very Strong", color: "bg-green-500" },
    6: { label: "Excellent", color: "bg-green-600" },
  };

  return { score, ...strength[Math.min(score, 6)] };
};

export function PasscodeManager({ isEmbedded = false }) {
  const navigate = useNavigate();
  const [passcodes, setPasscodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [updateStatus, setUpdateStatus] = useState({
    success: false,
    message: "",
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showPasswords, setShowPasswords] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [roleToUpdate, setRoleToUpdate] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch passcodes on component mount or when refresh is triggered
  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);

    if (user && user.role === "admin") {
      fetchPasscodes();
    } else {
      setError("You don't have permission to access this page");
      setLoading(false);
    }
  }, [refreshKey]);

  // Fetch passcodes from API
  const fetchPasscodes = async () => {
    try {
      setLoading(true);
      const data = await passcodeService.getAllPasscodes();
      setPasscodes(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError("Failed to load passcodes: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // Refresh passcode data
  const refreshPasscodes = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  // Start editing a role's passcode
  const startEditing = (role, e) => {
    // Prevent event bubbling
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Clear search when starting to edit to avoid conflicts
    setSearchTerm("");

    setEditingRole(role);
    setNewPasscode("");
    setConfirmPasscode("");
    setUpdateStatus({ success: false, message: "" });
  };

  // Cancel editing
  const cancelEditing = (e) => {
    // Prevent event bubbling
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setEditingRole(null);
    setNewPasscode("");
    setConfirmPasscode("");
    setUpdateStatus({ success: false, message: "" });
  };

  // Show confirmation dialog before updating passcode
  const confirmPasscodeUpdate = (role, e) => {
    // Prevent event bubbling
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Validate passcodes match
    if (newPasscode !== confirmPasscode) {
      setUpdateStatus({ success: false, message: "Passcodes don't match" });
      return;
    }

    // Validate passcode is not empty
    if (!newPasscode.trim()) {
      setUpdateStatus({ success: false, message: "Passcode cannot be empty" });
      return;
    }

    // Check password strength
    const strength = evaluatePasswordStrength(newPasscode);
    if (strength.score < 3) {
      setUpdateStatus({
        success: false,
        message: `Password is ${strength.label}. Consider using a stronger password.`,
        isWarning: true,
      });
      // Still allow proceeding with weak password
    }

    // Set role to update and show confirmation dialog
    setRoleToUpdate(role);
    setShowConfirmDialog(true);
  };

  // Update a role's passcode after confirmation
  const updatePasscode = async () => {
    if (!roleToUpdate) return;

    try {
      setUpdateStatus({
        success: false,
        message: "Updating passcode...",
        isLoading: true,
      });
      
      // Close the confirmation dialog immediately
      setShowConfirmDialog(false);
      
      await passcodeService.updatePasscode(roleToUpdate, newPasscode);
      
      // Show success message in the editing area
      setUpdateStatus({
        success: true,
        message: "Passcode updated successfully",
      });

      // Refresh the passcode list
      refreshPasscodes();

      // Reset form after successful update (but leave the success message visible for a moment)
      setTimeout(() => {
        setEditingRole(null);
        setRoleToUpdate(null);
        setNewPasscode("");
        setConfirmPasscode("");
        setUpdateStatus({ success: false, message: "" });
      }, 2000);
    } catch (err) {
      setUpdateStatus({
        success: false,
        message:
          "Failed to update passcode: " + (err.message || "Unknown error"),
      });
      setShowConfirmDialog(false);
    }
  };

  // If user doesn't have permission
  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
        <Shield className="h-4 w-4 flex-shrink-0" />
        You don't have permission to access this page.
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
        <p className="text-sm font-medium text-slate-500">Loading passcodes…</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        {error}
      </div>
    );
  }

  // Function to handle input focus to prevent unwanted interactions
  const handleInputFocus = (e) => {
    e.stopPropagation();
    e.target.focus();
  };

  // Filter and sort passcodes
  const filteredAndSortedPasscodes = passcodes
    .filter((passcode) =>
      passcode.role.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === "asc") {
        return a.role.localeCompare(b.role);
      } else {
        return b.role.localeCompare(a.role);
      }
    });

  // Get password strength for visual feedback
  const passwordStrength = evaluatePasswordStrength(newPasscode);

  // Go back to dashboard
  const handleGoBack = () => {
    navigate("/dashboard");
  };

  // Role display config
  const getRoleConfig = (role) => {
    const configs = {
      liturgy:   { color: "bg-blue-500",    badge: "bg-blue-50 text-blue-700 border-blue-200" },
      pastor:    { color: "bg-purple-500",   badge: "bg-purple-50 text-purple-700 border-purple-200" },
      translation:{ color: "bg-green-500",  badge: "bg-green-50 text-green-700 border-green-200" },
      beamer:    { color: "bg-orange-500",   badge: "bg-orange-50 text-orange-700 border-orange-200" },
      music:     { color: "bg-pink-500",     badge: "bg-pink-50 text-pink-700 border-pink-200" },
      treasurer: { color: "bg-emerald-500",  badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      admin:     { color: "bg-indigo-600",   badge: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    };
    return configs[role] || { color: "bg-slate-400", badge: "bg-slate-50 text-slate-700 border-slate-200" };
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />

      {!isEmbedded && (
        <div className="max-w-3xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>
        </div>
      )}

      <div className={isEmbedded ? "" : "max-w-3xl mx-auto px-4"}>
        {/* Panel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Panel header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Role Passcode Management</h3>
                <p className="text-xs text-slate-500">Update access codes for each role</p>
              </div>
            </div>
            <button
              onClick={refreshPasscodes}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>

          {/* Search / sort / visibility toolbar */}
          <div className="px-6 py-3 border-b border-slate-100 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search roles…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onFocus={handleInputFocus}
                onMouseDown={(e) => e.stopPropagation()}
                autoComplete="off"
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
            >
              {sortOrder === "asc" ? <SortAsc className="h-3.5 w-3.5" /> : <SortDesc className="h-3.5 w-3.5" />}
              {sortOrder === "asc" ? "A–Z" : "Z–A"}
            </button>
            <button
              onClick={() => setShowPasswords(!showPasswords)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
            >
              {showPasswords ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showPasswords ? "Hide" : "Show"}
            </button>
          </div>

          {lastUpdated && (
            <div className="px-6 py-2 flex items-center gap-1.5 text-xs text-slate-400 border-b border-slate-100">
              <Clock className="h-3 w-3" />
              Last refreshed: {lastUpdated.toLocaleString()}
            </div>
          )}

          {/* Role list */}
          <div className="divide-y divide-slate-100">
            {filteredAndSortedPasscodes.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                {searchTerm ? `No roles matching "${searchTerm}"` : "No roles found"}
              </div>
            ) : (
              filteredAndSortedPasscodes.map((passcode) => {
                const roleConfig = getRoleConfig(passcode.role);
                const isEditing = editingRole === passcode.role;

                return (
                  <div key={passcode.id} className={`transition-colors ${isEditing ? "bg-indigo-50/40" : "hover:bg-slate-50/60"}`}>
                    {/* Role row */}
                    <div className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${roleConfig.color} flex items-center justify-center flex-shrink-0`}>
                          {passcode.role === "admin"
                            ? <Shield className="h-4 w-4 text-white" />
                            : <Key className="h-4 w-4 text-white" />}
                        </div>
                        <div>
                          <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${roleConfig.badge}`}>
                            {passcode.role}
                          </span>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            Updated {new Date(passcode.updated_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                          </p>
                        </div>
                      </div>

                      {isEditing ? (
                        <button
                          onClick={(e) => cancelEditing(e)}
                          className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
                        >
                          Cancel
                        </button>
                      ) : (
                        <button
                          onClick={(e) => startEditing(passcode.role, e)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          Change
                        </button>
                      )}
                    </div>

                    {/* Inline edit form */}
                    {isEditing && (
                      <div className="px-6 pb-5 space-y-4">
                        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                          {/* New passcode */}
                          <div className="space-y-1.5">
                            <label
                              htmlFor={`new-passcode-${passcode.role}`}
                              className="text-xs font-medium text-slate-600"
                            >
                              New Passcode
                            </label>
                            <div className="relative">
                              <input
                                id={`new-passcode-${passcode.role}`}
                                type={showPasswords ? "text" : "password"}
                                value={newPasscode}
                                onChange={(e) => setNewPasscode(e.target.value)}
                                placeholder="Enter new passcode"
                                className="w-full pl-3 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                autoComplete="new-password"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPasswords(!showPasswords); }}
                              >
                                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>

                            {/* Strength meter */}
                            {newPasscode && (
                              <div className="mt-1.5 space-y-1">
                                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                                    style={{ width: `${Math.min(100, (passwordStrength.score / 6) * 100)}%` }}
                                  />
                                </div>
                                <p className="text-xs text-slate-400">Strength: {passwordStrength.label}</p>
                              </div>
                            )}
                          </div>

                          {/* Confirm passcode */}
                          <div className="space-y-1.5">
                            <label
                              htmlFor={`confirm-passcode-${passcode.role}`}
                              className="text-xs font-medium text-slate-600"
                            >
                              Confirm Passcode
                            </label>
                            <div className="relative">
                              <input
                                id={`confirm-passcode-${passcode.role}`}
                                type={showPasswords ? "text" : "password"}
                                value={confirmPasscode}
                                onChange={(e) => setConfirmPasscode(e.target.value)}
                                placeholder="Confirm new passcode"
                                className={`w-full pl-3 pr-10 py-2.5 text-sm border rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition ${
                                  confirmPasscode && newPasscode !== confirmPasscode
                                    ? "border-red-300"
                                    : "border-slate-200"
                                }`}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                autoComplete="new-password"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPasswords(!showPasswords); }}
                              >
                                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            {confirmPasscode && newPasscode !== confirmPasscode && (
                              <p className="text-xs text-red-500">Passcodes don't match</p>
                            )}
                          </div>

                          {/* Status message */}
                          {updateStatus.message && (
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                              updateStatus.success
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : updateStatus.isWarning
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}>
                              {updateStatus.success
                                ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                                : updateStatus.isWarning
                                ? <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                                : updateStatus.isLoading
                                ? <RefreshCw className="h-3.5 w-3.5 flex-shrink-0 animate-spin" />
                                : <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />}
                              {updateStatus.message}
                            </div>
                          )}

                          <div className="flex justify-end pt-1">
                            <Button
                              onClick={(e) => confirmPasscodeUpdate(passcode.role, e)}
                              disabled={!newPasscode || !confirmPasscode || newPasscode !== confirmPasscode}
                              className="inline-flex items-center gap-2 h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm disabled:opacity-50 transition-colors"
                            >
                              Update Passcode
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              {filteredAndSortedPasscodes.length} {filteredAndSortedPasscodes.length === 1 ? "role" : "roles"}
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>

        {/* Confirmation modal */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-sm p-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-4 w-4 text-indigo-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">Confirm Passcode Update</h3>
              </div>
              <p className="text-sm text-slate-600 mb-6">
                Update the passcode for role{" "}
                <span className="font-semibold text-indigo-600 capitalize">{roleToUpdate}</span>?
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowConfirmDialog(false)}
                  variant="outline"
                  className="flex-1 h-9 text-sm font-medium rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={updatePasscode}
                  className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm"
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
