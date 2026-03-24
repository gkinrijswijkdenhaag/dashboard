import { useState } from "react";
import { Button } from "../ui/button";
import { Home, Sparkles, CalendarDays } from "lucide-react";
import { NotificationCenter, NotificationPanel } from "../notifications/notification-center";

export function Header({
  title = "Liturgy Workflow",
  subtitle = "Manage document workflow for weekly services",
  user,
  onLogout,
  showNotifications = true,
  showUserInfo = true,
  showLogout = true,
  className = "",
  variant = "default", // "default", "primary", "gradient"
}) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Color logic
  const textColors =
    variant === "primary" || variant === "gradient"
      ? {
          title: "text-white",
          subtitle: "text-white/90",
          userText: "text-white",
          userRole: "text-white/70",
        }
      : {
          title: "text-gray-900",
          subtitle: "text-gray-600",
          userText: "text-gray-900",
          userRole: "text-gray-500",
        };

  // Header background
  const headerBg =
    variant === "primary"
      ? "bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white shadow-xl border-b border-white/10 backdrop-blur-sm"
      : variant === "gradient"
      ? "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl backdrop-blur-sm"
      : "bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm";

  return (
    <header
      className={`${headerBg} px-4 py-4 md:py-6 lg:px-6 ${className} relative z-50`}
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        {variant !== "default" ? (
          <>
            {/* Gradient Orbs for colored variants */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
          </>
        ) : (
          <>
            {/* Subtle pattern for default variant */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-50/30 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-50/20 rounded-full blur-2xl"></div>
          </>
        )}
      </div>

      {/* Mobile Layout */}
      <div className="flex flex-col gap-3 md:hidden relative">
        {/* Top row: Title and actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Icon next to title */}
            <div
              className={`w-8 h-8 rounded-lg ${
                variant !== "default"
                  ? "bg-white/20 backdrop-blur-sm border border-white/30"
                  : "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md"
              } flex items-center justify-center`}
            >
              <Home
                className={`w-4 h-4 ${
                  variant !== "default" ? "text-white" : "text-white"
                }`}
              />
            </div>
            <div>
              <h1
                className={`text-lg font-bold tracking-tight ${textColors.title} flex items-center gap-1`}
              >
                {title}
              </h1>
              {subtitle && (
                <p className={`text-xs mt-0.5 ${textColors.subtitle}`}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Notification and User menu buttons side by side */}
          <div className="flex items-center gap-2">
            {showNotifications && (
              <div className="relative z-[100] transition-transform hover:scale-105 duration-200">
                <NotificationCenter />
              </div>
            )}

            {showUserInfo && (
              <div
                className="relative flex items-center justify-center bg-white/95 backdrop-blur-sm p-2 rounded-full border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-semibold text-sm shadow-sm">
                  {user?.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 transition-transform duration-300 text-gray-600 ${
                    showMobileMenu ? "rotate-180" : ""
                  }`}
                >
                  <path d="M6 9l6 6 6-6"></path>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Mobile user menu dropdown */}
        {showMobileMenu && (
          <div className="mt-2 rounded-xl border border-gray-200/80 bg-white/95 backdrop-blur-sm shadow-xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200 relative z-[9999]">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-semibold shadow-md">
                {user?.username?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <div className="font-semibold text-sm text-gray-900">
                  {user?.username}
                </div>
                <div className="text-xs text-gray-500">
                  {typeof user?.role === "string"
                    ? user.role
                    : user?.role?.name || "Role"}
                </div>
              </div>
            </div>

            {/* Schedule option for mobile view */}
            <Button
              variant="outline"
              className="w-full text-xs text-gray-700 font-medium border-gray-200 hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center gap-2 transition-all duration-200"
              onClick={() => {
                setShowMobileMenu(false);
                window.location.href = "/schedule";
              }}
            >
              <CalendarDays width={14} height={14} />
              Schedule
            </Button>

            {/* Profile Settings option for mobile view */}
            <Button
              variant="outline"
              className="w-full text-xs text-gray-700 font-medium border-gray-200 hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center gap-2 transition-all duration-200"
              onClick={() => {
                setShowMobileMenu(false);
                window.location.href = "/profile";
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Profile Settings
            </Button>

            {/* Admin Tools option for mobile view */}
            {user && user.role === "admin" && (
              <Button
                variant="outline"
                className="w-full text-xs text-blue-600 font-medium border-blue-200 hover:bg-blue-50 hover:border-blue-300 flex items-center justify-center gap-2 transition-all duration-200"
                onClick={() => {
                  setShowMobileMenu(false);
                  window.location.href = "/admin-tools";
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
                Admin Tools
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full text-xs font-medium text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
              onClick={onLogout}
            >
              Logout
            </Button>
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between gap-4 relative">
        {/* Left: Title and subtitle with icon */}
        <div className="flex items-center gap-3">
          {/* Decorative Icon */}
          <div
            className={`w-12 h-12 rounded-xl ${
              variant !== "default"
                ? "bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg"
                : "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg"
            } flex items-center justify-center relative group`}
          >
            <Home
              className={`w-6 h-6 ${
                variant !== "default" ? "text-white" : "text-white"
              } transition-transform group-hover:scale-110 duration-200`}
            />
            {/* Subtle glow effect */}
            <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1
                className={`text-2xl font-bold tracking-tight ${textColors.title}`}
              >
                {title}
              </h1>
              {/* Optional badge/accent */}
              {variant !== "default" && (
                <div className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            {subtitle && (
              <p
                className={`text-sm mt-1 ${textColors.subtitle} flex items-center gap-1.5`}
              >
                <span
                  className={`w-1 h-1 rounded-full ${
                    variant !== "default" ? "bg-white/60" : "bg-gray-400"
                  }`}
                ></span>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {/* Vertical separator */}
        <div
          className={`h-12 w-px ${
            variant !== "default" ? "bg-white/20" : "bg-gray-200"
          }`}
        ></div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {showNotifications && (
            <div className="relative z-[100] transition-transform hover:scale-105 duration-200">
              <NotificationCenter />
            </div>
          )}

          {/* Combined User Info & Logout */}
          {showUserInfo && user && (
            <div className="relative z-[100]">
              <div
                className="flex items-center gap-3 bg-white/95 backdrop-blur-sm px-4 py-2.5 rounded-full border border-gray-200/80 cursor-pointer hover:shadow-lg hover:border-gray-300/80 hover:bg-white transition-all duration-200 group"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-semibold shadow-md ring-2 ring-white/50 group-hover:ring-white/80 transition-all duration-200">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-gray-900">
                    {user.username}
                  </span>
                  <span className="text-xs text-gray-500 -mt-0.5">
                    {typeof user.role === "string"
                      ? user.role
                      : user.role?.name || "Role"}
                  </span>
                </div>

                {/* Add a dropdown arrow */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`ml-1 transition-transform duration-300 text-gray-500 ${
                    showUserDropdown ? "rotate-180" : ""
                  }`}
                >
                  <path d="M6 9l6 6 6-6"></path>
                </svg>
              </div>

              {/* User dropdown menu */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200/80 py-2 z-[9999] animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="font-semibold text-sm text-gray-900">
                      {user.username}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {typeof user.role === "string"
                        ? user.role
                        : user.role?.name || "Role"}
                    </div>
                  </div>
                  {/* Schedule */}
                  <div
                    className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors duration-150 mx-2 rounded-lg mt-1"
                    onClick={() => {
                      setShowUserDropdown(false);
                      window.location.href = "/schedule";
                    }}
                  >
                    <CalendarDays width={16} height={16} className="text-gray-500" />
                    Schedule
                  </div>

                  {/* Profile Settings */}
                  <div
                    className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors duration-150 mx-2 rounded-lg"
                    onClick={() => {
                      setShowUserDropdown(false);
                      window.location.href = "/profile";
                    }}
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
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Profile Settings
                  </div>

                  {/* Admin Tools - Only visible to admins */}
                  {user && user.role === "admin" && (
                    <div
                      className="px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 cursor-pointer flex items-center gap-3 transition-colors duration-150 mx-2 rounded-lg"
                      onClick={() => {
                        setShowUserDropdown(false);
                        window.location.href = "/admin-tools";
                      }}
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
                      >
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                      </svg>
                      Admin Tools
                    </div>
                  )}

                  {showLogout && (
                    <div
                      className="px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer flex items-center gap-3 transition-colors duration-150 mx-2 rounded-lg mb-1 border-t border-gray-100 mt-1 pt-3"
                      onClick={onLogout}
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
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      Logout
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
