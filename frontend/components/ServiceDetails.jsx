import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { getAuthData } from "../src/utils/auth-utils.js";
import { toast } from "react-hot-toast";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const ServiceDetails = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bookedPeriods, setBookedPeriods] = useState([]);
  const [isAlreadyBooked, setIsAlreadyBooked] = useState(false);

const nextImage = () => {
  setCurrentImageIndex((prevIndex) => 
    prevIndex === service.images.length - 1 ? 0 : prevIndex + 1
  );
};

const prevImage = () => {
  setCurrentImageIndex((prevIndex) => 
    prevIndex === 0 ? service.images.length - 1 : prevIndex - 1
  );
};

const TIME_PERIODS = [
  { id: 'morning', name: 'Morning', time: '7:00-11:00' },
  { id: 'day', name: 'Day', time: '12:00-4:00' },
  { id: 'evening', name: 'Evening', time: '5:00-9:00' }
];



  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        setLoading(true);
        const serviceRes = await axios.get(`${API_BASE_URL}/api/services/${id}`);
        setService(serviceRes.data);
        
        // Fetch vendor details
        if (serviceRes.data.vendor) {
          const vendorRes = await axios.get(`${API_BASE_URL}/users/${serviceRes.data.vendor._id}`);
          setVendor(vendorRes.data);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching service details:", err);
        setError(err.response?.data?.message || "Failed to load service details");
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [id]);

  const checkAvailability = async () => {
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }
  
    try {
      setIsCheckingAvailability(true);
      setIsAlreadyBooked(false);
      
      const response = await axios.get(
        `${API_BASE_URL}/api/bookings/availability/${id}`,
        { params: { date: selectedDate } }
      );
      
      // Get all booked periods for the selected date
      const bookedPeriodsForDate = response.data.bookedPeriods || [];
      setBookedPeriods(bookedPeriodsForDate);
      
      // Filter out already booked periods
      const availablePeriods = TIME_PERIODS.filter(period => 
        !bookedPeriodsForDate.includes(period.id)
      );
      
      setAvailableSlots(availablePeriods);
      
      // Clear any previously selected slots
      setSelectedSlots([]);
      
      if (availablePeriods.length === 0) {
        setIsAlreadyBooked(true);
        toast.error("All time periods are already booked for this date");
      }
    } catch (err) {
      console.error("Error checking availability:", err);
      toast.error("Failed to check availability");
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const toggleTimeSlot = (periodId) => {
    setSelectedSlots(prev => 
      prev.includes(periodId) 
        ? prev.filter(id => id !== periodId) 
        : [...prev, periodId]
    );
  };
  const handleBookNow = () => {
    if (selectedSlots.length === 0) {
      toast.error("Please select at least one time slot");
      return;
    }
    
    // Navigate to booking page with selected slots
    window.location.href = `/book/${id}?date=${selectedDate}&slots=${selectedSlots.join(",")}`;
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading service details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger">{error}</div>
        <Link to="/services" className="btn btn-primary">
          Back to Services
        </Link>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-warning">Service not found</div>
        <Link to="/services" className="btn btn-primary">
          Back to Services
        </Link>
      </div>
    );
  }

  return (
    <div className="service-details-page">
      <div className="container py-5">
        {/* Breadcrumb */}
        
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to="/">Home</Link>
            </li>
            <li className="breadcrumb-item">
              <Link to="/services">Services</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {service.name}
            </li>
          </ol>
        

        <div className="row">
          {/* Service Images */}
          <div className="col-lg-7">
          {service.images && service.images.length > 0 ? (
  <div className="custom-slider">
    <div className="slider-container">
      {service.images.map((image, index) => (
        <div 
          key={index}
          className={`slide ${index === currentImageIndex ? 'active' : ''}`}
        >
          <img
            src={`${API_BASE_URL}/${image}`}
            alt={`${service.name} - ${index + 1}`}
            className="img-fluid rounded"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/800x500?text=Image+Not+Available";
              e.target.onerror = null;
            }}
          />
        </div>
      ))}
    </div>
    
    <div className="slider-controls">
      <button className="slider-btn prev" onClick={prevImage}>
        &lt;
      </button>
      <div className="slider-dots">
        {service.images.map((_, index) => (
          <span 
            key={index}
            className={`dot ${index === currentImageIndex ? 'active' : ''}`}
            onClick={() => setCurrentImageIndex(index)}
          />
        ))}
      </div>
      <button className="slider-btn next" onClick={nextImage}>
        &gt;
      </button>
    </div>
  </div>
) : (
  <div className="no-images-placeholder">
    <img
      src="https://via.placeholder.com/800x500?text=No+Images+Available"
      alt="No images available"
      className="img-fluid rounded"
      style={{ 
        width: '100%',
        height: '500px',
        objectFit: 'cover'
      }}
    />
  </div>
)}
          </div>

          {/* Service Info */}
          <div className="col-lg-5">
            <div className="service-info-card card shadow-sm">
              <div className="card-body">
                <h1 className="service-title">{service.name}</h1>
                <div className="service-meta mb-3">
                  <span className="badge bg-primary me-2">
                    {service.category}
                  </span>
                  <span
                    className={`badge ${
                      service.isAvailable ? "bg-success" : "bg-danger"
                    }`}
                  >
                    {service.isAvailable ? "Available" : "Not Available"}
                  </span>
                </div>

                <div className="price-section mb-4">
                  <h2 className="price">
                    NPR {service.price.toLocaleString()}
                  </h2>
                  {service.duration && (
                    <span className="text-muted">
                      / {service.duration} hours
                    </span>
                  )}
                </div>

                {service.isAvailable && (
  <div className="booking-widget mb-4">
    <h5 className="mb-3">Check Availability</h5>
    <div className="row g-2">
      <div className="col-md-7">
        <input
          type="date"
          className="form-control"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setAvailableSlots([]);
            setSelectedSlots([]);
            setIsAlreadyBooked(false);
          }}
          min={new Date().toISOString().split("T")[0]}
        />
      </div>
      <div className="col-md-5">
        <button
          className="btn btn-primary w-100"
          onClick={checkAvailability}
          disabled={!selectedDate || isCheckingAvailability}
        >
          {isCheckingAvailability ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Checking...
            </>
          ) : (
            "Check"
          )}
        </button>
      </div>
    </div>

    {isAlreadyBooked && (
      <div className="alert alert-danger mt-3">
        All time periods are already booked for this date. Please choose another date.
      </div>
    )}

    {availableSlots.length > 0 && (
      <div className="time-slots mt-3">
        <h6>Available Time Periods:</h6>
        <div className="d-flex flex-wrap gap-2">
          {availableSlots.map((period) => (
            <button
              key={period.id}
              className={`btn btn-sm ${
                selectedSlots.includes(period.id)
                  ? "btn-primary"
                  : "btn-outline-primary"
              }`}
              onClick={() => toggleTimeSlot(period.id)}
              disabled={bookedPeriods.includes(period.id)}
            >
              {period.name} ({period.time})
            </button>
          ))}
        </div>
      </div>
    )}

    {selectedSlots.length > 0 && (
      <>
        <button
          className="btn btn-success w-100 mt-3"
          onClick={handleBookNow}
        >
          Book Now ({selectedSlots.length} period{selectedSlots.length !== 1 ? 's' : ''} selected)
        </button>
      </>
    )}
  </div>
)}


                <div className="service-highlights mb-4">
                  <h5>Highlights</h5>
                  <ul className="list-unstyled">
                    {service.category === "venue" && service.capacity && (
                      <li>
                        <i className="bi bi-people-fill me-2"></i>
                        Capacity: {service.capacity} people
                      </li>
                    )}
                    {service.category === "venue" && service.area && (
                      <li>
                        <i className="bi bi-square-fill me-2"></i>
                        Area: {service.area} sq.ft
                      </li>
                    )}
                    <li>
                      <i className="bi bi-check-circle-fill me-2"></i>
                      {service.isAvailable
                        ? "Available for booking"
                        : "Currently not available"}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="row mt-4">
          <div className="col-12">
            <ul className="nav nav-tabs" id="serviceTabs" role="tablist">
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === "details" ? "active" : ""}`}
                  onClick={() => setActiveTab("details")}
                >
                  Details
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === "vendor" ? "active" : ""}`}
                  onClick={() => setActiveTab("vendor")}
                >
                  Vendor Info
                </button>
              </li>
              {service.packages && service.packages.length > 0 && (
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === "packages" ? "active" : ""}`}
                    onClick={() => setActiveTab("packages")}
                  >
                    Packages
                  </button>
                </li>
              )}
            </ul>

            <div className="tab-content p-3 border border-top-0 rounded-bottom">
              {/* Details Tab */}
              <div
                className={`tab-pane fade ${
                  activeTab === "details" ? "show active" : ""
                }`}
              >
                <h4>Service Description</h4>
                <p className="lead">{service.description}</p>

                {service.features && service.features.length > 0 && (
  <div className="mb-4">
    <h5>Features:</h5>
    <div className="row">
      {service.features.map((feature, index) => (
        <div key={index} className="col-md-6 mb-2">
          <p>
            {feature.icon && (
              <i className={`${feature.icon} me-2`}></i>
            )}
            {feature.name}
          </p>
        </div>
      ))}
    </div>
  </div>
)}
              </div>

              {/* Vendor Tab */}
              <div
                className={`tab-pane fade ${
                  activeTab === "vendor" ? "show active" : ""
                }`}
              >
                {vendor ? (
                  <div className="vendor-profile">
                    <div className="row">
                      <div className="col-md-3">
                        <div className="vendor-avatar">
                          <img
                            src={
                              vendor.profilePicture
                                ? `${API_BASE_URL}/${vendor.profilePicture}`
                                : "https://via.placeholder.com/150?text=Vendor"
                            }
                            alt={vendor.businessName}
                            className="img-fluid rounded-circle"
                            style={{ width: "150px", height: "150px", objectFit: "cover" }}
                          />
                        </div>
                      </div>
                      <div className="col-md-9">
                        <h4>{vendor.businessName}</h4>
                        <p className="text-muted">{vendor.description}</p>

                        <div className="vendor-contact">
                          <h5>Contact Information</h5>
                          <ul className="list-unstyled">
                            <li>
                              <i className="bi bi-person-fill me-2"></i>
                              Contact Person: {vendor.name}
                            </li>
                            <li>
                              <i className="bi bi-envelope-fill me-2"></i>
                              Email: {vendor.email}
                            </li>
                            <li>
                              <i className="bi bi-telephone-fill me-2"></i>
                              Phone: {vendor.phoneNumber}
                            </li>
                            <li>
                              <i className="bi bi-geo-alt-fill me-2"></i>
                              Address: {vendor.address || "Not specified"}
                            </li>
                          </ul>
                        </div>

                        <div className="vendor-actions mt-3">
                          <button className="btn btn-outline-primary me-2">
                            <i className="bi bi-chat-left-text me-1"></i>
                            Message Vendor
                          </button>
                          <button className="btn btn-outline-secondary">
                            <i className="bi bi-star-fill me-1"></i>
                            View Reviews
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-warning">
                    Vendor information not available
                  </div>
                )}
              </div>

              {/* Packages Tab */}
              {service.packages && service.packages.length > 0 && (
                <div
                  className={`tab-pane fade ${
                    activeTab === "packages" ? "show active" : ""
                  }`}
                >
                  <div className="row">
                    {service.packages.map((pkg, index) => (
                      <div key={index} className="col-md-4 mb-4">
                        <div className="card h-100">
                          <div className="card-header bg-primary text-white">
                            <h5>{pkg.name}</h5>
                            <h3>NPR {pkg.price.toLocaleString()}</h3>
                          </div>
                          <div className="card-body">
                            <p>{pkg.description}</p>
                            <h6>Includes:</h6>
                            <ul>
                              {pkg.includes.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="card-footer">
                            <span
                              className={`badge ${
                                pkg.type === "veg"
                                  ? "bg-success"
                                  : pkg.type === "non-veg"
                                  ? "bg-danger"
                                  : "bg-secondary"
                              }`}
                            >
                              {pkg.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        
      </div>

      <style jsx>{`
        .service-details-page {
          background-color: #f8f9fa;
        }
        .service-info-card {
          position: sticky;
          top: 20px;
        }
        .service-title {
          font-weight: 700;
          color: #333;
        }
        .price-section {
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 5px;
        }
        .price {
          color: #dc3545;
          font-weight: 700;
          display: inline-block;
          margin-right: 10px;
        }
        .service-carousel {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .carousel-slide img {
          max-height: 500px;
          object-fit: cover;
        }
        .vendor-avatar {
          border: 3px solid #f8f9fa;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          width: fit-content;
        }
        .nav-tabs .nav-link.active {
          font-weight: 600;
          border-bottom: 3px solid #0d6efd;
        }
          .custom-slider {
  position: relative;
  width: 100%;
  height: 500px;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.slider-container {
  position: relative;
  height: 100%;
}

.slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.slide.active {
  opacity: 1;
}

.slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.slider-controls {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  z-index: 10;
}

.slider-btn {
  background: rgba(255, 255, 255, 0.7);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.slider-btn:hover {
  background: rgba(255, 255, 255, 0.9);
}

.slider-dots {
  display: flex;
  gap: 10px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s ease;
}

.dot.active {
  background: rgba(255, 255, 255, 0.9);
  transform: scale(1.2);
}
      `}</style>
    </div>
  );
};

export default ServiceDetails;