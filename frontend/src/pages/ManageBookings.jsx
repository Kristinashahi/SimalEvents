import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { getAuthData } from "../utils/auth-utils.js";
import { FaCalendarAlt, FaEye } from "react-icons/fa";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import "../styles/ManageBookings.css";

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { token } = getAuthData();
    if (token) {
      fetchBookings(token);
    } else {
      setError("Not authenticated. Please login again.");
      setLoading(false);
      navigate("/signin");
    }
  }, [navigate]);

  const fetchBookings = async (token) => {
    try {
      const response = await axios.get("http://localhost:4000/admin/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(response.data);
      setLoading(false);
    } catch (error) {
      setError("Failed to load bookings. " + (error.response?.data?.msg || error.message));
      setLoading(false);
    }
  };

  const sortBookings = (bookings, key, direction) => {
    return [...bookings].sort((a, b) => {
      if (key === "date") {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return direction === "asc" ? dateA - dateB : dateB - dateA;
      }
      if (key === "totalPrice") {
        const priceA = a.totalPrice || 0;
        const priceB = b.totalPrice || 0;
        return direction === "asc" ? priceA - priceB : priceB - priceA;
      }
      return 0;
    });
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
  };

  const filteredBookings = statusFilter === "all"
    ? bookings
    : bookings.filter((booking) => booking.status === statusFilter);

  const sortedBookings = sortBookings(filteredBookings, sortConfig.key, sortConfig.direction);

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status"></div>
        <p>Loading bookings...</p>
      </div>
    );
  }

  if (error) {
    return <div className="container mt-5 alert alert-danger">{error}</div>;
  }

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      

      {/* Main Content */}
      <div className="flex-grow-1">
        <div className="container-fluid p-4">
          <h2 className="mb-4">Manage Bookings</h2>

          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0"><FaCalendarAlt className="me-2" /> Confirmed & Paid Bookings</h5>
              <div>
                <select
                  className="form-select form-select-sm d-inline-block"
                  style={{ width: "150px" }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
            <div className="card-body">
              {sortedBookings.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Booking ID</th>
                        <th>Service Name</th>
                        <th>Vendor Name</th>
                        <th
                          style={{ cursor: "pointer" }}
                          onClick={() => handleSort("date")}
                        >
                          Date {sortConfig.key === "date" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                          style={{ cursor: "pointer" }}
                          onClick={() => handleSort("totalPrice")}
                        >
                          Total Amount {sortConfig.key === "totalPrice" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                        </th>
                        <th>Commission</th>
                        <th>Status</th>
                       
                      </tr>
                    </thead>
                    <tbody>
                      {sortedBookings.map((booking) => (
                        <tr key={booking._id}>
                          <td>{booking._id}</td>
                          <td>{booking.service?.name || "N/A"}</td>
                          <td>{booking.vendor?.vendorName || "N/A"}</td>
                          <td>{new Date(booking.date).toLocaleDateString()}</td>
                          <td>NPR {booking.totalPrice?.toLocaleString() || "N/A"}</td>
                          <td>NPR {booking.commission?.toLocaleString() || "N/A"}</td>
                          <td>
                            <span
                              className={`badge ${
                                booking.status === "paid" ? "bg-success" : "bg-info"
                              }`}
                            >
                              {booking.status}
                            </span>
                          </td>
                          
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">No confirmed or paid bookings found.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedBooking && (
  <Modal show={showModal} onHide={handleCloseModal}>
    <Modal.Header closeButton>
      <Modal.Title>Booking Details</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <div>
        <p><strong>Booking ID:</strong> {selectedBooking._id}</p>
        <p><strong>Service Name:</strong> {selectedBooking.service?.name || "N/A"}</p>
        ...
      </div>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={handleCloseModal}>
        Close
      </Button>
    </Modal.Footer>
  </Modal>
)}
    </div>
  );
};

export default ManageBookings;