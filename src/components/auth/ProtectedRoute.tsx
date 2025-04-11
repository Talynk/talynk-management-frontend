import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const location = useLocation();
  const token = localStorage.getItem("accessToken");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  
  // Check if user is authenticated
  if (!token) {
    // Redirect to login page with the return url
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If allowedRoles is provided, check if user has the required role
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user role
    if (user.role === 'admin') {
      return <Navigate to="/admin/overview" replace />;
    } else if (user.role === 'approver') {
      return <Navigate to="/home" replace />;
    } else if (user.role === 'user') {
      return <Navigate to="/user-portal" replace />;
    } else {
      // Default redirect to landing page if role is unknown
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
