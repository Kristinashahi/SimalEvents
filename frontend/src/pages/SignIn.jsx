import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import * as jwtDecode from "jwt-decode";
import { storeAuthData } from "../utils/auth-utils.js";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import eye icons
import "../styles/Login.css";
import loginImage from "../Images/cov2.jpeg";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [showPassword, setShowPassword] = useState(false); // State for password visibility

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleForgotPassword = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
        email: forgotPasswordEmail
      });
      setMessage("Password reset link sent to your email!");
      setMessageType("success");
      setShowForgotPassword(false);
    } catch (error) {
      setMessage(error.response?.data?.msg || "Failed to send reset link");
      setMessageType("danger");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, formData, { withCredentials: true });
      const token = res.data.token;
      
      try {
        const decoded = jwtDecode.jwtDecode(token);
        const userRole = decoded.role || "user";
        
        storeAuthData(token, {
          id: decoded.id,
          name: decoded.name,
          email: decoded.email,
          role: userRole
        });
        
        setMessage(`Login successful! Redirecting to ${userRole} dashboard...`);
        setMessageType("success");
        
        setTimeout(() => {
          switch(userRole) {
            case "admin":
              navigate("/admin-dashboard");
              break;
            case "vendor":
              if (decoded.status === "approved") {
                navigate("/vendor-dashboard");
              } else if (decoded.status === "pending") {
                setMessage("Your vendor account is pending approval. You'll be redirected to the pending page.");
                setMessageType("warning");
                setTimeout(() => navigate("/vendor-pending"), 2000);
              } else if (decoded.status === "rejected") {
                setMessage("Your vendor application was rejected. You'll be redirected to the rejection page.");
                setMessageType("danger");
                setTimeout(() => navigate("/vendor-rejected"), 2000);
              } else {
                navigate("/vendordashboard");
              }
              break;
            case "user":
              navigate("/user-dashboard");
              break;
            default:
              navigate("/");
          }
        }, 1500);
      } catch (decodeError) {
        console.error("Error decoding token:", decodeError);
        
        try {
          const userRes = await axios.get(`${API_BASE_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          const userData = userRes.data;
          const userRole = userData.role || "user";
          
          storeAuthData(token, {
            id: userData._id,
            name: userData.name,
            email: userData.email,
            role: userRole
          });
          
          setTimeout(() => {
            switch(userRole) {
              case "admin":
                navigate("/admin-dashboard");
                break;
              case "vendor":
                if (userData.status === "approved") {
                  navigate("/vendordashboard");
                } else if (userData.status === "pending") {
                  navigate("/vendor-pending");
                } else if (userData.status === "rejected") {
                  navigate("/vendor-rejected");
                } else {
                  navigate("/vendordashboard");
                }
                break;
              case "user":
                navigate("/user-dashboard");
                break;
              default:
                navigate("/");
            }
          }, 1500);
        } catch (userError) {
          console.error("Error fetching user data:", userError);
          setTimeout(() => navigate("/"), 1500);
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.response?.data?.msg?.includes("pending approval")) {
        setMessage("Your vendor account is pending approval. Please check back later.");
        setMessageType("warning");
      } else if (error.response?.data?.msg?.includes("application was rejected")) {
        setMessage("Your vendor application has been rejected. Please contact support for more information.");
        setMessageType("danger");
      } else {
        setMessage(error.response?.data?.msg || "Invalid credentials");
        setMessageType("danger"); 
      }
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-image-container">
        <img src={loginImage} alt="Login Visual" className="login-image" />
        <div className="image-overlay">
          <h2>Welcome Back</h2>
          <p>Manage your events with elegance and efficiency</p>
        </div>
      </div>

      <div className="signin-container">
        <div className="signin-card">
          <h2 className="signin-title">Sign In</h2>
          {message && (
            <div className={`signin-message signin-message-${messageType}`}>
              {message}
            </div>
          )}
          
          {!showForgotPassword ? (
            <>
              <form onSubmit={handleSubmit} className="signin-form">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group password-container">
                  <label className="form-label">Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className="form-input password-input"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <div className="forgot-password-link-container">
                    <button 
                      type="button" 
                      className="forgot-password-link"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>
                <button type="submit" className="primary-button">Sign In</button>
              </form>
              <p className="signin-footer">
                Don't have an account? <Link to="/signup" className="text-link">Register as Client</Link>
              </p>
              <Link to="/vendorRegister" className="secondary-button">
                Register as Vendor
              </Link>
            </>
          ) : (
            <div className="forgot-password-form">
              <h4 className="forgot-password-title">Reset Password</h4>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter your registered email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  required
                />
              </div>
              <button 
                onClick={handleForgotPassword}
                className="primary-button"
              >
                Send Reset Link
              </button>
              <button 
                onClick={() => {
                  setShowForgotPassword(false);
                  setMessage("");
                }}
                className="secondary-button"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignIn;