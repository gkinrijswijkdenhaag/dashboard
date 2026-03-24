import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  FileText,
  Users,
  Music,
  Video,
  BookOpen,
  LogIn,
  DollarSign,
  AlertCircle,
  Shield,
  Eye,
  EyeOff,
  Check,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";

const roles = [
  {
    id: "liturgy",
    name: "Liturgy Maker",
    icon: FileText,
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    description: "Create and manage liturgy documents",
  },
  {
    id: "pastor",
    name: "Pastor",
    icon: BookOpen,
    color: "bg-purple-500",
    textColor: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    description: "Review and approve liturgy content",
  },
  {
    id: "translation",
    name: "Translator",
    icon: Users,
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    description: "Translate liturgy content",
  },
  {
    id: "beamer",
    name: "Beamer Team",
    icon: Video,
    color: "bg-orange-500",
    textColor: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    description: "Create presentation slides",
  },
  {
    id: "music",
    name: "Musicians",
    icon: Music,
    color: "bg-pink-500",
    textColor: "text-pink-700",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    description: "Prepare music arrangements",
  },
  {
    id: "treasurer",
    name: "Treasurer",
    icon: DollarSign,
    color: "bg-emerald-500",
    textColor: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    description: "Manage financial records and budgets",
  },
  {
    id: "admin",
    name: "Administrator",
    icon: Shield,
    color: "bg-indigo-500",
    textColor: "text-indigo-700",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    description: "System administration and security",
  },
];

