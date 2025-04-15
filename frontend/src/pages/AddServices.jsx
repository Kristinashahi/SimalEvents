import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getAuthData } from "../utils/auth-utils.js";
import { toast } from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const FEATURE_OPTIONS = {
  venue: [
    { name: "Parking Space", icon: "bi bi-p-square" },
    { name: "Air Conditioning", icon: "bi bi-snow" },
    { name: "Outdoor Space", icon: "bi bi-tree" },
    { name: "WiFi", icon: "bi bi-wifi" },
    { name: "Audio System", icon: "bi bi-speaker" },
    { name: "Projector", icon: "bi bi-display" },
    { name: "Catering Kitchen", icon: "bi bi-egg-fried" },
    { name: "Stage", icon: "bi bi-mic" }
  ],
  photography: [
    { name: "Professional Equipment", icon: "bi bi-camera" },
    { name: "Photo Editing", icon: "bi bi-card-image" },
    { name: "Digital Copies", icon: "bi bi-file-earmark-arrow-down" },
    { name: "Prints", icon: "bi bi-printer" },
    { name: "Multiple Photographers", icon: "bi bi-people" },
    { name: "Drone Photography", icon: "bi bi-airplane" }
  ],
  decoration: [
    { name: "Theme-based Decoration", icon: "bi bi-balloon" },
    { name: "Flower Arrangements", icon: "bi bi-flower1" },
    { name: "Lighting Solutions", icon: "bi bi-lightbulb" },
    { name: "Custom Designs", icon: "bi bi-palette" },
    { name: "Furniture Rental", icon: "bi bi-lamp" }
  ]
};

const TIME_PERIODS = [
  { id: 'morning', name: 'Morning', time: '7:00 AM - 11:00 AM' },
  { id: 'day', name: 'Day', time: '12:00 PM - 4:00 PM' },
  { id: 'evening', name: 'Evening', time: '5:00 PM - 9:00 PM' }
];

