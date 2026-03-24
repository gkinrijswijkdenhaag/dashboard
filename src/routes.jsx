import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import Dashboard from "./components/pages/dashboard";
import { LoginPage } from "./components/pages/login-page";
import { EmailComposerPage } from "./components/pages/email-composer-page";
import { ProtectedRoute } from "./components/layout/protected-route";
import { AssignmentsProvider } from "./components/assignments/context/AssignmentsContext";
import { AdminTools } from "./components/admin/admin-tools";
import { LyricsTranslationPage } from "./components/translation/lyrics-translation-page";
import { TranslationProvider } from "./context/TranslationContext";
import { AllUpdatesPage } from "./components/pages/all-updates-page";
import { ProfileSettings } from "./components/pages/profile-settings";
import { SchedulePage } from "./components/pages/schedule-page";
import { PublicSchedulePage } from "./components/pages/public-schedule-page";
import { PublicSundayPage } from "./components/pages/public-sunday-page";

// Routes configuration
export const router = createBrowserRouter([
  // ── Public routes (no auth required) ──────────────────────────────────────
  {
    path: "/public/schedule",
    element: <PublicSchedulePage />,
  },
  {
    path: "/public/schedule/:date",
    element: <PublicSundayPage />,
  },
  // ── Authenticated app ─────────────────────────────────────────────────────
  {
    path: "/",
    element: (
      <AssignmentsProvider>
        <TranslationProvider>
          <App />
        </TranslationProvider>
      </AssignmentsProvider>
    ),
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        ),
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "login",
        element: <LoginPage />,
      },

      {
        path: "compose-email",
        element: (
          <ProtectedRoute>
            <EmailComposerPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "assignments",
        element: (
          <ProtectedRoute>
            <Navigate to="/schedule" replace />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin-tools",
        element: (
          <ProtectedRoute requireAdmin={true}>
            <AdminTools />
          </ProtectedRoute>
        ),
      },
      {
        path: "translation/lyrics",
        element: (
          <ProtectedRoute>
            <LyricsTranslationPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "all-updates",
        element: (
          <ProtectedRoute>
            <AllUpdatesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <ProfileSettings />
          </ProtectedRoute>
        ),
      },
      {
        path: "schedule",
        element: (
          <ProtectedRoute>
            <SchedulePage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
