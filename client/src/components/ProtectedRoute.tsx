import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  allowPasswordChangeGated?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  allowPasswordChangeGated = false,
}) => {
  const { isLoading, isAuthenticated, mustChangePassword, role } = useAuth();

  if (isLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center py-5"
        style={{ minHeight: "50vh" }}
      >
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (mustChangePassword && !allowPasswordChangeGated) {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to default role landing page if user lacks permission
    const fallbackDestination = role === "REQUESTER" ? "/tickets" : "/queue";
    return <Navigate to={fallbackDestination} replace />;
  }

  return <>{children}</>;
};
