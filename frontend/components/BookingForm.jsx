import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getAuthData } from "../src/utils/auth-utils.js";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const TIME_PERIODS = [
  { id: 'morning', name: 'Morning', time: '7:00 AM - 11:00 AM' },
  { id: 'day', name: 'Day', time: '12:00 PM - 4:00 PM' },
  { id: 'evening', name: 'Evening', time: '5:00 PM - 9:00 PM' }
];

const BookingForm = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPeriods, setSelectedPeriods] = useState([]);
  const [specialRequests, setSpecialRequests] = useState("");
  const [error, setError] = useState(null);
  const [bookedPeriods, setBookedPeriods] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [guestCount, setGuestCount] = useState(1);
  const [includeCatering, setIncludeCatering] = useState(false);

  const fetchService = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/services/${serviceId}`);
      
      if (!response.data) {
        throw new Error("Service not found");
      }
      
      setService({
        ...response.data,
        packages: response.data.packages || []
      });
      setError(null);
    } catch (err) {
      console.error("Error fetching service:", err);
      setError(err.response?.status === 404 
        ? "Service not found. It may have been removed."
        : "Failed to load service details. Please try again."
      );
      toast.error("Service not found");
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  const fetchBookedPeriods = useCallback(async () => {
    if (!selectedDate || !serviceId) return;
    
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await axios.get(
        `${API_BASE_URL}/api/bookings/availability/${serviceId}?date=${dateStr}`
      );
      setBookedPeriods(response.data?.bookedPeriods || []);
    } catch (err) {
      console.error("Error fetching booked periods:", err);
    }
  }, [selectedDate, serviceId]);

  useEffect(() => {
    fetchService();
  }, [fetchService]);

  useEffect(() => {
    fetchBookedPeriods();
  }, [fetchBookedPeriods]);

  const handlePeriodSelection = (periodId) => {
    setSelectedPeriods(prev => 
      prev.includes(periodId) 
        ? prev.filter(p => p !== periodId) 
        : [...prev, periodId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedPeriods.length === 0) {
      setError("Please select at least one time period");
      return;
    }
    
    if (includeCatering && !selectedPackage) {
      setError("Please select a catering package");
      return;
    }
  
    try {
      const { token } = getAuthData();
      await axios.post(
        `${API_BASE_URL}/api/bookings`,
        {
          serviceId,
          date: selectedDate,
          periods: selectedPeriods,
          specialRequests,
          package: includeCatering ? selectedPackage : null,
          guestCount: includeCatering ? guestCount : null
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
  
      toast.success("Booking created successfully!");
      navigate("/user-dashboard", { state: { activeTab: "bookings" } });
    } catch (err) {
      if (err.response?.status === 400) {
          const conflicts = err.response.data?.conflictingPeriods || [];
          setBookedPeriods(prev => [...new Set([...prev, ...conflicts])]);
          setSelectedPeriods(prev => prev.filter(p => !conflicts.includes(p)));
          setError(`These periods are now booked: ${
              conflicts.map(pid => {
                  const period = TIME_PERIODS.find(p => p.id === pid);
                  return period ? `${period.name} (${period.time})` : pid;
              }).join(', ')
          }`);
      } else {
        const errorMsg = err.response?.data?.message || "Failed to create booking";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    }
  };

  const calculateTotalPrice = () => {
    if (!service || !selectedPeriods.length) return 0;
    
    const basePrice = service.price * selectedPeriods.length;
    const cateringPrice = includeCatering && selectedPackage 
      ? selectedPackage.price * guestCount 
      : 0;
    
    return basePrice + cateringPrice;
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger text-center">
          {error}
          <button 
            className="btn btn-sm btn-primary ms-3"
            onClick={() => navigate("/services")}
          >
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container py-5">
        <div className="alert alert-info text-center">
          Service not found
          <button 
            className="btn btn-sm btn-primary ms-3"
            onClick={() => navigate("/services")}
          >
            Browse Services
          </button>
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
              <h3 className="mb-0">Book {service.name}</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <h5>Select Date</h5>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => {
                      setSelectedDate(date);
                      setSelectedPeriods([]);
                    }}
                    minDate={new Date()}
                    className="form-control"
                    required
                  />
                </div>

                <div className="mb-4">
                  <h5>Available Time Periods</h5>
                  <div className="row">
                    {TIME_PERIODS.map((period) => {
                      const isBooked = bookedPeriods.includes(period.id);
                      const isSelected = selectedPeriods.includes(period.id);
                      return (
                        <div key={period.id} className="col-md-4 mb-3">
                          <button
                            type="button"
                            className={`btn w-100 ${
                              isBooked ? "btn-secondary disabled" :
                              isSelected ? "btn-primary" : "btn-outline-primary"
                            }`}
                            onClick={() => !isBooked && handlePeriodSelection(period.id)}
                            disabled={isBooked}
                          >
                            <div>
                              <strong>{period.name}</strong>
                              <div className="small">{period.time}</div>
                              {isBooked && <span className="badge bg-danger mt-1">Booked</span>}
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {service.category === 'venue' && (
                  <>
                    <div className="mb-3">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="includeCatering"
                          checked={includeCatering}
                          onChange={() => {
                            setIncludeCatering(!includeCatering);
                            setSelectedPackage(null);
                          }}
                        />
                        <label className="form-check-label" htmlFor="includeCatering">
                          Include Catering Service
                        </label>
                      </div>
                    </div>

                    {includeCatering && (
                      <>
                        <div className="mb-3">
                          <label className="form-label">Number of Guests</label>
                          <input
                            type="number"
                            className="form-control"
                            value={guestCount}
                            onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value)))}
                            min="1"
                            required
                          />
                        </div>

                        {service.packages?.length > 0 && (
                          <div className="mb-4">
                            <h5>Catering Packages</h5>
                            <div className="row">
                              {service.packages.map((pkg) => {
                                const period = TIME_PERIODS.find(p => p.id === pkg.period);
                                const isSelected = selectedPackage?._id === pkg._id;
                                
                                return (
                                  <div 
                                    key={pkg._id} 
                                    className="col-md-4 mb-3"
                                    onClick={() => setSelectedPackage(isSelected ? null : pkg)}
                                  >
                                    <div 
                                      className={`card h-100 ${isSelected ? 'border-primary bg-light' : ''} cursor-pointer`}
                                    >
                                      <div className="card-body">
                                        <div className="d-flex justify-content-between">
                                          <h6>{pkg.name}</h6>
                                          {isSelected && <span className="badge bg-success">Selected</span>}
                                        </div>
                                        <p className="text-primary">NPR {pkg.price} per plate</p>
                                        {period && <p className="small">{period.name} ({period.time})</p>}
                                        
                                        {pkg.items?.length > 0 && (
                                          <div>
                                            <p className="small fw-bold">Includes:</p>
                                            <ul className="small">
                                              {pkg.items.map((item, i) => (
                                                <li key={i}>{item}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                <div className="mb-3">
                  <h5>Booking Summary</h5>
                  <div className="card bg-light p-3">
                    <div className="d-flex justify-content-between">
                      <span>Service:</span>
                      <span>{service.name} (NPR {service.price}/period)</span>
                    </div>
                    
                    <div className="d-flex justify-content-between">
                      <span>Selected periods ({selectedPeriods.length}):</span>
                      <span>NPR {service.price * selectedPeriods.length}</span>
                    </div>

                    {includeCatering && selectedPackage && (
                      <>
                        <div className="d-flex justify-content-between mt-2">
                          <span>Catering Package:</span>
                          <span>{selectedPackage.name}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>{guestCount} guests × NPR {selectedPackage.price}</span>
                          <span>NPR {selectedPackage.price * guestCount}</span>
                        </div>
                      </>
                    )}
                    
                    <hr />
                    <div className="d-flex justify-content-between fw-bold">
                      <span>Total:</span>
                      <span>NPR {calculateTotalPrice()}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="specialRequests" className="form-label">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    id="specialRequests"
                    className="form-control"
                    rows="3"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                  />
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <div className="d-grid gap-2">
                  <button type="submit" className="btn btn-primary btn-lg">
                    Confirm Booking
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;