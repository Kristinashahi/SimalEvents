import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaCheck, FaTimes, FaEye } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import { getAuthData } from "../utils/auth-utils.js";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const ManageVendor = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionStatus, setActionStatus] = useState({ message: "", type: "" });
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    const { token } = getAuthData();
    if (!token) {
      navigate("/signin");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get("http://localhost:4000/admin/vendors", {
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

  const handleApprove = async (id) => {
    const { token } = getAuthData();
    try {
      await axios.put(`http://localhost:4000/admin/approve-vendor/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActionStatus({ message: "Vendor approved successfully!", type: "success" });
      // Update vendors list
      fetchVendors();
    } catch (error) {
      console.error("Error approving vendor:", error);
      setActionStatus({ message: "Failed to approve vendor", type: "danger" });
    }
  };

  const handleReject = async (id) => {
    const { token } = getAuthData();
    try {
      await axios.put(`http://localhost:4000/admin/reject-vendor/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActionStatus({ message: "Vendor application rejected", type: "warning" });
      // Update vendors list
      fetchVendors();
    } catch (error) {
      console.error("Error rejecting vendor:", error);
      setActionStatus({ message: "Failed to reject vendor", type: "danger" });
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

  if (loading) return <div className="text-center mt-5 p-5"><div className="spinner-border" role="status"></div></div>;

  return (
    <div className="d-flex">
      

      {/* Main content */}
      <div className="container-fluid p-4">
        <h2 className="mb-4">Vendor Management</h2>
        
        {actionStatus.message && (
          <div className={`alert alert-${actionStatus.type} alert-dismissible fade show`} role="alert">
            {actionStatus.message}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setActionStatus({ message: "", type: "" })}
            ></button>
          </div>
        )}

        <div className="card shadow">
          <div className="card-header bg-light">
            <h4>Vendor Applications</h4>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Business Name</th>
                    <th>Contact Person</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Registration Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center">No vendor applications found</td>
                    </tr>
                  ) : (
                    vendors.map((vendor) => (
                      <tr key={vendor._id}>
                        <td>{vendor.businessName || "N/A"}</td>
                        <td>{vendor.contactPerson || vendor.name}</td>
                        <td>{vendor.email}</td>
                        <td>
                          <span className={`badge ${
                            vendor.vendorStatus === "approved" 
                              ? "bg-success" 
                              : vendor.vendorStatus === "rejected" 
                                ? "bg-danger" 
                                : "bg-warning"
                          }`}>
                            {vendor.vendorStatus}
                          </span>
                        </td>
                        <td>{new Date(vendor.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="btn-group" role="group">
                            <button 
                              className="btn btn-sm btn-info" 
                              onClick={() => viewVendorDetails(vendor)}
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                            {vendor.vendorStatus === "pending" && (
                              <>
                                <button 
                                  className="btn btn-sm btn-success" 
                                  onClick={() => handleApprove(vendor._id)}
                                  title="Approve"
                                >
                                  <FaCheck />
                                </button>
                                <button 
                                  className="btn btn-sm btn-danger" 
                                  onClick={() => handleReject(vendor._id)}
                                  title="Reject"
                                >
                                  <FaTimes />
                                </button>
                              </>
                            )}
                            {vendor.vendorStatus === "rejected" && (
                              <button 
                                className="btn btn-sm btn-success" 
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
        </div>
      </div>

      {/* Vendor Details Modal */}
      {showModal && selectedVendor && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Vendor Details</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>Business Name:</strong> {selectedVendor.businessName || "N/A"}</p>
                    <p><strong>Contact Person:</strong> {selectedVendor.contactPerson || selectedVendor.name}</p>
                    <p><strong>Email:</strong> {selectedVendor.email}</p>
                    <p><strong>Phone:</strong> {selectedVendor.phoneNumber || "N/A"}</p>
                    <p><strong>Address:</strong> {selectedVendor.address || "N/A"}</p>
                    <p><strong>Website:</strong> {selectedVendor.website || "N/A"}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Tax ID:</strong> {selectedVendor.taxId || "N/A"}</p>
                    <p><strong>Status:</strong> <span className={`badge ${
                      selectedVendor.vendorStatus === "approved" 
                        ? "bg-success" 
                        : selectedVendor.vendorStatus === "rejected" 
                          ? "bg-danger" 
                          : "bg-warning"
                    }`}>{selectedVendor.vendorStatus}</span></p>
                    <p><strong>Service Category:</strong> 
                {selectedVendor.serviceCategory || selectedVendor.serviceCategories || "N/A"}
              </p>
                    
                    <p><strong>Registration Date:</strong> {new Date(selectedVendor.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <h6>Business Description</h6>
                  <p>{selectedVendor.description || "No description provided."}</p>
                </div>
                
                {selectedVendor.documentUrl && (
            <div className="mt-3">
              <h6>Business Documents</h6>
              <div className="document-preview">
                {selectedVendor.documentUrl.endsWith('.pdf') ? (
                  <div className="alert alert-info">
                    <a 
                      href={`${API_BASE_URL}/${selectedVendor.documentUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-decoration-none"
                    >
                      View PDF Document
                    </a>
                  </div>
                ) : (
                  <img 
                    src={`${API_BASE_URL}/${selectedVendor.documentUrl}`} 
                    alt="Business Document" 
                    className="img-fluid rounded border"
                    style={{ maxHeight: '300px' }}
                  />
                )}
              </div>
              <div className="mt-2">
                <a 
                  href={`${API_BASE_URL}/${selectedVendor.documentUrl}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline-primary"
                >
                  View Full Document
                </a>
              </div>
            </div>
          )}
              </div>
              <div className="modal-footer">
                {selectedVendor.vendorStatus === "pending" && (
                  <>
                    <button 
                      className="btn btn-success" 
                      onClick={() => {
                        handleApprove(selectedVendor._id);
                        closeModal();
                      }}
                    >
                      Approve Vendor
                    </button>
                    <button 
                      className="btn btn-danger" 
                      onClick={() => {
                        handleReject(selectedVendor._id);
                        closeModal();
                      }}
                    >
                      Reject Application
                    </button>
                  </>
                )}
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageVendor;