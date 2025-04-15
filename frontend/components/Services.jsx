import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { getAuthData } from "../src/utils/auth-utils.js";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const Services = () => {
  const [allServices, setAllServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [category, setCategory] = useState("venue");
  const [vendors, setVendors] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServicesAndVendors = async () => {
      try {
        setLoading(true);
        const servicesRes = await axios.get(`${API_BASE_URL}/api/services`);
        setAllServices(servicesRes.data);

        const vendorIds = [...new Set(servicesRes.data.map((s) => s.vendorId))];
        if (vendorIds.length > 0) {
          const vendorsRes = await axios.post(`${API_BASE_URL}/users/batch`, {
            ids: vendorIds,
          });

          const vendorsMap = {};
          vendorsRes.data.forEach((v) => {
            vendorsMap[v._id] = v;
          });
          setVendors(vendorsMap);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchServicesAndVendors();
  }, []);

  useEffect(() => {
    if (allServices.length > 0) {
      const filtered = allServices.filter(
        (service) => service.category === category
      );
      setFilteredServices(filtered);
    }
  }, [category, allServices]);
   

  const isServiceAvailableToday = (service) => {
    if (!service.isAvailable) return false;

    const today = new Date().toISOString().split("T")[0];

    if (service.availableDates && service.availableDates.length > 0) {
      if (!service.availableDates.includes(today)) return false;
    }

    if (service.blockedDates && service.blockedDates.includes(today)) return false;

    return true;
  };

  return (
    <div className="services-container">
      <h1 className="services-title">Our Services</h1>

      <div className="category-filter">
        {["venue", "decoration", "photography"].map((cat) => (
          <button
            key={cat}
            className={`filter-button ${category === cat ? "active" : ""}`}
            onClick={() => setCategory(cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      ) : (
        <>
          {filteredServices.length === 0 ? (
            <div className="no-services">
              No services available in this category yet.
            </div>
          ) : (
            <div className="services-grid">
              {filteredServices.map((service) => (
                <div key={service._id} className="service-card">
                  <div className="service-img-container">
                    {service.images && service.images.length > 0 ? (
                      <img
                        src={`${API_BASE_URL}/${service.images[0]}`}
                        className="service-img"
                        alt={service.name}
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/300";
                        }}
                      />
                    ) : (
                      <img
                        src="https://via.placeholder.com/300"
                        className="service-img"
                        alt={service.name}
                      />
                    )}
                  </div>
                  <div className="service-content">
                    <h2 className="service-title">{service.name}</h2>
                    <p className="service-description">{service.address}</p>
                    {vendors[service.vendorId] && (
                      <p className="service-vendor">
                        <strong>Provided by:</strong>{" "}
                        {vendors[service.vendorId].businessName}
                      </p>
                    )}
                    <p className="service-price">
                      <strong>Starting Price:</strong> NPR {service.price}
                    </p>
                    {service.capacity && (
                      <p className="service-capacity">
                        <strong>Capacity upto:</strong> {service.capacity} people
                      </p>
                    )}
                    {service.area && (
                      <p className="service-area">
                        <strong>Area:</strong> {service.area} sq.ft
                      </p>
                    )}
                    <div className="service-status">
                      {service.isAvailable ? (
                        <span className="status-available">Available</span>
                      ) : (
                        <span className="status-unavailable">Not Available</span>
                      )}
                    </div>
                  </div>
                  <div className="service-actions">
                  <Link to={`/serviceDetails/${service._id}`} className="btn btn-secondary">
  View Details
</Link>
                    <Link
                      to={`/book/${service._id}`}
                      className={`btn btn-primary ${
                        !isServiceAvailableToday(service) //? "disabled" : ""
                      }`}
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Services;