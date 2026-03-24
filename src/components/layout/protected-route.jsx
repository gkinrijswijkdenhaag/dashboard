import { Navigate } from "react-router-dom";
import authService from "../../services/authService";

export const ProtectedRoute = ({ children, requireAdmin = false }) => {
  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if admin role is required
  if (requireAdmin) {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      // User is not an admin, redirect to dashboard
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return children;
};
