import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAuthData } from "../src/utils/auth-utils.js"; // Import utility functions

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [loading, setLoading] = useState(true);  // For loading state

  useEffect(() => {
    // Get auth data from cookies and session storage
    const { token, userInfo } = getAuthData();

    console.log("ProtectedRoute - Token:", token);  // Debugging
    console.log("ProtectedRoute - UserInfo:", userInfo);  // Debugging

    // Check if user is authenticated and authorized
    if (token && userInfo) {
      // Check if user role is in allowed roles
      const isAllowed = allowedRoles.length === 0 || allowedRoles.includes(userInfo.role);
      setIsAuthorized(isAllowed);
    } else {
      setIsAuthorized(false);
    }

    setLoading(false);  // Stop loading after checking the authorization status
  }, [allowedRoles]);

  // Show loading while checking authorization
  if (loading) {
    return (
      <div className="d-flex justify-content-center p-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authorized
  if (!isAuthorized) {
    return <Navigate to="/signin" replace />;
  }

  // Render the protected component if authorized
  return children;
};

export default ProtectedRoute;