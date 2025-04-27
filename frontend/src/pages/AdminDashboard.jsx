import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getAuthData, clearAuthData } from "../utils/auth-utils.js";
import { FaUsers, FaStore, FaBoxOpen, FaExclamationTriangle, FaDollarSign, FaSignOutAlt } from "react-icons/fa";
import GrowthChart from './GrowthChart.jsx';
import TopServicesTable from './TopServicesTable.jsx';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [data, setData] = useState({
    users: [],
    vendors: [],
    services: [],
    pendingVendors: 0,
    totalPayments: 0,
    totalCommissions: 0,
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
    navigate("/signin");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="dashboard-wrapper">
      {/* Sidebar */}
      <aside className="sidebar">
        <h3 className="sidebar-title">Admin Panel</h3>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <button className="sidebar-btn active">Dashboard</button>
            </li>
            <li>
              <button className="sidebar-btn" onClick={() => navigate("/manageusers")}>
                Manage Users
              </button>
            </li>
            <li>
              <button
                className="sidebar-btn vendor-btn"
                onClick={() => navigate("/managevendor")}
              >
                <span>Manage Vendors</span>
                {data.pendingVendors > 0 && (
                  <span className="badge">{data.pendingVendors}</span>
                )}
              </button>
            </li>
            <li>
              <button className="sidebar-btn" onClick={() => navigate("/manageservices")}>
                Manage Services
              </button>
            </li>
            <li>
              <button className="sidebar-btn" onClick={() => navigate("/managebookings")}>
                Manage Bookings
              </button>
            </li>
            <li>
              <button className="sidebar-btn logout-btn" onClick={handleLogout}>
                <FaSignOutAlt className="btn-icon" />
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="dashboard-container">
          <header className="dashboard-header">
            <h2>Admin Dashboard</h2>
            <div className="welcome-text">Welcome, Admin</div>
          </header>

          {data.pendingVendors > 0 && (
            <div className="alert">
              <FaExclamationTriangle className="alert-icon" />
              <div>
                You have {data.pendingVendors} pending vendor{" "}
                {data.pendingVendors === 1 ? "application" : "applications"} to review.
                <button
                  className="alert-btn"
                  onClick={() => navigate("/managevendor")}
                >
                  Review Now
                </button>
              </div>
            </div>
          )}

          <div className="stats-grid">
            <div className="stat-card user-card">
              <div className="card-content">
                <FaUsers className="card-icon" />
                <h5>Users</h5>
                <p className="card-value">{data.users?.length || 0}</p>
              </div>
            </div>
            <div className="stat-card vendor-card">
              <div className="card-content">
                <FaStore className="card-icon" />
                <h5>Vendors</h5>
                <p className="card-value">{data.vendors?.length || 0}</p>
              </div>
            </div>
            <div className="stat-card service-card">
              <div className="card-content">
                <FaBoxOpen className="card-icon" />
                <h5>Services</h5>
                <p className="card-value">{data.services?.length || 0}</p>
              </div>
            </div>
            <div className="stat-card payment-card">
              <div className="card-content">
                <FaDollarSign className="card-icon" />
                <h5>Total Payments</h5>
                <p className="card-value">NPR {data.totalPayments || 0}</p>
              </div>
            </div>
            <div className="stat-card commission-card">
              <div className="card-content">
                <FaDollarSign className="card-icon" />
                <h5>Total Commissions</h5>
                <p className="card-value">NPR {(data.totalCommissions || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="content-grid">
            <div className="chart-container">
              <h3 className="chart-title">Growth Overview</h3>
              <div className="chart">
                <GrowthChart />
              </div>
            </div>
            <div className="table-container">
              <h3 className="table-title">Top Services</h3>
              <TopServicesTable />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;