import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getAuthData, clearAuthData } from "../utils/auth-utils.js";
import { toast } from "react-hot-toast";
import { FaEdit, FaTrash, FaSearch, FaPlus } from "react-icons/fa";

const ManageServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [servicesPerPage] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { token } = getAuthData();
        const response = await axios.get("http://localhost:4000/api/services", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setServices(response.data);
        setLoading(false);
      } catch (error) {
        setError("Failed to load services. " + (error.response?.data?.msg || error.message));
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleDelete = async (serviceId) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        const { token } = getAuthData();
        await axios.delete(`http://localhost:4000/api/services/${serviceId}`, {
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
        `http://localhost:4000/api/services/${serviceId}`,
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

  // Filter services based on search term
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (service.vendor?.businessName && service.vendor.businessName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination logic
  const indexOfLastService = currentPage * servicesPerPage;
  const indexOfFirstService = indexOfLastService - servicesPerPage;
  const currentServices = filteredServices.slice(indexOfFirstService, indexOfLastService);
  const totalPages = Math.ceil(filteredServices.length / servicesPerPage);

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status"></div>
        <p>Loading services...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Services</h2>
        
      </div>

      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <div className="row align-items-center">
            <div className="col-md-6">
              <h4 className="mb-0">All Services</h4>
            </div>
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
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
                      <td className="text-capitalize">{service.category}</td>
                      <td>NPR {service.price}</td>
                      <td>
                        <select
                          className={`form-select form-select-sm ${service.status === 'active' ? 'bg-success text-white' : 
                                      service.status === 'inactive' ? 'bg-danger text-white' : 'bg-warning text-dark'}`}
                          value={service.status}
                          onChange={(e) => handleStatusChange(service._id, e.target.value)}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="pending">Pending</option>
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary me-2"
                          onClick={() => navigate(`/editservice/${service._id}`)}
                        >
                          <FaEdit /> Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(service._id)}
                        >
                          <FaTrash /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      {searchTerm ? "No matching services found" : "No services available"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredServices.length > servicesPerPage && (
            <nav className="mt-4">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </button>
                </li>
                
                {Array.from({ length: totalPages }, (_, i) => (
                  <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
                
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageServices;