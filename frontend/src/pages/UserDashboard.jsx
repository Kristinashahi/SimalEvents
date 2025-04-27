// src/UserDashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { getAuthData, clearAuthData } from "../utils/auth-utils.js";
import { toast } from "react-hot-toast";
import "../styles/UserDashboard.css";
import {
  FiUser,
  FiLock,
  FiCalendar,
  FiLogOut,
  FiEdit,
  FiX,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const TIME_PERIODS = [
  { id: "morning", name: "Morning", time: "7:00 AM - 11:00 AM" },
  { id: "day", name: "Day", time: "12:00 PM - 4:00 PM" },
  { id: "evening", name: "Evening", time: "5:00 PM - 9:00 PM" },
];

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [userInfo, setUserInfo] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Set active tab from location state
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

    // Refetch bookings if refetchBookings is true
    if (location.state?.refetchBookings && token) {
      console.log("Refetching bookings due to payment success");
      fetchBookingHistory(token);
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
      const processedBookings = response.data.map((booking) => ({
        ...booking,
        service: booking.service || { _id: "", name: "Unknown Service" },
      }));
      console.log("Fetched bookings:", JSON.stringify(processedBookings));
      setBookings(processedBookings);
    } catch (error) {
      console.error("Error fetching booking history:", error);
      setBookings([]);
      toast.error("Failed to load booking history");
    }
  };

  const toggleShowPassword = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      toast.error("New passwords don't match");
      return;
    }

    try {
      const { token } = getAuthData();
      await axios.post(
        `${API_BASE_URL}/auth/change-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmNewPassword: passwordData.confirmNewPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Password updated successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setIsEditingPassword(false);

      clearAuthData();
      setTimeout(() => (window.location.href = "/signin"), 1500);
    } catch (error) {
      console.error("Password change error:", error);
      toast.error(error.response?.data?.msg || "Failed to update password");

      setPasswordData((prev) => ({
        currentPassword: "",
        newPassword: prev.newPassword,
        confirmNewPassword: prev.confirmNewPassword,
      }));
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      try {
        const { token } = getAuthData();
        await axios.put(
          `${API_BASE_URL}/api/bookings/${bookingId}/cancel`,
          { status: "cancelled" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await fetchBookingHistory(token);
        toast.success("Booking cancelled successfully");
      } catch (error) {
        toast.error(error.response?.data?.msg || "Failed to cancel booking");
      }
    }
  };

  const handlePayNow = async (booking) => {
    if (!booking._id || !booking.service._id || !booking.totalPrice) {
      toast.error("Invalid booking data");
      return;
    }

    try {
      const { token } = getAuthData();
      const response = await axios.post(
        `${API_BASE_URL}/api/bookings/initiate-payment`,
        {
          bookingId: booking._id,
          amount: booking.totalPrice,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.url) {
        console.log(`Redirecting to eSewa: ${response.data.url}`);
        window.location.href = response.data.url; // Redirect to eSewa payment page
      } else {
        toast.error("Failed to initiate payment");
      }
    } catch (error) {
      console.error("Error initiating eSewa payment:", error);
      toast.error(error.response?.data?.message || "Failed to initiate payment");
    }
  };

  const handleLogout = () => {
    clearAuthData();
    window.location.href = "/signin";
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error && !userInfo) {
    return <div className="dashboard-error">{error}</div>;
  }

  return (
    <div className="user-dashboard">
      <aside className="dashboard-sidebar">
        <div className="user-profile-summary">
          <div className="avatar">{userInfo?.name?.charAt(0) || "U"}</div>
          <h3>{userInfo?.name || "User"}</h3>
          <p>{userInfo?.email || "user@example.com"}</p>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <FiUser className="nav-icon" />
            <span>Profile</span>
          </button>
          <button
            className={`nav-item ${activeTab === "bookings" ? "active" : ""}`}
            onClick={() => setActiveTab("bookings")}
          >
            <FiCalendar className="nav-icon" />
            <span>Bookings</span>
          </button>
          <button className="nav-item logout" onClick={handleLogout}>
            <FiLogOut className="nav-icon" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <main className="dashboard-content">
        {activeTab === "profile" && userInfo && (
          <section className="profile-section">
            <div className="section-header">
              <h2>Profile Information</h2>
            </div>

            <div className="profile-details">
              <div className="detail-card">
                <h3>Personal Information</h3>
                <div className="detail-row">
                  <span className="detail-label">Full Name</span>
                  <span className="detail-value">{userInfo.name || "Not provided"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{userInfo.email}</span>
                </div>
              </div>

              <div className="detail-card">
                <div className="password-header">
                  <h3>Password & Security</h3>
                  {!isEditingPassword ? (
                    <button
                      className="edit-btn"
                      onClick={() => setIsEditingPassword(true)}
                    >
                      <FiEdit /> Change Password
                    </button>
                  ) : (
                    <button
                      className="cancel-btn"
                      onClick={() => {
                        setIsEditingPassword(false);
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmNewPassword: "",
                        });
                      }}
                    >
                      <FiX /> Cancel
                    </button>
                  )}
                </div>

                {isEditingPassword && (
                  <div className="password-form">
                    <div className="form-group">
                      <label>Current Password</label>
                      <div className="password-input-wrapper">
                        <input
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, currentPassword: e.target.value })
                          }
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => toggleShowPassword("current")}
                        >
                          {showPasswords.current ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>New Password</label>
                      <div className="password-input-wrapper">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, newPassword: e.target.value })
                          }
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => toggleShowPassword("new")}
                        >
                          {showPasswords.new ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <div className="password-input-wrapper">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmNewPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })
                          }
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => toggleShowPassword("confirm")}
                        >
                          {showPasswords.confirm ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                    </div>
                    <button
                      className="save-btn"
                      onClick={handlePasswordChange}
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === "bookings" && (
          <section className="bookings-section">
            <div className="section-header">
              <h2>Booking History</h2>
            </div>

            {bookings.length > 0 ? (
              <div className="bookings-table-container">
                <table className="bookings-table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Price</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking._id}>
                        <td>
                          {booking.service?._id ? (
                            <Link to={`/service/${booking.service._id}`}>
                              {booking.service?.name || "Unknown Service"}
                            </Link>
                          ) : (
                            <span>{booking.service?.name || "Unknown Service"}</span>
                          )}
                        </td>
                        <td>{booking.date ? new Date(booking.date).toLocaleDateString() : "N/A"}</td>
                        <td>
                          {booking.periods
                            ?.map((periodId) => {
                              const period = TIME_PERIODS.find((p) => p.id === periodId);
                              return period ? period.name : periodId;
                            })
                            .join(", ") || "N/A"}
                        </td>
                        <td>
                          <span className={`status-badge ${booking.status || "unknown"}`}>
                            {booking.status || "Unknown"}
                          </span>
                        </td>
                        <td>NPR {booking.totalPrice || "N/A"}</td>
                        <td>
  {booking.status === "pending" && (
    <button
      className="cancel-btn"
      onClick={() => handleCancelBooking(booking._id)}
    >
      Cancel
    </button>
  )}
  {booking.status === "confirmed" && booking.payment?.status === "pending" && (
    <button
      className="pay-btn"
      onClick={() => handlePayNow(booking)}
    >
      Pay Now
    </button>
  )}
  {(booking.status === "paid" || booking.payment?.status === "completed") && (
    <span className="paid-text">Paid</span>
  )}
</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <p>You haven't made any bookings yet.</p>
                <Link to="/services" className="primary-btn">
                  Browse Services
                </Link>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default UserDashboard;