import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import eye icons
import "../styles/Login.css";
import signupImage from "../Images/cov1.jpeg";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); 

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!passwordRegex.test(password)) {
      setMessage("Password must contain at least one uppercase letter, one number, and one special character.");
      setMessageType("danger");
      return false;
    }
    return true;
  };
 
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match");
      setMessageType("danger");
      setLoading(false);
      return;
    }

    if (!validatePassword(formData.password)) {
      setLoading(false);
      return;
    }

    try {
      const dataToSend = { ...formData };
      delete dataToSend.confirmPassword;

      const res = await axios.post(`${API_BASE_URL}/auth/register`, dataToSend);

      setMessage("Registration successful! Please log in.");
      setMessageType("success");

      setTimeout(() => {
        navigate("/signin");
      }, 2000);
    } catch (error) {
      console.error("Registration error:", error);
      setMessage(error.response?.data?.msg || "Registration failed");
      setMessageType("danger");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="login-page-container">
      <div className="login-image-container">
        <img src={signupImage} alt="Sign Up Visual" className="login-image" />
        <div className="image-overlay">
          <h2>Join Our Community</h2>
          <p>Create your account to get started</p>
        </div>
      </div>

      <div className="signin-container">
        <div className="signin-card">
          <h2 className="signin-title">Sign Up</h2>
          {message && (
            <div className={`signin-message signin-message-${messageType}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="signin-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
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
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
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
            </div>
            <div className="form-group password-container">
              <label className="form-label">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  className="form-input password-input"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength="6"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? "Signing Up..." : "Sign Up"}
            </button>
          </form>

          <p className="signin-footer">
            Already have an account? <Link to="/signin" className="text-link">Sign In</Link>
          </p>

          <Link to="/vendorRegister" className="secondary-button">
            Register as Vendor
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;