import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import "../styles/UserDashboard.css";
import { getAuthData, clearAuthData } from "../utils/auth-utils.js";
import { toast } from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const TIME_PERIODS = [
  { id: 'morning', name: 'Morning', time: '7:00 AM - 11:00 AM' },
  { id: 'day', name: 'Day', time: '12:00 PM - 4:00 PM' },
  { id: 'evening', name: 'Evening', time: '5:00 PM - 9:00 PM' }
];

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [userInfo, setUserInfo] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  });
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Set active tab from location state if available
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }

    const { token } = getAuthData();
    if (token) {
      fetchUserData(token);
      fetchBookingHistory(token);
    } else {
      setError("Not authenticated. Please login again.");
      setLoading(false);
    }
  }, [location.state]);

  const fetchUserData = async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserInfo(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Failed to load profile data. " + (error.response?.data?.msg || error.message));
      setLoading(false);
    }
  };

  const fetchBookingHistory = async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/bookings/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Ensure each booking has a service object
      const processedBookings = response.data.map(booking => ({
        ...booking,
        service: booking.service || { _id: '', name: 'Unknown Service' }
      }));
      setBookings(processedBookings);
    } catch (error) {
      console.error("Error fetching booking history:", error);
      setBookings([]); // Set empty array if error occurs
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setPasswordMessage({ text: "New passwords don't match", type: "danger" });
      return;
    }

    try {
      const { token } = getAuthData();
      const response = await axios.post(
        `${API_BASE_URL}/auth/change-password`,
        passwordData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPasswordMessage({ text: response.data.msg || "Password updated successfully", type: "success" });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: ""
      });
      toast.success("Password updated successfully!");
    } catch (error) {
      setPasswordMessage({
        text: error.response?.data?.msg || "An unexpected error occurred",
        type: "danger",
      });
      toast.error("Failed to update password");
    }
  };
  const handleCancelBooking = async (bookingId) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
        try {
            const { token } = getAuthData();
            const response = await axios.put(
                `${API_BASE_URL}/api/bookings/${bookingId}/cancel`,
                { status: "cancelled" },
                {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                }
            );
            
            // Refresh the bookings list
            await fetchBookingHistory(token);
            toast.success("Booking cancelled successfully");
            
            // For debugging - check the response
            console.log("Cancellation response:", response.data);
            
        } catch (error) {
            console.error("Error cancelling booking:", error);
            // More detailed error logging
            console.log("Error response:", error.response);
            toast.error(error.response?.data?.msg || 
                       error.response?.data?.message || 
                       "Failed to cancel booking. Please try again.");
        }
    }
};

  const handleLogout = () => {
    clearAuthData();
    window.location.href = "/signin";
  };

  if (loading) {
    return <div className="container mt-5 text-center"><div className="spinner-border" role="status"></div><p>Loading dashboard...</p></div>;
  }

  if (error && !userInfo) {
    return <div className="container mt-5 alert alert-danger">{error}</div>;
  }

  return (
    
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>User Dashboard</h2>
        </div>
        
        <div className="dashboard-layout">
          <div className="sidebar-nav">
            <button 
              className={`nav-button ${activeTab === "profile" ? "active" : ""}`} 
              onClick={() => setActiveTab("profile")}
            >
              Profile
            </button>
            <button 
              className={`nav-button ${activeTab === "password" ? "active" : ""}`} 
              onClick={() => setActiveTab("password")}
            >
              Change Password
            </button>
            <button 
              className={`nav-button ${activeTab === "bookings" ? "active" : ""}`} 
              onClick={() => setActiveTab("bookings")}
            >
              Booking History
            </button>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
          
          <div className="dashboard-content">
            {activeTab === "profile" && userInfo && (
              <>
                <div className="content-header">
                  <h5>Profile Information</h5>
                </div>
                <div className="content-body">
                  <div className="profile-grid">
                    <div className="profile-field">
                      <span className="profile-label">Name</span>
                      <div className="profile-value">
                        {userInfo.name || "Not available"}
                      </div>
                    </div>
                    <div className="profile-field">
                      <span className="profile-label">Email</span>
                      <div className="profile-value">
                        {userInfo.email || "Not available"}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
    
            {activeTab === "password" && (
              <>
                <div className="content-header">
                  <h5>Change Password</h5>
                </div>
                <div className="content-body">
                  <div className="password-form">
                    <div className="form-group">
                      <label className="form-label">Current Password</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} 
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">New Password</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} 
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Confirm New Password</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        value={passwordData.confirmNewPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })} 
                        required
                      />
                    </div>
                    <button className="submit-button" onClick={handlePasswordChange}>
                      Update Password
                    </button>
                    {passwordMessage && (
                      <div className={`message ${passwordMessage.type}`}>
                        {passwordMessage.text}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
    
    {activeTab === "bookings" && (
  <>
    <div className="content-header">
      <h5>Booking History</h5>
    </div>
    <div className="content-body">
      {bookings.length > 0 ? (
        <table className="bookings-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Date</th>
              <th>Time Periods</th>
              <th>Status</th>
              <th>Price</th>
              <th>Actions</th> {/* Added Actions column */}
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking._id}>
                <td>
                  {booking.service?._id ? (
                    <Link to={`/service/${booking.service._id}`}>
                      {booking.service?.name || 'Unknown Service'}
                    </Link>
                  ) : (
                    <span>{booking.service?.name || 'Unknown Service'}</span>
                  )}
                </td>
                <td>{booking.date ? new Date(booking.date).toLocaleDateString() : 'N/A'}</td>
                <td>
                  {booking.periods?.map(periodId => {
                    const period = TIME_PERIODS.find(p => p.id === periodId);
                    return period ? `${period.name} (${period.time})` : periodId;
                  }).join(', ') || 'N/A'}
                </td>
                <td>
                  <span className={`status-badge ${booking.status || 'unknown'}`}>
                    {booking.status || 'Unknown'}
                  </span>
                </td>
                <td>NPR {booking.totalPrice || 'N/A'}</td>
                <td>
                  {booking.status === 'pending' && (
                    <button 
                      className="cancel-button"
                      onClick={() => handleCancelBooking(booking._id)}
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">
          <p>You haven't made any bookings yet.</p>
          <Link to="/services" className="browse-button">
            Browse Services
          </Link>
        </div>
      )}
    </div>
  </>
)}
          </div>
        </div>
      </div>
    
  );
};

export default UserDashboard;