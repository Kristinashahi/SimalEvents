import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { getAuthData, clearAuthData } from "../utils/auth-utils.js";
import { FaUsers, FaStore, FaBoxOpen, FaExclamationTriangle, FaDollarSign  } from "react-icons/fa";
import GrowthChart from './GrowthChart.jsx';
import TopServicesTable from './TopServicesTable.jsx';

const AdminDashboard = () => {
  const [data, setData] = useState({ 
    usersCount: 0, 
    vendorsCount: 0, 
    servicesCount: 0, 
    pendingRequests: 0 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const { token } = getAuthData();
    if (token) {
      fetchAdminData(token);
    } else {
      setError("Not authenticated. Please login again.");
      setLoading(false);
    }
  }, []);

  const fetchAdminData = async (token) => {
    try {
      const response = await axios.get("http://localhost:4000/admin/admin-dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const paymentResponse = await axios.get("http://localhost:4000/admin/payments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData({
        ...response.data,
        totalPayments: paymentResponse.data.totalPayments,
        totalCommissions: paymentResponse.data.totalCommissions,
      });
      setLoading(false);
    } catch (error) {
      setError("Failed to load dashboard data. " + (error.response?.data?.msg || error.message));
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthData();
    window.location.href = "/signin";
  };

  if (loading) {
    return <div className="container mt-5 text-center"><div className="spinner-border" role="status"></div><p>Loading dashboard...</p></div>;
  }

  if (error) {
    return <div className="container mt-5 alert alert-danger">{error}</div>;
  }

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
    {/* Sidebar - Fixed position with scrollable content */}
    <div 
      className="bg-dark text-white p-3 d-flex flex-column"
      style={{ 
        width: "250px",
        position: 'sticky',
        top: 0,
        height: '160vh',
        overflowY: 'auto' // Allows sidebar content to scroll if needed
      }}
    >
      <h3 className="text-center mb-4">Admin Panel</h3>
      <ul className="nav flex-column" style={{ flex: '1 1 auto' }}>
        <li className="nav-item py-2">
          <button className="btn btn-dark w-100 active">Dashboard</button>
        </li>
        <li className="nav-item py-2">
          <button 
            className="btn btn-dark w-100" 
            onClick={() => navigate("/manageusers")}
          >
            Manage Users
          </button>
        </li>
        <li className="nav-item py-2">
          <button 
            className="btn btn-dark w-100 d-flex justify-content-between align-items-center" 
            onClick={() => navigate("/managevendor")}
          >
            <span>Manage Vendors</span>
            {data.pendingVendors > 0 && (
              <span className="badge bg-warning">{data.pendingVendors}</span>
            )}
          </button>
        </li>
        <li className="nav-item py-2">
          <button 
            className="btn btn-dark w-100" 
            onClick={() => navigate("/manageservices")}
          >
            Manage Services
          </button>
        </li>
        
      </ul>
    </div>

      {/* Main Dashboard */}
      <div className="flex-grow-1">
      <div className="container-fluid p-4">
        <h2 className="mb-4">Admin Dashboard</h2>
        
        {data.pendingVendors > 0 && (
          <div className="alert alert-warning d-flex align-items-center mb-4" role="alert">
            <FaExclamationTriangle className="me-2" />
            <div>
              You have {data.pendingVendors} pending vendor {data.pendingVendors === 1 ? 'application' : 'applications'} to review.
              <button className="btn btn-sm btn-outline-dark ms-3" onClick={() => navigate("/managevendor")}>
                Review Now
              </button>
            </div>
          </div>
        )}
        
        <div className="row">
          <div className="col-md-4">
            <div className="card text-white bg-primary mb-3">
              <div className="card-body text-center">
                <FaUsers size={40} />
                <h5 className="card-title mt-2">Users</h5>
                <p className="fs-3">{data.users?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card text-white bg-success mb-3">
              <div className="card-body text-center">
                <FaStore size={40} />
                <h5 className="card-title mt-2">Vendors</h5>
                <p className="fs-3">{data.vendors?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card text-white bg-warning mb-3">
              <div className="card-body text-center">
                <FaBoxOpen size={40} />
                <h5 className="card-title mt-2">Services</h5>
                <p className="fs-3">{data.services?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
              <div className="card text-white bg-info mb-3">
                <div className="card-body text-center">
                  <FaDollarSign size={40} />
                  <h5 className="card-title mt-2">Total Payments</h5>
                  <p className="fs-3">NPR {data.totalPayments || 0}</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-white bg-secondary mb-3">
                <div className="card-body text-center">
                  <FaDollarSign size={40} />
                  <h5 className="card-title mt-2">Total Commissions</h5>
                  <p className="fs-3">NPR {data.totalCommissions || 0}</p>
                </div>
              </div>
            </div>
        </div>
        
        <div className="row mt-4">
  <div className="col-md-8">
    <div className="card p-3" style={{ height: '650px', width: '700px' }}> 
      <GrowthChart />
    </div>
  </div>
  <div className="col-md-4" >
    <TopServicesTable />
  </div>
</div>



      </div>
    </div>

      </div>
      
  );
};

export default AdminDashboard;
