import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import * as jwtDecode from "jwt-decode";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, formData, { withCredentials: true });
      const token = res.data.token;
      localStorage.setItem("token", token);
      
      try {
        // Option 1: Try to decode the JWT token (if user info is stored in the token)
        const decoded = jwtDecode.jwtDecode(token);
        console.log("Decoded token:", decoded);
        
        // Check if role information is in the decoded token
        const userRole = decoded.role || "user";
        console.log("Role from token:", userRole);
        
        setMessage("Login successful! Redirecting...");
        setMessageType("info");
        
        setTimeout(() => {
          switch(userRole) {
            case "admin":
              navigate("/admin-dashboard");
              break;
            case "vendor":
              console.log("Redirecting to vendor dashboard");
              navigate("/vendordashboard");
              break;
            case "user":
              console.log("Redirecting to user dashboard");
              navigate("/");  // Redirect to home instead of /dashboard
              break;
            default:
              console.log("Redirecting to home page");
              navigate("/");  // Redirect to home instead of /dashboard
          }
        }, 1000);
      } catch (decodeError) {
        console.error("Error decoding token:", decodeError);
        
        // Option 2: Make a separate API call to get user data
        try {
          const userRes = await axios.get(`${API_BASE_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          const userRole = userRes.data.role || "user";
          console.log("Role from API:", userRole);
          
          setTimeout(() => {
            switch(userRole) {
              case "admin":
                navigate("/admin-dashboard");
                break;
              case "vendor":
                navigate("/vendordashboard");
                break;
              case "user":
                navigate("/");  // Redirect to home instead of /dashboard
                break;
              default:
                navigate("/");  // Redirect to home instead of /dashboard
            }
          }, 1000);
        } catch (userError) {
          console.error("Error fetching user data:", userError);
          // If all else fails, just go to home page
          setTimeout(() => navigate("/"), 1000);
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
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="card p-4 shadow-lg" style={{ maxWidth: "400px", width: "100%" }}>
        <h2 className="text-center mb-4">Sign In</h2>
        {message && <div className={`alert alert-${messageType} text-center`}>{message}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">Sign In</button>
        </form>
        <p className="mt-3 text-center">
          Don't have an account? <Link to="/signup">Register here</Link>
        </p>
        <Link to="/vendorRegister" className="btn btn-outline-primary mt-3">
          Register as Vendor
        </Link>
      </div>
    </div>
  );
};

export default SignIn;