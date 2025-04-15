import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import * as jwtDecode from "jwt-decode";
import { storeAuthData } from "../utils/auth-utils.js"; // Import the utility functions

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
      
      try {
        // Decode JWT token to get user role
        const decoded = jwtDecode.jwtDecode(token);
        console.log("Decoded token:", decoded);
        
        // Get user role from token
        const userRole = decoded.role || "user";
        console.log("Role from token:", userRole);
        
        // Store auth data in cookie and session storage
        storeAuthData(token, {
          id: decoded.id,
          name: decoded.name,
          email: decoded.email,
          role: userRole
        });
        
        setMessage(`Login successful! Redirecting to ${userRole} dashboard...`);
        setMessageType("success");
        
        // Redirect based on role
        setTimeout(() => {
          switch(userRole) {
            case "admin":
              navigate("/admin-dashboard");
              break;
            case "vendor":
              // Check if vendor is approved
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
        
        // Fallback: Make API call to get user data
        try {
          const userRes = await axios.get(`${API_BASE_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          const userData = userRes.data;
          const userRole = userData.role || "user";
          
          // Store user info
          storeAuthData(token, {
            id: userData._id,
            name: userData.name,
            email: userData.email,
            role: userRole
          });
          
          // Redirect based on role
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
          // If all else fails, go to home page
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
          Don't have an account? <Link to="/signup">Register as Client</Link>
        </p>
        <Link to="/vendorRegister" className="btn btn-outline-primary mt-3 w-100">
          Register as Vendor
        </Link>
      </div>
    </div>
  );
};

export default SignIn;