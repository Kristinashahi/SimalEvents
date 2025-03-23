import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaUsers, FaStore, FaBoxOpen, FaExclamationTriangle } from "react-icons/fa";

const AdminDashboard = () => {
  const [data, setData] = useState({ 
    users: [], 
    vendors: [], 
    products: [],
    pendingVendors: 0 
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }

    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:4000/admin/admin-dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching admin data:", error);
        if (error.response?.status === 403) {
          navigate("/signin");
        }
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) return <div className="text-center mt-5">Loading...</div>;

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className="bg-dark text-white p-3 vh-100" style={{ width: "250px" }}>
        <h3 className="text-center">Admin Panel</h3>
        <ul className="nav flex-column">
          <li className="nav-item py-2"><button className="btn btn-dark w-100 active">Dashboard</button></li>
          <li className="nav-item py-2"><button className="btn btn-dark w-100" onClick={() => navigate("/manageusers")}>Manage Users</button></li>
          <li className="nav-item py-2">
            <button className="btn btn-dark w-100 d-flex justify-content-between align-items-center" onClick={() => navigate("/managevendor")}>
              <span>Manage Vendors</span>
              {data.pendingVendors > 0 && (
                <span className="badge bg-warning">{data.pendingVendors}</span>
              )}
            </button>
          </li>
        </ul>
      </div>

      {/* Main Dashboard */}
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
                <h5 className="card-title mt-2">Products</h5>
                <p className="fs-3">{data.products?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent activity section could go here */}
      </div>
    </div>
  );
};

export default AdminDashboard;