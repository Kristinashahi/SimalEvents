import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getAuthData } from "../utils/auth-utils.js";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const BookService = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingData, setBookingData] = useState({
    date: new Date(),
    specialRequests: "",
    guests: 1,
  });
  const [availableDates, setAvailableDates] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        const { token, role } = getAuthData();
        
        // Check if user is logged in and has 'user' role
        if (!token || role !== "user") {
          navigate("/login", { state: { from: `/book/${serviceId}` } });
          return;
        }

        const serviceRes = await axios.get(`${API_BASE_URL}/api/services/${serviceId}`);
        setService(serviceRes.data);
        
        // Set available and blocked dates
        if (serviceRes.data.availableDates) {
          setAvailableDates(serviceRes.data.availableDates.map(date => new Date(date)));
        }
        if (serviceRes.data.blockedDates) {
          setBlockedDates(serviceRes.data.blockedDates.map(date => new Date(date)));
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load service details");
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [serviceId, navigate]);

  const handleDateChange = (date) => {
    setBookingData({ ...bookingData, date });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData({ ...bookingData, [name]: value });
  };

  const isDateDisabled = (date) => {
    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    
    // Check if date is blocked
    if (blockedDates.some(blockedDate => blockedDate.getTime() === date.getTime())) {
      return true;
    }
    
    // If service has specific available dates, check if selected date is among them
    if (availableDates.length > 0) {
      return !availableDates.some(availableDate => availableDate.getTime() === date.getTime());
    }
    
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const { token } = getAuthData();
      
      const response = await axios.post(
        `${API_BASE_URL}/api/bookings`,
        {
          serviceId,
          date: bookingData.date.toISOString().split('T')[0],
          specialRequests: bookingData.specialRequests,
          guests: bookingData.guests,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      navigate("/dashboard", { state: { bookingSuccess: true } });
    } catch (err) {
      setError(err.response?.data?.message || "Booking failed. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container py-5">
        <div className="alert alert-info">Service not found</div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h2 className="mb-0">Book Service: {service.name}</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Service</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={service.name} 
                    readOnly 
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Price</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={`NPR ${service.price}`} 
                    readOnly 
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Booking Date</label>
                  <DatePicker
                    selected={bookingData.date}
                    onChange={handleDateChange}
                    minDate={new Date()}
                    filterDate={isDateDisabled}
                    className="form-control"
                    required
                  />
                  {availableDates.length > 0 && (
                    <small className="text-muted">
                      Available dates only: {availableDates.map(d => d.toLocaleDateString()).join(", ")}
                    </small>
                  )}
                </div>
                
                {service.category === "venue" && (
                  <div className="mb-3">
                    <label className="form-label">Number of Guests</label>
                    <input
                      type="number"
                      name="guests"
                      min="1"
                      max={service.capacity || 1000}
                      className="form-control"
                      value={bookingData.guests}
                      onChange={handleInputChange}
                      required
                    />
                    {service.capacity && (
                      <small className="text-muted">
                        Maximum capacity: {service.capacity} guests
                      </small>
                    )}
                  </div>
                )}
                
                <div className="mb-3">
                  <label className="form-label">Special Requests</label>
                  <textarea
                    name="specialRequests"
                    className="form-control"
                    rows="3"
                    value={bookingData.specialRequests}
                    onChange={handleInputChange}
                  />
                </div>
                
                {error && <div className="alert alert-danger mb-3">{error}</div>}
                
                <button type="submit" className="btn btn-primary w-100">
                  Confirm Booking
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookService;