import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getAuthData } from "../utils/auth-utils.js";
import { toast } from "react-hot-toast";
import { FaEdit, FaTrash, FaSearch, FaPlus, FaArrowLeft } from "react-icons/fa";
import "../styles/ManageServices.css";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const ManageServices = () => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [servicesPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { token } = getAuthData();
        const response = await axios.get(`${API_BASE_URL}/api/services`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setServices(response.data);
        setFilteredServices(response.data);
        setLoading(false);
      } catch (error) {
        setError("Failed to load services. " + (error.response?.data?.msg || error.message));
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [services, searchTerm, statusFilter]);

  const filterServices = () => {
    let results = services;
    
    // Filter by search term
    if (searchTerm) {
      results = results.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.vendor?.businessName && 
         service.vendor.businessName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Filter by status
    if (statusFilter !== "all") {
      results = results.filter(service => service.status === statusFilter);
    }
    
    setFilteredServices(results);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleDelete = async (serviceId) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        const { token } = getAuthData();
        await axios.delete(`${API_BASE_URL}/api/services/${serviceId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Service deleted successfully");
        setServices(services.filter(service => service._id !== serviceId));
      } catch (error) {
        toast.error("Failed to delete service: " + (error.response?.data?.msg || error.message));
      }
    }
  };

  const handleStatusChange = async (serviceId, newStatus) => {
    try {
      const { token } = getAuthData();
      await axios.put(
        `${API_BASE_URL}/api/services/${serviceId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Service status updated");
      setServices(services.map(service => 
        service._id === serviceId ? { ...service, status: newStatus } : service
      ));
    } catch (error) {
      toast.error("Failed to update status: " + (error.response?.data?.msg || error.message));
    }
  };

  // Pagination logic
  const indexOfLastService = currentPage * servicesPerPage;
  const indexOfFirstService = indexOfLastService - servicesPerPage;
  const currentServices = filteredServices.slice(indexOfFirstService, indexOfLastService);
  const totalPages = Math.ceil(filteredServices.length / servicesPerPage);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading services...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button className="retry-button" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    
    <div className="manage-services-container">
      <div className="header-section">
        <h1>Service Management</h1>
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft className="icon" /> Back to Dashboard
        </button>
      </div>

      <div className="search-filters">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="status-filter">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <div className="services-table-container">
        <div className="table-header">
          <h3>All Services</h3>
          <span className="count-badge">{filteredServices.length} services</span>
        </div>
        
        <div className="table-wrapper">
          <table className="services-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Vendor</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentServices.length > 0 ? (
                currentServices.map((service) => (
                  <tr key={service._id}>
                    <td>{service.name}</td>
                    <td>{service.vendor?.businessName || "N/A"}</td>
                    <td className="capitalize">{service.category}</td>
                    <td>NPR {service.price}</td>
                    <td>
                      <select
                        className={`status-select ${service.status}`}
                        value={service.status}
                        onChange={(e) => handleStatusChange(service._id, e.target.value)}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                      </select>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="edit-button"
                          onClick={() => navigate(`/editservice/${service._id}`)}
                        >
                          <FaEdit /> Edit
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => handleDelete(service._id)}
                        >
                          <FaTrash /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="no-data">
                  <td colSpan="6">
                    {searchTerm || statusFilter !== "all" ? 
                      "No matching services found" : "No services available"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredServices.length > servicesPerPage && (
          <div className="pagination-container">
            <button
              className="pagination-button"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            
            <div className="page-numbers">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={`page-number ${currentPage === i + 1 ? 'active' : ''}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            
            <button
              className="pagination-button"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageServices;