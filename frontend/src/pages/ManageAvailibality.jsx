import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { getAuthData } from "../utils/auth-utils.js";
import { toast } from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const ManageAvailability = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState(null);
  const [availability, setAvailability] = useState({
    isAvailable: true,
    availableDates: [],
    blockedDates: []
  });
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedAction, setSelectedAction] = useState("available");

  useEffect(() => {
    const fetchServiceAvailability = async () => {
      try {
        const authData = getAuthData();
        if (!authData || !authData.token) {
          navigate("/login");
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/services/${serviceId}`, {
          headers: {
            Authorization: `Bearer ${authData.token}`
          }
        });

        if (response.data) {
          setService(response.data);
          setAvailability({
            isAvailable: response.data.isAvailable ?? true,
            availableDates: response.data.availableDates || [],
            blockedDates: response.data.blockedDates || []
          });
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching service availability:", error);
        toast.error("Failed to fetch service availability");
        navigate("/vendordashboard");
      }
    };

    fetchServiceAvailability();
  }, [serviceId, navigate]);

  const handleAvailabilityChange = (e) => {
    setAvailability({
      ...availability,
      isAvailable: e.target.checked
    });
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleActionChange = (e) => {
    setSelectedAction(e.target.value);
  };

  const addDate = () => {
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    if (selectedAction === "available") {
      // Check if date is already in available dates
      if (availability.availableDates.includes(selectedDate)) {
        toast.error("This date is already marked as available");
        return;
      }
      
      // Remove from blocked dates if it exists there
      const updatedBlockedDates = availability.blockedDates.filter(
        date => date !== selectedDate
      );
      
      setAvailability({
        ...availability,
        availableDates: [...availability.availableDates, selectedDate],
        blockedDates: updatedBlockedDates
      });
    } else {
      // Check if date is already in blocked dates
      if (availability.blockedDates.includes(selectedDate)) {
        toast.error("This date is already marked as blocked");
        return;
      }
      
      // Remove from available dates if it exists there
      const updatedAvailableDates = availability.availableDates.filter(
        date => date !== selectedDate
      );
      
      setAvailability({
        ...availability,
        availableDates: updatedAvailableDates,
        blockedDates: [...availability.blockedDates, selectedDate]
      });
    }
    
    setSelectedDate("");
  };

  const removeDate = (date, type) => {
    if (type === "available") {
      setAvailability({
        ...availability,
        availableDates: availability.availableDates.filter(d => d !== date)
      });
    } else {
      setAvailability({
        ...availability,
        blockedDates: availability.blockedDates.filter(d => d !== date)
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const authData = getAuthData();
      if (!authData || !authData.token) {
        navigate("/login");
        return;
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/services/${serviceId}/availability`,
        availability,
        {
          headers: {
            Authorization: `Bearer ${authData.token}`
          }
        }
      );

      toast.success("Availability updated successfully!");
      navigate("/vendordashboard");
    } catch (error) {
      console.error("Error updating availability:", error);
      toast.error(error.response?.data?.message || "Failed to update availability");
    }
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Manage Availability for {service?.name}</h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="isAvailable"
                    checked={availability.isAvailable}
                    onChange={handleAvailabilityChange}
                  />
                  <label className="form-check-label" htmlFor="isAvailable">Service is Generally Available</label>
                  <small className="text-muted d-block">
                    Toggle this to quickly mark your service as unavailable for all dates.
                  </small>
                </div>

                <div className="card mb-4">
                  <div className="card-header">
                    Add Specific Date Availability
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="selectedDate" className="form-label">Select Date</label>
                          <input
                            type="date"
                            className="form-control"
                            id="selectedDate"
                            value={selectedDate}
                            onChange={handleDateChange}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="selectedAction" className="form-label">Mark as</label>
                          <select
                            className="form-select"
                            id="selectedAction"
                            value={selectedAction}
                            onChange={handleActionChange}
                          >
                            <option value="available">Available</option>
                            <option value="blocked">Blocked</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={addDate}
                    >
                      Add Date
                    </button>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="card mb-3">
                      <div className="card-header bg-success text-white">
                        Available Dates
                      </div>
                      <div className="card-body">
                        {availability.availableDates.length === 0 ? (
                          <p className="text-muted">No specific available dates added</p>
                        ) : (
                          <ul className="list-group">
                            {availability.availableDates.sort().map(date => (
                              <li key={date} className="list-group-item d-flex justify-content-between align-items-center">
                                {new Date(date).toLocaleDateString()}
                                <button 
                                  type="button" 
                                  className="btn btn-sm btn-danger"
                                  onClick={() => removeDate(date, "available")}
                                >
                                  Remove
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card mb-3">
                      <div className="card-header bg-danger text-white">
                        Blocked Dates
                      </div>
                      <div className="card-body">
                        {availability.blockedDates.length === 0 ? (
                          <p className="text-muted">No specific blocked dates added</p>
                        ) : (
                          <ul className="list-group">
                            {availability.blockedDates.sort().map(date => (
                              <li key={date} className="list-group-item d-flex justify-content-between align-items-center">
                                {new Date(date).toLocaleDateString()}
                                <button 
                                  type="button" 
                                  className="btn btn-sm btn-danger"
                                  onClick={() => removeDate(date, "blocked")}
                                >
                                  Remove
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-between mt-3">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => navigate("/vendordashboard")}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAvailability;