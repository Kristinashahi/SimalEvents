import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  
  if (!token) {
    return <Navigate to="/signin" />;
  }
  
  // Decode the token to get user role
  const getRole = () => {
    try {
      // Simple approach - in production use a proper JWT decoding library
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      return payload.role;
    } catch (e) {
      return null;
    }
  };
  
  const userRole = getRole();
  
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/" />;
  }
  
  return children;
};

export default ProtectedRoute;