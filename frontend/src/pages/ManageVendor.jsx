import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaCheck, FaTimes, FaEye, FaSearch } from "react-icons/fa";
import { getAuthData } from "../utils/auth-utils.js";
import "../styles/ManageVendor.css";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const ManageVendor = () => {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionStatus, setActionStatus] = useState({ message: "", type: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    filterVendors();
  }, [vendors, searchTerm, searchCategory]);

  const fetchVendors = async () => {
    const { token } = getAuthData();
    if (!token) {
      navigate("/signin");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/admin/vendors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVendors(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setError("Failed to load vendors");
      setLoading(false);
      if (error.response?.status === 403) {
        navigate("/signin");
      }
    }
  };

  const filterVendors = () => {
    let results = vendors;
    
    // Filter by search term
    if (searchTerm) {
      results = results.filter(vendor => 
        vendor.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.serviceCategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.serviceCategories?.some(cat => 
          cat.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    }
    
    // Filter by category
    if (searchCategory !== "all") {
      results = results.filter(vendor => 
        vendor.serviceCategory === searchCategory ||
        vendor.serviceCategories?.includes(searchCategory)
      );
    }
    
    setFilteredVendors(results);
  };

  const handleApprove = async (id) => {
    const { token } = getAuthData();
    try {
      await axios.put(`${API_BASE_URL}/admin/approve-vendor/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActionStatus({ message: "Vendor approved successfully!", type: "success" });
      fetchVendors();
    } catch (error) {
      console.error("Error approving vendor:", error);
      setActionStatus({ message: "Failed to approve vendor", type: "error" });
    }
  };

  const handleReject = async (id) => {
    const { token } = getAuthData();
    try {
      await axios.put(`${API_BASE_URL}/admin/reject-vendor/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActionStatus({ message: "Vendor application rejected", type: "warning" });
      fetchVendors();
    } catch (error) {
      console.error("Error rejecting vendor:", error);
      setActionStatus({ message: "Failed to reject vendor", type: "error" });
    }
  };

  const viewVendorDetails = (vendor) => {
    setSelectedVendor(vendor);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedVendor(null);
  };

  // Extract unique service categories for filter dropdown
  const serviceCategories = [...new Set(
    vendors.flatMap(vendor => 
      vendor.serviceCategories || 
      (vendor.serviceCategory ? [vendor.serviceCategory] : [])
  ))].filter(Boolean);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading vendors...</p>
      </div>
    );
  }

  return (
    <div className="manage-vendor-container">
      {/* Main content */}
      <main className="content-area">
        <header className="content-header">
          <h1>Vendor Management</h1>
        </header>
        
        {actionStatus.message && (
          <div className={`alert-message ${actionStatus.type}`}>
            {actionStatus.message}
            <button 
              className="close-btn" 
              onClick={() => setActionStatus({ message: "", type: "" })}
            >×</button>
          </div>
        )}

        <div className="search-filters">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="category-filter">
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {serviceCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="vendor-table-container">
          <div className="table-header">
            <h3>Vendor Applications</h3>
            <span className="count-badge">{filteredVendors.length} vendors</span>
          </div>
          
          <div className="table-wrapper">
            <table className="vendor-table">
              <thead>
                <tr>
                  <th>Business Name</th>
                  <th>Contact Person</th>
                  <th>Email</th>
                  <th>Service Category</th>
                  <th>Status</th>
                  <th>Registration Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.length === 0 ? (
                  <tr className="no-data">
                    <td colSpan="7">No vendor applications found</td>
                  </tr>
                ) : (
                  filteredVendors.map((vendor) => (
                    <tr key={vendor._id}>
                      <td>{vendor.businessName || "N/A"}</td>
                      <td>{vendor.contactPerson || vendor.name}</td>
                      <td>{vendor.email}</td>
                      <td>
                        {vendor.serviceCategories?.join(", ") || 
                         vendor.serviceCategory || "N/A"}
                      </td>
                      <td>
                        <span className={`status-badge ${vendor.vendorStatus}`}>
                          {vendor.vendorStatus}
                        </span>
                      </td>
                      <td>{new Date(vendor.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="view-btn" 
                            onClick={() => viewVendorDetails(vendor)}
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          {vendor.vendorStatus === "pending" && (
                            <>
                              <button 
                                className="approve-btn" 
                                onClick={() => handleApprove(vendor._id)}
                                title="Approve"
                              >
                                <FaCheck />
                              </button>
                              <button 
                                className="reject-btn" 
                                onClick={() => handleReject(vendor._id)}
                                title="Reject"
                              >
                                <FaTimes />
                              </button>
                            </>
                          )}
                          {vendor.vendorStatus === "rejected" && (
                            <button 
                              className="approve-btn" 
                              onClick={() => handleApprove(vendor._id)}
                              title="Approve"
                            >
                              <FaCheck />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Vendor Details Modal */}
      {showModal && selectedVendor && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Vendor Details</h2>
              <button className="close-modal" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="vendor-details-grid">
                <div className="detail-group">
                  <h4>Business Information</h4>
                  <p><strong>Name:</strong> {selectedVendor.businessName || "N/A"}</p>
                  <p><strong>Contact:</strong> {selectedVendor.contactPerson || selectedVendor.name}</p>
                  <p><strong>Email:</strong> {selectedVendor.email}</p>
                  <p><strong>Phone:</strong> {selectedVendor.phoneNumber || "N/A"}</p>
                </div>
                
                <div className="detail-group">
                  <h4>Service Details</h4>
                  <p><strong>Category:</strong> 
                    {selectedVendor.serviceCategories?.join(", ") || 
                     selectedVendor.serviceCategory || "N/A"}
                  </p>
                  <p><strong>Status:</strong> 
                    <span className={`status-badge ${selectedVendor.vendorStatus}`}>
                      {selectedVendor.vendorStatus}
                    </span>
                  </p>
                  <p><strong>Registered:</strong> {new Date(selectedVendor.createdAt).toLocaleString()}</p>
                </div>
                
                <div className="detail-group full-width">
                  <h4>Business Description</h4>
                  <p>{selectedVendor.description || "No description provided."}</p>
                </div>
                
                {selectedVendor.documentUrl && (
                  <div className="detail-group full-width">
                    <h4>Business Documents</h4>
                    <div className="document-preview">
                      {selectedVendor.documentUrl.endsWith('.pdf') ? (
                        <div className="pdf-notice">
                          <a 
                            href={`${API_BASE_URL}/${selectedVendor.documentUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            View PDF Document
                          </a>
                        </div>
                      ) : (
                        <img 
                          src={`${API_BASE_URL}/${selectedVendor.documentUrl}`} 
                          alt="Business Document" 
                          className="document-image"
                        />
                      )}
                    </div>
                    <a 
                      href={`${API_BASE_URL}/${selectedVendor.documentUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="view-document-btn"
                    >
                      View Full Document
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              {selectedVendor.vendorStatus === "pending" && (
                <>
                  <button 
                    className="modal-approve-btn" 
                    onClick={() => {
                      handleApprove(selectedVendor._id);
                      closeModal();
                    }}
                  >
                    Approve Vendor
                  </button>
                  <button 
                    className="modal-reject-btn" 
                    onClick={() => {
                      handleReject(selectedVendor._id);
                      closeModal();
                    }}
                  >
                    Reject Application
                  </button>
                </>
              )}
              <button className="modal-close-btn" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageVendor;