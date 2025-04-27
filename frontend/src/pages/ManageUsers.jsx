import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaArrowLeft, FaSearch } from "react-icons/fa";
import { getAuthData } from "../utils/auth-utils.js";
import "../styles/ManageUser.css";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchRole, setSearchRole] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const { token } = getAuthData();
    if (!token) {
      navigate("/signin");
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(response.data);
        setFilteredUsers(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Failed to load users. Please try again.");
        setLoading(false);
        if (error.response?.status === 403) {
          navigate("/signin");
        }
      }
    };

    fetchUsers();
  }, [navigate]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, searchRole]);

  const filterUsers = () => {
    let results = users;
    
    // Filter by search term
    if (searchTerm) {
      results = results.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by role
    if (searchRole !== "all") {
      results = results.filter(user => user.role === searchRole);
    }
    
    setFilteredUsers(results);
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      const { token } = getAuthData();
      try {
        await axios.delete(`${API_BASE_URL}/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(users.filter(user => user._id !== userId));
      } catch (error) {
        console.error("Error deleting user:", error);
        setError("Failed to delete user. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    
    <div className="manage-users-container">
      
      <div className="header-section">
        <h1>User Management</h1>
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
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="role-filter">
          <select
            value={searchRole}
            onChange={(e) => setSearchRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="vendor">Vendor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <div className="users-table-container">
        <div className="table-header">
          <h3>Users List</h3>
          <span className="count-badge">{filteredUsers.length} users</span>
        </div>
        
        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="edit-button"
                          onClick={() => navigate(`/edituser/${user._id}`)}
                        >
                          <FaEdit /> Edit
                        </button>
                        <button 
                          className="delete-button"
                          onClick={() => handleDelete(user._id)}
                        >
                          <FaTrash /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="no-data">
                  <td colSpan="4">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;