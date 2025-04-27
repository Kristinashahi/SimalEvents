import React, { useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate, Link } from "react-router-dom"; // Add Link to imports
import { FaEye, FaEyeSlash } from "react-icons/fa";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (pwd) => {
    // Example: At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return passwordRegex.test(pwd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("info");

    if (!token) {
      setMessage("Invalid or missing reset token");
      setMessageType("danger");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords don't match!");
      setMessageType("danger");
      return;
    }

    if (!validatePassword(password)) {
      setMessage(
        "Password must be at least 8 characters long, with 1 uppercase, 1 lowercase, and 1 number"
      );
      setMessageType("danger");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        token,
        newPassword: password,
      });
      setMessage("Password reset successful! Redirecting to sign-in...");
      setMessageType("success");
      setTimeout(() => navigate("/signin"), 2000);
    } catch (error) {
      setMessage(error.response?.data?.msg || "Error resetting password");
      setMessageType("danger");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <h2 className="reset-password-title">Reset Password</h2>
        {message && (
          <div className={`reset-message reset-message-${messageType}`}>
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit} className="reset-password-form">
          <div className="form-group password-container">
            <label className="form-label">New Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isLoading}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <div className="form-group password-container">
            <label className="form-label">Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
                disabled={isLoading}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="primary-button"
            disabled={isLoading}
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
        <p className="reset-footer">
          Back to <Link to="/signin" className="text-link">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;