const AddService = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    address:"",
    description: "",
    category: "venue",
    price: "",
    duration: "1",
    capacity: "",
    area: "",
    isAvailable: true,
    features: [],
    availableDates: [],
    blockedDates: []
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasExistingService, setHasExistingService] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const checkExistingService = async () => {
      try {
        const { token } = getAuthData();
        if (!token) {
          navigate("/signin");
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/services/my-service`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        
        if (response.data) {
          setHasExistingService(true);
          toast.error("You can only have one service. Edit your existing service.");
          navigate("/vendordashboard");
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error("Error checking service:", error);
          toast.error("Error checking your service");
        }
      } finally {
        setLoading(false);
      }
    };
    
    checkExistingService();
  }, [navigate]);
  const [cateringPackages, setCateringPackages] = useState([
    {
      period: 'morning',
      name: 'Morning Package',
      price: 0,
      items: [],
      minGuests: 10,
      maxGuests: 100,
      description: ''
    },
    {
      period: 'day',
      name: 'Day Package',
      price: 0,
      items: [],
      minGuests: 10,
      maxGuests: 100,
      description: ''
    },
    {
      period: 'evening',
      name: 'Evening Package',
      price: 0,
      items: [],
      minGuests: 10,
      maxGuests: 100,
      description: ''
    }
  ]);

  const handleCateringToggle = () => {
    setFormData(prev => ({
      ...prev,
      hasCatering: !prev.hasCatering,
      packages: !prev.hasCatering ? cateringPackages : []
    }));
  };
  
  const handlePackageChange = (period, field, value) => {
    setCateringPackages(prev =>
      prev.map(pkg =>
        pkg.period === period ? { ...pkg, [field]: value } : pkg
      )
    );
    
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.map(pkg =>
        pkg.period === period ? { ...pkg, [field]: value } : pkg
      )
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Service name is required";
    if (!formData.description.trim()) errors.description = "Description is required";
    if (!formData.price) errors.price = "Price is required";
    if (isNaN(formData.price)) errors.price = "Price must be a number";
    if (!formData.duration) errors.duration = "Duration is required";
    if (formData.category === "venue" && !formData.capacity) {
      errors.capacity = "Capacity is required for venues";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Reset features when category changes
  if (name === "category") {
    setFormData(prev => ({ ...prev, features: [] }));
  }
  };

  const handleFeatureToggle = (feature) => {
    setFormData(prev => {
      const featureExists = prev.features.some(f => f.name === feature.name);
      
      if (featureExists) {
        return {
          ...prev,
          features: prev.features.filter(f => f.name !== feature.name)
        };
      } else {
        return {
          ...prev,
          features: [...prev.features, feature]
        };
      }
    });
  };

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  const handleToggleAvailability = () => {
    setFormData(prev => ({ ...prev, isAvailable: !prev.isAvailable }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix form errors");
      return;
    }
  
    try {
      const { token, userInfo } = getAuthData();
      if (!token || !userInfo?.id) {
        toast.error("Session expired. Please log in again.");
        navigate("/signin");
        return;
      }
  
      const formDataToSend = new FormData();
  
      // Append all fields correctly
      formDataToSend.append('name', formData.name);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('duration', formData.duration);
      formDataToSend.append('isAvailable', formData.isAvailable);
      formDataToSend.append('capacity', formData.capacity || '');
      formDataToSend.append('area', formData.area || '');
      
      // Stringify features array
      formDataToSend.append('features', JSON.stringify(formData.features));

      if (formData.hasCatering) {
        formDataToSend.append('packages', JSON.stringify(cateringPackages));
      }
      
      // Append images
      images.forEach(image => {
        formDataToSend.append('images', image);
      });
      
      // Append vendor ID
      formDataToSend.append('vendor', userInfo.id);
  
      const response = await axios.post(
        `${API_BASE_URL}/api/services`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          withCredentials: true
        }
      );
  
      toast.success("Service created successfully!");
      navigate("/vendordashboard");
    } catch (error) {
      console.error("Service creation error:", error);
      const errorMsg = error.response?.data?.message || 
                      error.response?.data?.msg || 
                      "Failed to create service. Please try again.";
      toast.error(errorMsg);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (hasExistingService) {
    return null;
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h2 className="mb-0">Add New Service</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Service Name *</label>
                  <input
                    type="text"
                    name="name"
                    className={`form-control ${formErrors.name ? "is-invalid" : ""}`}
                    value={formData.name}
                    onChange={handleChange}
                  />
                  {formErrors.name && 
                    <div className="invalid-feedback">{formErrors.name}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Address *</label>
                  <input
                    type="text"
                    name="address"
                    className={`form-control ${formErrors.name ? "is-invalid" : ""}`}
                    value={formData.address}
                    onChange={handleChange}
                  />
                  {formErrors.name && 
                    <div className="invalid-feedback">{formErrors.address}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Description *</label>
                  <textarea
                    name="description"
                    className={`form-control ${formErrors.description ? "is-invalid" : ""}`}
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                  />
                  {formData.category === "venue" && (
  <div className="mb-4">
    <div className="form-check form-switch mb-3">
      <input
        className="form-check-input"
        type="checkbox"
        id="hasCatering"
        checked={formData.hasCatering}
        onChange={handleCateringToggle}
      />
      <label className="form-check-label" htmlFor="hasCatering">
        Offer Catering Services
      </label>
    </div>

    {formData.hasCatering && (
      <div className="catering-packages">
        {TIME_PERIODS.map(period => {
          const pkg = cateringPackages.find(p => p.period === period.id) || {};
          return (
            <div key={period.id} className="card mb-4">
              <div className="card-header bg-light">
                <h5>{period.name} Catering Package ({period.time})</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Package Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={pkg.name}
                      onChange={(e) => handlePackageChange(period.id, 'name', e.target.value)}
                    />
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Price Per Plate (NPR)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={pkg.price}
                      onChange={(e) => handlePackageChange(period.id, 'price', Number(e.target.value))}
                      min="0"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Menu Items (comma separated)</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={pkg.items?.join(', ')}
                    onChange={(e) => handlePackageChange(period.id, 'items', e.target.value.split(',').map(item => item.trim()))}
                    placeholder="E.g.: Starter, Main Course, Dessert, Drinks"
                  />
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Minimum Guests</label>
                    <input
                      type="number"
                      className="form-control"
                      value={pkg.minGuests}
                      onChange={(e) => handlePackageChange(period.id, 'minGuests', Number(e.target.value))}
                      min="1"
                    />
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Maximum Guests</label>
                    <input
                      type="number"
                      className="form-control"
                      value={pkg.maxGuests}
                      onChange={(e) => handlePackageChange(period.id, 'maxGuests', Number(e.target.value))}
                      min={pkg.minGuests || 1}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Package Description</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={pkg.description}
                    onChange={(e) => handlePackageChange(period.id, 'description', e.target.value)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
)}
                  {formErrors.description && 
                    <div className="invalid-feedback">{formErrors.description}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Category *</label>
                  <select
                    name="category"
                    className="form-select"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="venue">Venue</option>
                    <option value="decoration">Decoration</option>
                    <option value="photography">Photography</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Service Features</label>
                  <div className="row">
                    {FEATURE_OPTIONS[formData.category]?.map((feature, index) => (
                      <div key={index} className="col-md-6 mb-2">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`feature-${index}`}
                            checked={formData.features.some(f => f.name === feature.name)}
                            onChange={() => handleFeatureToggle(feature)}
                          />
                          <label className="form-check-label" htmlFor={`feature-${index}`}>
                            <i className={`${feature.icon} me-2`}></i>
                            {feature.name}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Price (NPR) *</label>
                  <input
                    type="number"
                    name="price"
                    className={`form-control ${formErrors.price ? "is-invalid" : ""}`}
                    value={formData.price}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                  />
                  {formErrors.price && 
                    <div className="invalid-feedback">{formErrors.price}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Duration (hours) *</label>
                  <input
                    type="number"
                    name="duration"
                    className={`form-control ${formErrors.duration ? "is-invalid" : ""}`}
                    value={formData.duration}
                    onChange={handleChange}
                    step="0.5"
                    min="0.5"
                  />
                  {formErrors.duration && 
                    <div className="invalid-feedback">{formErrors.duration}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Service Images *</label>
                  <input
                    type="file"
                    className="form-control"
                    onChange={handleImageChange}
                    multiple
                    accept="image/*"
                    required
                  />
                  <small className="text-muted">Upload at least one image (JPEG, PNG)</small>
                </div>

                <div className="mb-3 form-check form-switch">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="isAvailable"
                    name="isAvailable"
                    checked={formData.isAvailable}
                    onChange={handleToggleAvailability}
                  />
                  <label className="form-check-label" htmlFor="isAvailable">
                    Service is available for booking
                  </label>
                </div>

                {formData.category === "venue" && (
                  <>
                    <div className="mb-3">
                      <label className="form-label">Capacity (people) *</label>
                      <input
                        type="number"
                        name="capacity"
                        className={`form-control ${formErrors.capacity ? "is-invalid" : ""}`}
                        value={formData.capacity}
                        onChange={handleChange}
                        min="1"
                      />
                      {formErrors.capacity && 
                        <div className="invalid-feedback">{formErrors.capacity}</div>}
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Area (sq.ft)</label>
                      <input
                        type="number"
                        name="area"
                        className="form-control"
                        value={formData.area}
                        onChange={handleChange}
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </>
                )}

                <div className="d-flex justify-content-between mt-4">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => navigate("/vendordashboard")}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Service
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

export default AddService;