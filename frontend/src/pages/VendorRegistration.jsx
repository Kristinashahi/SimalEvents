import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const VendorRegistration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", // Changed from businessName to name to match backend expectation
    businessName:"",
    address: "",
    phoneNumber: "",
    description: "",
    website: "",
    taxId: "",
    serviceCategories: [],
    email: "",
    contactPerson: "",
    password: "",
    confirmPassword: "",
    role: "vendor",
  });
  const [documents, setDocuments] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Available service categories
  const availableCategories = [
    "Venue",
    "Catering",
    "Decoration",
    "Photography",
    "Videography",
    "Sound System",
    "Lighting",
    "Entertainment",
    "Transportation",
    "Other"
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    
    // Clear password error when user types in password fields
    if (e.target.name === "password" || e.target.name === "confirmPassword") {
      setPasswordError("");
    }
  };

  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setFormData({
        ...formData,
        serviceCategories: [...formData.serviceCategories, value]
      });
    } else {
      setFormData({
        ...formData,
        serviceCategories: formData.serviceCategories.filter(cat => cat !== value)
      });
    }
  };

  const handleFileChange = (e) => {
    setDocuments(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setPasswordError("");
    
    // Validate passwords
    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match");
      setLoading(false);
      return;
    }
    
    if (formData.password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
        // Create FormData object to handle file upload
        const data = new FormData();
        
        // Add all form fields to FormData
        Object.keys(formData).forEach(key => {
          if (key === "serviceCategories") {
            // Handle array data
            if (formData[key].length > 0) {
              // Convert array to JSON string to ensure the server can parse it correctly
              data.append("serviceCategories", JSON.stringify(formData[key]));
            } else {
              // Ensure at least one category is selected
              setError("Please select at least one service category");
              setLoading(false);
              return;
            }
          } else if (key !== "confirmPassword") { // Don't send confirmPassword to the server
            data.append(key, formData[key]);
          }
        });
        
        // Add document if available
        if (documents) {
          data.append("document", documents);
        } else {
          setError("Please upload a business document");
          setLoading(false);
          return;
        }
        
        // Log what we're sending (for debugging)
        console.log("Submitting data:", Object.fromEntries(data));
        
        // Submit vendor registration to the regular register endpoint
        const response = await axios.post("http://localhost:4000/auth/register", data, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      
        // Save the token
        localStorage.setItem("token", response.data.token);
        
        setSuccess(true);
        setLoading(false);
        
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate("/signin");
        }, 5000);
      } catch (err) {
        setLoading(false);
        
        // Show detailed error information
        if (err.response) {
          console.error("Server response error:", err.response.data);
          setError(err.response.data.msg || (err.response.data.errors ? err.response.data.errors[0].msg : JSON.stringify(err.response.data)) || "Server error");
        } else if (err.request) {
          console.error("No response received:", err.request);
          setError("No response from server. Please check your connection.");
        } else {
          console.error("Request setup error:", err.message);
          setError(err.message || "Error preparing your request");
        }
      }
  };

  if (success) {
    return (
      <div className="container mt-5">
        <div className="alert alert-success">
          <h4 className="alert-heading">Registration Submitted!</h4>
          <p>
            Your vendor registration has been submitted for review. You will be notified once an admin approves your application.
          </p>
          <p>
            You can check the status of your application in your dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-header text-center bg-primary text-white">
              <h4>Register as Service Provider</h4>
              <p className="mb-0">Join our platform and offer your services to event organizers</p>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <h5 className="border-bottom pb-2 text-primary">Business Information</h5>
                  
                  <div className="mb-3">
                    <label className="form-label fw-bold">Contact Person</label>
                    <input
                      type="text"
                      name="name" 
                      className="form-control"
                      value={formData.name} 
                      onChange={handleChange}
                      placeholder="Enter Contact Person Name"
                      required
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Business Name</label>
                      <input
                        type="text"
                        name="businessName"
                        className="form-control"
                        value={formData.businessName}
                        onChange={handleChange}
                        placeholder="Company Name"
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Business Email</label>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="contact@yourbusiness.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Business Address</label>
                    <input
                      type="text"
                      name="address"
                      className="form-control"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter your full business address"
                      required
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Phone Number</label>
                      <input
                        type="text"
                        name="phoneNumber"
                        className="form-control"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="Business contact number"
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Tax ID / Business Registration Number</label>
                      <input
                        type="text"
                        name="taxId"
                        className="form-control"
                        value={formData.taxId}
                        onChange={handleChange}
                        placeholder="Your business registration ID"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Website (optional)</label>
                    <input
                      type="url"
                      name="website"
                      className="form-control"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://www.yourbusiness.com"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <h5 className="border-bottom pb-2 text-primary">Services Information</h5>
                  
                  <div className="mb-3">
                    <label className="form-label fw-bold">Business Description</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe your business, services, experience, and what makes you unique..."
                      required
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Service Categories</label>
                    <div className="row">
                      {availableCategories.map(category => (
                        <div className="col-md-4 mb-2" key={category}>
                          <div className="form-check">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id={`category-${category}`}
                              value={category}
                              checked={formData.serviceCategories.includes(category)}
                              onChange={handleCategoryChange}
                            />
                            <label className="form-check-label" htmlFor={`category-${category}`}>
                              {category}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                    {formData.serviceCategories.length === 0 && (
                      <small className="text-danger">Please select at least one service category</small>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <h5 className="border-bottom pb-2 text-primary">Account Information</h5>
                  
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Password</label>
                      <input
                        type="password"
                        name="password"
                        className="form-control"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create a password"
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Confirm Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        className="form-control"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        required
                      />
                    </div>
                  </div>
                  {passwordError && <div className="text-danger mb-3">{passwordError}</div>}
                </div>

                <div className="mb-4">
                  <h5 className="border-bottom pb-2 text-primary">Verification</h5>
                  
                  <div className="mb-3">
                    <label className="form-label fw-bold">Upload Business Documents</label>
                    <div className="input-group">
                      <input
                        type="file"
                        className="form-control"
                        onChange={handleFileChange}
                        required
                      />
                    </div>
                    <div className="form-text text-muted">
                      Please upload business license, certifications, or other official documents that verify your business
                      <br />
                      Accepted formats: PDF, JPG, PNG (Max: 5MB)
                    </div>
                  </div>
                </div>

                <div className="mb-3 form-check">
                  <input type="checkbox" className="form-check-input" id="agreementCheck" required />
                  <label className="form-check-label" htmlFor="agreementCheck">
                    I agree to the <a href="#" className="text-decoration-none">Terms and Conditions</a> and <a href="#" className="text-decoration-none">Privacy Policy</a>
                  </label>
                </div>

                <div className="d-grid gap-2">
                  <button 
                    className="btn btn-primary py-2" 
                    type="submit" 
                    disabled={loading || formData.serviceCategories.length === 0}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Submitting...
                      </>
                    ) : "Submit Registration"}
                  </button>
                  <button className="btn btn-outline-secondary" onClick={() => navigate(-1)} type="button">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorRegistration;