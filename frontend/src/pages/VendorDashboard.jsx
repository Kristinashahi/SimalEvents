import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { getAuthData, clearAuthData } from "../utils/auth-utils.js";
import { toast } from "react-hot-toast";
import { FiUser, FiCalendar, FiLogOut, FiEdit, FiTrash2, FiCheck, FiX, FiImage, FiDollarSign, FiClock, FiUsers, FiHome } from "react-icons/fi";
import "../styles/VendorDashboard.css";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const FEATURE_OPTIONS = {
  venue: [
    { name: "Parking", icon: "fas fa-parking" },
    { name: "Catering", icon: "fas fa-utensils" },
    { name: "Audio/Visual", icon: "fas fa-tv" },
    { name: "WiFi", icon: "fas fa-wifi" },
    { name: "Outdoor Space", icon: "fas fa-tree" },
    { name: "Wheelchair Access", icon: "fas fa-wheelchair" },
  ],
  decoration: [
    { name: "Flowers", icon: "fas fa-spa" },
    { name: "Lighting", icon: "fas fa-lightbulb" },
    { name: "Table Settings", icon: "fas fa-utensils" },
  ],
  photography: [
    { name: "Portrait", icon: "fas fa-user" },
    { name: "Event", icon: "fas fa-calendar-alt" },
    { name: "Aerial", icon: "fas fa-drone" },
    { name: "Editing", icon: "fas fa-edit" },
  ],
};

const TIME_PERIODS = [
  { id: "morning", name: "Morning", time: "7:00 AM - 11:00 AM" },
  { id: "day", name: "Day", time: "12:00 PM - 4:00 PM" },
  { id: "evening", name: "Evening", time: "5:00 PM - 9:00 PM" },
];

const VendorDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("service");
  const [userInfo, setUserInfo] = useState(null);
  const [service, setService] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
    category: "",
    price: "",
    duration: "",
    capacity: "",
    area: "",
    isAvailable: true,
    images: [],
    features: [],
    hasCatering: false,
    cateringPackages: [],
  });
  const [newImages, setNewImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [showCateringModal, setShowCateringModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [khaltiMerchantId, setKhaltiMerchantId] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { token } = getAuthData();
        if (!token) {
          navigate("/signin");
          return;
        }

        // Fetch vendor profile
        const userRes = await axios.get(`${API_BASE_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserInfo(userRes.data);
        setKhaltiMerchantId(userRes.data.khaltiMerchantId || "");

        // Fetch vendor's service
        const serviceRes = await axios.get(`${API_BASE_URL}/api/services/my-service`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (serviceRes.data) {
          setService(serviceRes.data);
          setFormData({
            name: serviceRes.data.name || "",
            address: serviceRes.data.address || "",
            description: serviceRes.data.description || "",
            category: serviceRes.data.category || "",
            price: serviceRes.data.price || "",
            duration: serviceRes.data.duration || "",
            capacity: serviceRes.data.capacity || "",
            area: serviceRes.data.area || "",
            isAvailable: serviceRes.data.isAvailable !== false,
            images: serviceRes.data.images || [],
            features: serviceRes.data.features || [],
            hasCatering: serviceRes.data.hasCatering || false,
            cateringPackages: serviceRes.data.cateringPackages || [],
          });
        }

        await fetchVendorBookings(token);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.response?.status === 401) {
          toast.error("Session expired. Please sign in again.");
          navigate("/signin");
        } else {
          toast.error(error.response?.data?.msg || "Failed to load dashboard data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const fetchVendorBookings = async (token) => {
    try {
      setBookingLoading(true);
      setBookingError(null);
      const response = await axios.get(`${API_BASE_URL}/api/bookings/vendor`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const processedBookings = response.data.map((booking) => ({
        ...booking,
        user: booking.user || { name: "Unknown User" },
        service: booking.service || { name: "Unknown Service" },
      }));

      setBookings(processedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookingError(error.response?.data?.msg || "Failed to load bookings");
      toast.error("Failed to load bookings");
    } finally {
      setBookingLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      const { token } = getAuthData();
      await axios.put(
        `${API_BASE_URL}/api/bookings/${bookingId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchVendorBookings(token);
      toast.success(`Booking ${status} successfully`);
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error(error.response?.data?.msg || "Failed to update booking status");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: null });
    }
  };

  const handleFeatureToggle = (feature) => {
    setFormData((prev) => {
      const existingIndex = prev.features?.findIndex((f) => f.name === feature.name) ?? -1;
      if (existingIndex >= 0) {
        return {
          ...prev,
          features: prev.features.filter((_, index) => index !== existingIndex),
        };
      } else {
        return {
          ...prev,
          features: [...(prev.features || []), feature],
        };
      }
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setNewImages(files);

    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleDeleteImage = (imageUrl) => {
    if (window.confirm("Are you sure you want to delete this image?")) {
      if (imageUrl.includes(API_BASE_URL)) {
        const relativePath = imageUrl.replace(`${API_BASE_URL}/`, "");
        setImagesToDelete([...imagesToDelete, relativePath]);
      }

      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img !== imageUrl && !img.includes(imageUrl.replace(`${API_BASE_URL}/`, ""))),
      }));

      setImagePreviews((prev) => prev.filter((preview) => preview !== imageUrl));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.address.trim()) errors.address = "Address is required";
    if (!formData.description.trim()) errors.description = "Description is required";
    if (!formData.price || isNaN(formData.price) || formData.price <= 0) errors.price = "Valid price is required";
    if (!formData.duration || isNaN(formData.duration) || formData.duration <= 0) errors.duration = "Valid duration is required";
    if (formData.category === "venue" && (!formData.capacity || isNaN(formData.capacity) || formData.capacity <= 0)) {
      errors.capacity = "Valid capacity is required";
    }

    if (formData.hasCatering) {
      formData.cateringPackages.forEach((pkg, index) => {
        if (!pkg.name?.trim()) {
          errors[`package-${index}-name`] = "Package name is required";
        }
        if (!pkg.basePrice || pkg.basePrice <= 0) {
          errors[`package-${index}-price`] = "Package price must be greater than 0";
        }
      });
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix form errors");
      return;
    }

    try {
      const { token } = getAuthData();

      // Delete requested images
      if (imagesToDelete.length > 0) {
        await axios.put(
          `${API_BASE_URL}/api/services/${service._id}/images`,
          { imageUrlsToDelete: imagesToDelete },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      const formDataToSend = new FormData();

      // Append all form data
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "images") {
          if (key === "features" || key === "cateringPackages") {
            formDataToSend.append(key, JSON.stringify(value));
          } else {
            formDataToSend.append(key, value);
          }
        }
      });

      // Append existing images that weren't deleted
      formData.images
        .filter((img) => typeof img === "string" && !imagesToDelete.includes(img.replace(`${API_BASE_URL}/`, "")))
        .forEach((img) => formDataToSend.append("existingImages", img));

      // Append new images
      newImages.forEach((image) => {
        formDataToSend.append("images", image);
      });

      const response = await axios.put(
        `${API_BASE_URL}/api/services/${service._id}`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Service updated successfully");
      setService(response.data);
      setEditMode(false);
      setNewImages([]);
      setImagePreviews([]);
      setImagesToDelete([]);
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error(error.response?.data?.msg || "Failed to update service");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      const { token } = getAuthData();
      await axios.delete(`${API_BASE_URL}/api/services/${service._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Service deleted successfully");
      setService(null);
      setFormData({
        name: "",
        address: "",
        description: "",
        category: "",
        price: "",
        duration: "",
        capacity: "",
        area: "",
        isAvailable: true,
        images: [],
        features: [],
        hasCatering: false,
        cateringPackages: [],
      });
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error(error.response?.data?.msg || "Failed to delete service");
    }
  };

  const handleUpdateMerchantId = async () => {
    if (!khaltiMerchantId) {
      toast.error("Please enter a Khalti merchant ID");
      return;
    }
    try {
      const { token } = getAuthData();
      await axios.put(
        `${API_BASE_URL}/auth/profile`,
        { khaltiMerchantId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Khalti merchant ID updated successfully");
      setUserInfo({ ...userInfo, khaltiMerchantId });
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to update merchant ID");
    }
  };

  const handleViewCateringDetails = (booking) => {
    setSelectedBooking(booking);
    setShowCateringModal(true);
  };

  const renderServiceForm = () => {
    return (
      <form onSubmit={handleSubmit} className="service-form">
        <div className="form-group">
          <label>Service Name *</label>
          <input
            type="text"
            name="name"
            className={formErrors.name ? "error" : ""}
            value={formData.name}
            onChange={handleChange}
            required
          />
          {formErrors.name && <span className="error-message">{formErrors.name}</span>}
        </div>

        <div className="form-group">
          <label>Address *</label>
          <input
            type="text"
            name="address"
            className={formErrors.address ? "error" : ""}
            value={formData.address}
            onChange={handleChange}
            required
          />
          {formErrors.address && <span className="error-message">{formErrors.address}</span>}
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea
            name="description"
            className={formErrors.description ? "error" : ""}
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
          />
          {formErrors.description && <span className="error-message">{formErrors.description}</span>}
        </div>

        <div className="form-group">
          <label>Category *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select Category</option>
            <option value="venue">Venue</option>
            <option value="decoration">Decoration</option>
            <option value="photography">Photography</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Price (NPR) *</label>
            <input
              type="number"
              name="price"
              className={formErrors.price ? "error" : ""}
              value={formData.price}
              onChange={handleChange}
              required
            />
            {formErrors.price && <span className="error-message">{formErrors.price}</span>}
          </div>

          <div className="form-group">
            <label>Duration (hours) *</label>
            <input
              type="number"
              name="duration"
              className={formErrors.duration ? "error" : ""}
              value={formData.duration}
              onChange={handleChange}
              step="0.5"
              min="0.5"
              required
            />
            {formErrors.duration && <span className="error-message">{formErrors.duration}</span>}
          </div>
        </div>

        {formData.category === "venue" && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Capacity (people) *</label>
                <input
                  type="number"
                  name="capacity"
                  className={formErrors.capacity ? "error" : ""}
                  value={formData.capacity}
                  onChange={handleChange}
                  min="1"
                  required
                />
                {formErrors.capacity && <span className="error-message">{formErrors.capacity}</span>}
              </div>

              <div className="form-group">
                <label>Area (sq.ft)</label>
                <input
                  type="number"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                />
              </div>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="hasCatering"
                checked={formData.hasCatering}
                onChange={() => setFormData({ ...formData, hasCatering: !formData.hasCatering })}
              />
              <label className="form-check-label" htmlFor="hasCatering">
                Offer Catering Services
              </label>
            </div>
          </>
        )}

        {formData.hasCatering && formData.category === "venue" && (
          <div className="catering-section">
            <h4>Catering Packages</h4>
            {formData.cateringPackages.map((pkg, index) => (
              <div key={index} className="card mb-4">
                <div className="card-header bg-light">
                  <h5>{pkg.name || `Package ${index + 1}`}</h5>
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label>Package Name *</label>
                      <input
                        type="text"
                        className={`form-control ${formErrors[`package-${index}-name`] ? "is-invalid" : ""}`}
                        value={pkg.name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cateringPackages: formData.cateringPackages.map((p, i) =>
                              i === index ? { ...p, name: e.target.value } : p
                            ),
                          })
                        }
                      />
                      {formErrors[`package-${index}-name`] && (
                        <div className="invalid-feedback">{formErrors[`package-${index}-name`]}</div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label>Base Price Per Plate (NPR) *</label>
                      <input
                        type="number"
                        className={`form-control ${formErrors[`package-${index}-price`] ? "is-invalid" : ""}`}
                        value={pkg.basePrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cateringPackages: formData.cateringPackages.map((p, i) =>
                              i === index ? { ...p, basePrice: parseFloat(e.target.value) || 0 } : p
                            ),
                          })
                        }
                        min="0"
                        step="0.01"
                      />
                      {formErrors[`package-${index}-price`] && (
                        <div className="invalid-feedback">{formErrors[`package-${index}-price`]}</div>
                      )}
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label>Minimum Guests</label>
                      <input
                        type="number"
                        className="form-control"
                        value={pkg.minGuests}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cateringPackages: formData.cateringPackages.map((p, i) =>
                              i === index ? { ...p, minGuests: parseInt(e.target.value) || 0 } : p
                            ),
                          })
                        }
                        min="1"
                      />
                    </div>
                    <div className="col-md-6">
                      <label>Maximum Guests</label>
                      <input
                        type="number"
                        className="form-control"
                        value={pkg.maxGuests}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cateringPackages: formData.cateringPackages.map((p, i) =>
                              i === index ? { ...p, maxGuests: parseInt(e.target.value) || 0 } : p
                            ),
                          })
                        }
                        min={pkg.minGuests || 1}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label>Package Description</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={pkg.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cateringPackages: formData.cateringPackages.map((p, i) =>
                            i === index ? { ...p, description: e.target.value } : p
                          ),
                        })
                      }
                    />
                  </div>

                  {pkg.menuSections?.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="mb-4">
                      <h6>{section.name}</h6>
                      {section.items.map((itemGroup, groupIndex) => (
                        <div key={groupIndex} className="mb-2">
                          <p className="fst-italic">{itemGroup.title}</p>
                          <ul className="list-group">
                            {itemGroup.items.map((item, itemIndex) => (
                              <li key={itemIndex} className="list-group-item">
                                {item.name || item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="form-group">
          <label>Features</label>
          <div className="features-grid">
            {formData.category &&
              FEATURE_OPTIONS[formData.category]?.map((feature) => (
                <button
                  key={feature.name}
                  type="button"
                  className={`feature-btn ${formData.features?.some((f) => f.name === feature.name) ? "active" : ""}`}
                  onClick={() => handleFeatureToggle(feature)}
                >
                  <i className={feature.icon}></i>
                  <span>{feature.name}</span>
                </button>
              ))}
          </div>
        </div>

        <div className="form-group">
          <label>Service Images</label>
          <div className="file-upload">
            <label>
              <FiImage />
              <span>Upload Images</span>
              <input
                type="file"
                onChange={handleImageChange}
                multiple
                accept="image/*"
              />
            </label>
            <small>Upload additional images (5MB max per image)</small>
          </div>

          <div className="image-previews">
            {formData.images
              .filter((img) => typeof img === "string")
              .map((image, index) => (
                <div key={`existing-${index}`} className="image-preview">
                  <img
                    src={`${API_BASE_URL}/${image}`}
                    alt={`Service ${index}`}
                  />
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => handleDeleteImage(`${API_BASE_URL}/${image}`)}
                  >
                    <FiX />
                  </button>
                </div>
              ))}

            {imagePreviews.map((preview, index) => (
              <div key={`new-${index}`} className="image-preview">
                <img
                  src={preview}
                  alt={`New preview ${index}`}
                />
                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => handleDeleteImage(preview)}
                >
                  <FiX />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-switch">
          <label>
            <input
              type="checkbox"
              id="isAvailable"
              checked={formData.isAvailable}
              onChange={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })}
            />
            <span className="slider"></span>
            <span className="label-text">Service is available for booking</span>
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="primary-btn">
            Save Changes
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => {
              setEditMode(false);
              setImagePreviews([]);
              setImagesToDelete([]);
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  };

  const renderServiceDetails = () => {
    return (
      <div className="service-details">
        <div className="service-header">
          <h2>{service.name}</h2>
          <div className="service-status">
            <span className={`status-badge ${service.isAvailable ? "available" : "unavailable"}`}>
              {service.isAvailable ? "Available" : "Not Available"}
            </span>
          </div>
        </div>

        <p className="service-description">{service.description}</p>

        {service.images?.length > 0 && (
          <div className="service-gallery">
            {service.images.map((image, index) => (
              <div key={index} className="gallery-item">
                <img
                  src={`${API_BASE_URL}/${image}`}
                  alt={`Service ${index}`}
                />
              </div>
            ))}
          </div>
        )}

        <div className="service-info-grid">
          <div className="info-item">
            <span className="info-label">Category</span>
            <span className="info-value">{service.category}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Price</span>
            <span className="info-value">NPR {service.price}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Duration</span>
            <span className="info-value">{service.duration} hours</span>
          </div>

          {service.category === "venue" && (
            <>
              <div className="info-item">
                <span className="info-label">Capacity</span>
                <span className="info-value">{service.capacity} people</span>
              </div>
              <div className="info-item">
                <span className="info-label">Area</span>
                <span className="info-value">{service.area} sq.ft</span>
              </div>
            </>
          )}
        </div>

        {service.hasCatering && service.cateringPackages?.length > 0 && (
          <div className="packages-section">
            <h3>Catering Packages</h3>
            <div className="packages-grid">
              {service.cateringPackages.map((pkg, index) => (
                <div key={index} className="package-card">
                  <div className="package-header">
                    <h4>{pkg.name}</h4>
                  </div>
                  <div className="package-price">
                    <span>NPR {pkg.basePrice} per plate</span>
                  </div>

                  {pkg.description && (
                    <p className="package-description">{pkg.description}</p>
                  )}

                  <div className="package-guests">
                    <FiUsers />
                    <span>
                      {pkg.minGuests}-{pkg.maxGuests} people
                    </span>
                  </div>

                  {pkg.menuSections?.length > 0 && (
                    <div className="package-items">
                      {pkg.menuSections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="mb-3">
                          <h5>{section.name}</h5>
                          {section.items.map((itemGroup, groupIndex) => (
                            <div key={groupIndex}>
                              <p className="fst-italic">{itemGroup.title}</p>
                              <ul>
                                {itemGroup.items.map((item, itemIndex) => (
                                  <li key={itemIndex}>{item.name || item}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {service.features?.length > 0 && (
          <div className="features-section">
            <h3>Features</h3>
            <div className="features-grid">
              {service.features.map((feature, index) => (
                <div key={index} className="feature-item">
                  <span className="feature-icon">
                    <i className={FEATURE_OPTIONS[service.category]?.find((f) => f.name === feature.name)?.icon || "fas fa-check"}></i>
                  </span>
                  <span>{feature.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="service-actions">
          <button
            className="primary-btn"
            onClick={() => setEditMode(true)}
          >
            <FiEdit /> Edit Service
          </button>
          <button
            className="danger-btn"
            onClick={handleDelete}
          >
            <FiTrash2 /> Delete Service
          </button>
        </div>
      </div>
    );
  };

  const renderCateringModal = () => {
    if (!showCateringModal || !selectedBooking) return null;

    if (!selectedBooking.cateringPackage) {
      return (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Catering Details</h3>
              <button className="close-btn" onClick={() => setShowCateringModal(false)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <p>No catering package associated with this booking.</p>
            </div>
            <div className="modal-footer">
              <button className="primary-btn" onClick={() => setShowCateringModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      );
    }

    const cateringPackage = service?.cateringPackages?.find(
      (pkg) => pkg._id === selectedBooking.cateringPackage.packageId
    );

    if (!cateringPackage) {
      return (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Catering Details</h3>
              <button className="close-btn" onClick={() => setShowCateringModal(false)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <p>Catering package not found.</p>
            </div>
            <div className="modal-footer">
              <button className="primary-btn" onClick={() => setShowCateringModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      );
    }

    const selectedItems = selectedBooking.cateringPackage.selectedItems || [];
    const menuItems = selectedItems.map((item) => {
      let itemName = "Unknown Item";
      const includedItem = cateringPackage.includedItems?.find((i) => i.menuItemId === item.menuItemId);
      const optionalItem = cateringPackage.optionalItems?.find((i) => i.menuItemId === item.menuItemId);

      if (includedItem || optionalItem) {
        const menuItem = service?.cateringMenu?.find((mi) => mi._id === item.menuItemId);
        itemName = menuItem ? menuItem.name : item.menuItemId;
      } else {
        cateringPackage.menuSections?.forEach((section) => {
          section.items.forEach((itemGroup) => {
            const foundItem = itemGroup.items.find((i) => i.menuItemId === item.menuItemId);
            if (foundItem) {
              itemName = foundItem.name || foundItem;
            }
          });
        });
      }

      return {
        name: itemName,
        quantity: item.quantity,
        isOptional: item.isOptional,
        isSectionItem: item.isSectionItem,
      };
    });

    return (
      <div className="modal-backdrop">
        <div className="modal">
          <div className="modal-header">
            <h3>Catering Details - {cateringPackage.name}</h3>
            <button className="close-btn" onClick={() => setShowCateringModal(false)}>
              <FiX />
            </button>
          </div>
          <div className="modal-body">
            <p><strong>Guest Count:</strong> {selectedBooking.cateringPackage.guestCount}</p>
            <h5>Selected Menu Items:</h5>
            {menuItems.length > 0 ? (
              <ul className="menu-items-list">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    {item.name} (x{item.quantity})
                    {item.isOptional && " (Optional)"}
                    {item.isSectionItem && " (Menu Section)"}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No menu items selected.</p>
            )}
          </div>
          <div className="modal-footer">
            <button className="primary-btn" onClick={() => setShowCateringModal(false)}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderBookings = () => {
    return (
      <div className="bookings-section">
        <div className="section-header">
          <h2>Bookings</h2>
          <button
            className="refresh-btn"
            onClick={() => fetchVendorBookings(getAuthData().token)}
          >
            Refresh
          </button>
        </div>

        {bookingLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading bookings...</p>
          </div>
        ) : bookingError ? (
          <div className="error-state">
            <p>{bookingError}</p>
            <button
              className="primary-btn"
              onClick={() => fetchVendorBookings(getAuthData().token)}
            >
              Retry
            </button>
          </div>
        ) : bookings.length > 0 ? (
          <div className="bookings-table">
            <div className="table-header">
              <div>Customer</div>
              <div>Service</div>
              <div>Date</div>
              <div>Time Periods</div>
              <div>Packages</div>
              <div>Guests</div>
              <div>Status</div>
              <div>Payment Status</div>
              <div>Total Price</div>
              <div>Actions</div>
            </div>

            {bookings.map((booking) => {
              const cateringPackage = booking.cateringPackage?.packageId
                ? service?.cateringPackages?.find((pkg) => pkg._id === booking.cateringPackage.packageId)
                : null;

              return (
                <div key={booking._id} className="booking-row">
                  <div>{booking.user?.name || "N/A"}</div>
                  <div>{booking.service?.name || "N/A"}</div>
                  <div>{new Date(booking.date).toLocaleDateString()}</div>
                  <div>
                    {booking.periods
                      ?.map((periodId) => {
                        const period = TIME_PERIODS.find((p) => p.id === periodId);
                        return period ? `${period.name} (${period.time})` : periodId;
                      })
                      .join(", ") || "N/A"}
                  </div>
                  <div>
                    {cateringPackage ? (
                      <button
                        className="catering-link"
                        onClick={() => handleViewCateringDetails(booking)}
                      >
                        {cateringPackage.name}
                      </button>
                    ) : (
                      "-"
                    )}
                  </div>
                  <div>{booking.cateringPackage?.guestCount || "-"}</div>
                  <div>
                    <span className={`status-badge ${booking.status}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div>
                    <span className={`status-badge ${booking.payment?.status || "pending"}`}>
                      {booking.payment?.status || "Pending"}
                    </span>
                  </div>
                  <div>NPR {booking.totalPrice || "N/A"}</div>
                  <div className="booking-actions">
                    {booking.status === "pending" && (
                      <>
                        <button
                          className="confirm-btn"
                          onClick={() => updateBookingStatus(booking._id, "confirmed")}
                        >
                          <FiCheck /> Confirm
                        </button>
                        <button
                          className="cancel-btn"
                          onClick={() => updateBookingStatus(booking._id, "cancelled")}
                        >
                          <FiX /> Cancel
                        </button>
                      </>
                    )}
                    {booking.status === "confirmed" && (
                      <button
                        className="cancel-btn"
                        onClick={() => updateBookingStatus(booking._id, "cancelled")}
                      >
                        <FiX /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>No bookings yet.</p>
          </div>
        )}

        {renderCateringModal()}
      </div>
    );
  };

  const renderProfile = () => {
    return (
      <div className="profile-section">
        <h2>Update Payment Settings</h2>
        {userInfo?.vendorStatus !== "approved" ? (
          <p>Your vendor account is not yet approved. Please wait for admin approval to configure payment settings.</p>
        ) : (
          <div className="form-group">
            <label>Khalti Merchant ID</label>
            <input
              type="text"
              value={khaltiMerchantId}
              onChange={(e) => setKhaltiMerchantId(e.target.value)}
              placeholder="Enter your Khalti merchant ID"
              className="form-control"
            />
            <button className="primary-btn mt-2" onClick={handleUpdateMerchantId}>
              Save
            </button>
          </div>
        )}
      </div>
    );
  };

  const handleLogout = () => {
    clearAuthData();
    navigate("/signin");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="vendor-dashboard">
      <aside className="dashboard-sidebar">
        <div className="user-profile-summary">
          <div className="avatar">{userInfo?.businessName?.charAt(0) || "V"}</div>
          <h3>{userInfo?.businessName || "Vendor"}</h3>
          <p>{userInfo?.email || "vendor@example.com"}</p>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === "service" ? "active" : ""}`}
            onClick={() => setActiveTab("service")}
          >
            <FiHome className="nav-icon" />
            <span>My Service</span>
          </button>
          <button
            className={`nav-item ${activeTab === "bookings" ? "active" : ""}`}
            onClick={() => setActiveTab("bookings")}
          >
            <FiCalendar className="nav-icon" />
            <span>Bookings</span>
          </button>
          <button
            className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <FiUser className="nav-icon" />
            <span>Profile</span>
          </button>
          <button className="nav-item logout" onClick={handleLogout}>
            <FiLogOut className="nav-icon" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <main className="dashboard-content">
        {activeTab === "service" ? (
          <div className="service-section">
            {!service && !editMode ? (
              <div className="empty-service">
                <h2>You haven't added any services yet</h2>
                <Link to="/add-service" className="primary-btn">
                  Add Your First Service
                </Link>
              </div>
            ) : editMode ? (
              renderServiceForm()
            ) : (
              renderServiceDetails()
            )}
          </div>
        ) : activeTab === "bookings" ? (
          renderBookings()
        ) : (
          renderProfile()
        )}
      </main>
    </div>
  );
};

export default VendorDashboard;