export function LoginPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState(false);
  const [touched, setTouched] = useState({
    username: false,
    passcode: false,
    role: false,
  });

  // Check if user is already logged in
  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate("/");
    }

    // Check if session expired
    const sessionExpired = localStorage.getItem("sessionExpired");
    if (sessionExpired === "true") {
      setSessionExpiredMessage(true);
      // Clear the flag
      localStorage.removeItem("sessionExpired");
      // Auto-hide message after 8 seconds
      setTimeout(() => {
        setSessionExpiredMessage(false);
      }, 8000);
    }

    // Load saved credentials if remember me was checked
    const savedCredentials = localStorage.getItem("gkin-remember-me");
    if (savedCredentials) {
      try {
        const {
          username: savedUsername,
          roleId,
          passcode: savedPasscode,
          rememberMe: wasRemembered,
        } = JSON.parse(savedCredentials);
        if (wasRemembered) {
          setUsername(savedUsername);
          setPasscode(savedPasscode || "");
          setRememberMe(true);
          // Find and set the saved role
          const savedRole = roles.find((role) => role.id === roleId);
          if (savedRole) {
            setSelectedRole(savedRole);
          }
        }
      } catch (error) {
        console.error("Error loading saved credentials:", error);
        localStorage.removeItem("gkin-remember-me");
      }
    }
  }, [navigate]);

  const handleLogin = async () => {
    if (!selectedRole || !username.trim() || !passcode.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Call authentication service to login
      await authService.login(username, selectedRole.id, passcode);

      // Save credentials if remember me is checked
      if (rememberMe) {
        const credentialsToSave = {
          username: username.trim(),
          roleId: selectedRole.id,
          passcode: passcode.trim(),
          rememberMe: true,
        };
        localStorage.setItem(
          "gkin-remember-me",
          JSON.stringify(credentialsToSave)
        );
      } else {
        // Remove saved credentials if remember me is unchecked
        localStorage.removeItem("gkin-remember-me");
      }

      navigate("/");
    } catch (error) {
      setError(error.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (
      e.key === "Enter" &&
      selectedRole &&
      username.trim() &&
      passcode.trim()
    ) {
      handleLogin();
    }
  };

  const getFieldError = (field) => {
    if (!touched[field]) return null;

    if (field === "username" && !username.trim()) {
      return "Name is required";
    }
    if (field === "passcode" && !passcode.trim()) {
      return "Passcode is required";
    }
    if (field === "role" && !selectedRole) {
      return "Please select a role";
    }
    return null;
  };

  const isFormValid = selectedRole && username.trim() && passcode.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand Header */}
        <div className="flex justify-center mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-white p-3.5 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3 hover:shadow-xl transition-shadow duration-300">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-2.5 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800">GKIN RWDH</h1>
          </div>
        </div>

        <Card className="border-0 shadow-xl overflow-hidden bg-white animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Card Header with Decorative Element */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-2"></div>
            <CardHeader className="pt-8 pb-6 text-center bg-white">
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-gray-600 text-base">
                Horas! Sign in to the Dienst Dashboard
              </CardDescription>
            </CardHeader>
          </div>

          {/* Session Expired Message */}
          {sessionExpiredMessage && (
            <div className="mx-6 mt-4 bg-amber-50 border-l-4 border-amber-500 text-amber-800 px-4 py-3 rounded-lg flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Session Expired</p>
                <p className="text-sm mt-0.5">
                  Your session has expired. Please log in again to continue.
                </p>
              </div>
              <button
                onClick={() => setSessionExpiredMessage(false)}
                className="text-amber-600 hover:text-amber-800 transition-colors"
                aria-label="Close message"
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
          )}

          <CardContent className="pt-6 pb-6 space-y-5 bg-white px-6">
            {/* Username Input with Modern Styling */}
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-sm font-semibold text-gray-700 flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-500"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Your Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  className={`w-full pl-4 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-gray-800 transition-all duration-200 ${
                    getFieldError("username")
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
                  }`}
                  placeholder="Enter your name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={() => setTouched({ ...touched, username: true })}
                  onKeyPress={handleKeyPress}
                  autoComplete="name"
                />
                {getFieldError("username") && (
                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {getFieldError("username")}
                  </p>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">Error</p>
                  <p className="text-sm mt-0.5">{error}</p>
                </div>
                <button
                  onClick={() => setError("")}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  aria-label="Close error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Passcode Input */}
            <div className="space-y-2">
              <label
                htmlFor="passcode"
                className="text-sm font-semibold text-gray-700 flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-500"
                >
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="11"
                    rx="2"
                    ry="2"
                  ></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Passcode
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="passcode"
                  className={`w-full pl-4 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 text-gray-800 transition-all duration-200 ${
                    getFieldError("passcode")
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
                  }`}
                  placeholder="Enter your role passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  onBlur={() => setTouched({ ...touched, passcode: true })}
                  onKeyPress={handleKeyPress}
                  autoComplete="current-password"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 hover:bg-gray-100 rounded-md transition-all duration-200 hover:scale-110"
                    title={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-500" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                </div>
                {getFieldError("passcode") && (
                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {getFieldError("passcode")}
                  </p>
                )}
              </div>
            </div>

            {/* Role Selection with Enhanced Visual Design */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-500"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                Select Your Role
              </label>
              <div className="grid grid-cols-1 gap-3">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className={`flex items-center p-3 rounded-xl cursor-pointer border-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                      selectedRole?.id === role.id
                        ? `${role.borderColor} ${role.bgColor} shadow-md scale-[1.02]`
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedRole(role)}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedRole(role);
                      }
                    }}
                    aria-label={`Select ${role.name} role`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl ${role.color} flex items-center justify-center shadow-sm`}
                    >
                      <role.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div
                        className={`font-semibold text-sm truncate ${
                          selectedRole?.id === role.id
                            ? role.textColor
                            : "text-gray-800"
                        }`}
                      >
                        {role.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {role.description}
                      </div>
                    </div>
                    {selectedRole?.id === role.id && (
                      <div className="ml-auto">
                        <div
                          className={`w-3 h-3 rounded-full ${role.color}`}
                        ></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center space-x-3 pt-2">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only"
                />
                <label
                  htmlFor="remember-me"
                  className="relative flex items-center cursor-pointer group"
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
                      rememberMe
                        ? "bg-blue-600 border-blue-600 scale-110"
                        : "bg-white border-gray-300 hover:border-blue-400 group-hover:scale-105"
                    }`}
                  >
                    {rememberMe && (
                      <Check className="w-3.5 h-3.5 text-white animate-in zoom-in duration-200" />
                    )}
                  </div>
                </label>
              </div>
              <div className="flex-1">
                <label
                  htmlFor="remember-me"
                  className="text-sm font-medium text-gray-700 cursor-pointer leading-5 hover:text-blue-600 transition-colors duration-200"
                >
                  Remember my details for next time
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Saves your name, role, and passcode for convenience
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end pt-6 pb-8 bg-white px-6">
            <Button
              onClick={handleLogin}
              disabled={
                !selectedRole ||
                !username.trim() ||
                !passcode.trim() ||
                isLoading
              }
              className={`w-full h-12 flex items-center justify-center gap-2 ${
                selectedRole
                  ? selectedRole.id === "liturgy"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : selectedRole.id === "pastor"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : selectedRole.id === "translation"
                    ? "bg-green-600 hover:bg-green-700"
                    : selectedRole.id === "beamer"
                    ? "bg-orange-600 hover:bg-orange-700"
                    : selectedRole.id === "music"
                    ? "bg-pink-600 hover:bg-pink-700"
                    : selectedRole.id === "admin"
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-gray-600 hover:bg-gray-700"
              } text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} GKIN RWDH. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
