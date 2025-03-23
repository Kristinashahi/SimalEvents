import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom"; // Import Link for navigation
import "bootstrap/dist/css/bootstrap.min.css"; // Import Bootstrap

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // Success or error

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/register`, formData, { 
        withCredentials: true,
        headers: { "Content-Type": "application/json" }
      });

      localStorage.setItem("token", res.data.token); // Save token
      setMessage("Registration successful! Redirecting...");
      setMessageType("success");

      setTimeout(() => {
        window.location.href = "/signin";
      }, 2000);
    } catch (error) {
      console.error("Registration error:", error);
      setMessage(error.response?.data?.msg || "Something went wrong");
      setMessageType("danger");
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100" >
      <div className="row" >
        <div className="col-md-8" style={{ maxWidth: "450px", width: "100%" }}>
          <div className="card shadow p-4"  >
            <h2 className="text-center">Sign Up</h2>
            
            {message && <div className={`alert alert-${messageType} mt-3`}>{message}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Name</label>
                <input type="text" name="name" className="form-control" placeholder="Enter your name" onChange={handleChange} required />
              </div>

              <div className="mb-3">
                <label className="form-label">Email</label>
                <input type="email" name="email" className="form-control" placeholder="Enter your email" onChange={handleChange} required />
              </div>

              <div className="mb-3">
                <label className="form-label">Password</label>
                <input type="password" name="password" className="form-control" placeholder="Enter your password" onChange={handleChange} required />
              </div>

              <button type="submit" className="btn btn-primary w-100">Sign Up</button>
            </form>

            <p className="text-center mt-3">
              Already have an account? <Link to="/signin">Sign in here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
