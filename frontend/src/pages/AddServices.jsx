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

const AddService = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
    category: "venue",
    price: "",
    duration: "1",
    capacity: "",
    area: "",
    isAvailable: true,
    features: [],
    hasCatering: false,
    cateringPackages: []
  });

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasExistingService, setHasExistingService] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [cateringMenu, setCateringMenu] = useState([]);
  const [newMenuItem, setNewMenuItem] = useState({
    name: "",
    category: "starter",
    type: "veg",
    price: 0,
    description: ""
  });

  const [cateringPackages, setCateringPackages] = useState([
    {
      packageType: "diamond",
      name: "Diamond Package",
      basePrice: 0,
      description: "Premium package with wide selection",
      minGuests: 50,
      maxGuests: 500,
      menuSections: [
        {
          name: "STARTER/PASS AROUND SNACKS",
          items: [
            {
              title: "(Veg. Any Three)",
              items: [
                { name: "Paneer Roll", selected: true, menuItemId: "diamond-starter-veg-0" },
                { name: "Golden Paneer Sesame", selected: true, menuItemId: "diamond-starter-veg-1" },
                { name: "Paneer Tikka", selected: true, menuItemId: "diamond-starter-veg-2" },
                { name: "Cheese Sticks", selected: false, menuItemId: "diamond-starter-veg-3" },
                { name: "Cheese Ball", selected: false, menuItemId: "diamond-starter-veg-4" },
              ],
            },
            {
              title: "(Non-Veg. Any Four)",
              items: [
                { name: "Chicken BBQ", selected: true, menuItemId: "diamond-starter-nonveg-0" },
                { name: "Chicken Tikka", selected: true, menuItemId: "diamond-starter-nonveg-1" },
                { name: "Fish Crispy", selected: true, menuItemId: "diamond-starter-nonveg-2" },
                { name: "Pork Tawa", selected: true, menuItemId: "diamond-starter-nonveg-3" },
              ],
            },
          ],
        },
        {
          name: "MAIN COURSE",
          items: [
            {
              title: "(Choose Any One From Each)",
              items: [
                { name: "Steam Rice/Pulao/Jeera Rice", selected: true, menuItemId: "diamond-main-0" },
                { name: "Dal Makhani/Thakali Dal", selected: true, menuItemId: "diamond-main-1" },
                { name: "Paneer Butter Masala/Peas Paneer", selected: true, menuItemId: "diamond-main-2" },
              ],
            },
          ],
        },
      ],
      includedItems: [
        { menuItemId: "diamond-starter-veg-0", maxSelection: 1 },
        { menuItemId: "diamond-starter-veg-1", maxSelection: 1 },
        { menuItemId: "diamond-starter-veg-2", maxSelection: 1 },
        { menuItemId: "diamond-starter-nonveg-0", maxSelection: 1 },
        { menuItemId: "diamond-starter-nonveg-1", maxSelection: 1 },
        { menuItemId: "diamond-starter-nonveg-2", maxSelection: 1 },
        { menuItemId: "diamond-starter-nonveg-3", maxSelection: 1 },
        { menuItemId: "diamond-main-0", maxSelection: 1 },
        { menuItemId: "diamond-main-1", maxSelection: 1 },
        { menuItemId: "diamond-main-2", maxSelection: 1 },
      ],
      optionalItems: [
        { menuItemId: "diamond-starter-veg-3", maxSelection: 2 },
        { menuItemId: "diamond-starter-veg-4", maxSelection: 2 },
      ],
    },
    {
      packageType: "gold",
      name: "Gold Package",
      basePrice: 0,
      description: "Standard package with essential items",
      minGuests: 20,
      maxGuests: 300,
      menuSections: [
        {
          name: "STARTER/PASS AROUND SNACKS",
          items: [
            {
              title: "(Veg. Any Two)",
              items: [
                { name: "Paneer Roll", selected: true, menuItemId: "gold-starter-veg-0" },
                { name: "Cheese Balls", selected: true, menuItemId: "gold-starter-veg-1" },
                { name: "Veg Momo", selected: false, menuItemId: "gold-starter-veg-2" },
              ],
            },
            {
              title: "(Non-Veg. Any Two)",
              items: [
                { name: "Chicken Tikka", selected: true, menuItemId: "gold-starter-nonveg-0" },
                { name: "Fish Crispy", selected: true, menuItemId: "gold-starter-nonveg-1" },
              ],
            },
          ],
        },
        {
          name: "MAIN COURSE",
          items: [
            {
              title: "(Choose Any One From Each)",
              items: [
                { name: "Steam Rice", selected: true, menuItemId: "gold-main-0" },
                { name: "Dal Makhani", selected: true, menuItemId: "gold-main-1" },
              ],
            },
          ],
        },
      ],
      includedItems: [
        { menuItemId: "gold-starter-veg-0", maxSelection: 1 },
        { menuItemId: "gold-starter-veg-1", maxSelection: 1 },
        { menuItemId: "gold-starter-nonveg-0", maxSelection: 1 },
        { menuItemId: "gold-starter-nonveg-1", maxSelection: 1 },
        { menuItemId: "gold-main-0", maxSelection: 1 },
        { menuItemId: "gold-main-1", maxSelection: 1 },
      ],
      optionalItems: [
        { menuItemId: "gold-starter-veg-2", maxSelection: 2 },
      ],
    },
    {
      packageType: "only-veg",
      name: "Only Veg Package",
      basePrice: 0,
      description: "Vegetarian package with a wide selection",
      minGuests: 50,
      maxGuests: 500,
      menuSections: [
        {
          name: "STARTER/PASS AROUND SNACKS",
          items: [
            {
              title: "(Veg. Any Three)",
              items: [
                { name: "Paneer Roll", selected: true, menuItemId: "veg-starter-veg-0" },
                { name: "Golden Paneer Sesame", selected: true, menuItemId: "veg-starter-veg-1" },
                { name: "Paneer Tikka", selected: true, menuItemId: "veg-starter-veg-2" },
                { name: "Cheese Sticks", selected: false, menuItemId: "veg-starter-veg-3" },
                { name: "Cheese Ball", selected: false, menuItemId: "veg-starter-veg-4" },
              ],
            },
          ],
        },
        {
          name: "MAIN COURSE",
          items: [
            {
              title: "(Choose Any One From Each)",
              items: [
                { name: "Steam Rice/Pulao/Jeera Rice", selected: true, menuItemId: "veg-main-0" },
                { name: "Dal Makhani/Thakali Dal", selected: true, menuItemId: "veg-main-1" },
                { name: "Paneer Butter Masala/Peas Paneer", selected: true, menuItemId: "veg-main-2" },
              ],
            },
          ],
        },
      ],
      includedItems: [
        { menuItemId: "veg-starter-veg-0", maxSelection: 1 },
        { menuItemId: "veg-starter-veg-1", maxSelection: 1 },
        { menuItemId: "veg-starter-veg-2", maxSelection: 1 },
        { menuItemId: "veg-main-0", maxSelection: 1 },
        { menuItemId: "veg-main-1", maxSelection: 1 },
        { menuItemId: "veg-main-2", maxSelection: 1 },
      ],
      optionalItems: [
        { menuItemId: "veg-starter-veg-3", maxSelection: 2 },
        { menuItemId: "veg-starter-veg-4", maxSelection: 2 },
      ],
    },
  ]);

  const [newMenuSection, setNewMenuSection] = useState({
    packageIndex: 0,
    name: "",
    title: "",
    items: []
  });

  const [newSectionItem, setNewSectionItem] = useState("");

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

  const handleCateringToggle = () => {
    setFormData(prev => ({
      ...prev,
      hasCatering: !prev.hasCatering,
      cateringPackages: !prev.hasCatering ? cateringPackages : []
    }));
  };

  const handlePackageChange = (packageIndex, field, value) => {
    const updatedPackages = [...cateringPackages];
    updatedPackages[packageIndex][field] = value;
    setCateringPackages(updatedPackages);
    
    setFormData(prev => ({
      ...prev,
      cateringPackages: updatedPackages
    }));
  };

  const handleItemSelection = (packageIndex, sectionIndex, itemGroupIndex, itemIndex) => {
    const updatedPackages = [...cateringPackages];
    const currentItem = updatedPackages[packageIndex].menuSections[sectionIndex].items[itemGroupIndex].items[itemIndex];
    currentItem.selected = !currentItem.selected;
    setCateringPackages(updatedPackages);
    
    setFormData(prev => ({
      ...prev,
      cateringPackages: updatedPackages
    }));
  };

  const addMenuSection = () => {
    if (!newMenuSection.name) {
      toast.error("Section name is required");
      return;
    }

    const updatedPackages = [...cateringPackages];
    updatedPackages[newMenuSection.packageIndex].menuSections.push({
      name: newMenuSection.name,
      items: [{
        title: newMenuSection.title,
        items: newMenuSection.items.map(item => ({ name: item, selected: true }))
      }]
    });

    setCateringPackages(updatedPackages);
    setFormData(prev => ({
      ...prev,
      cateringPackages: updatedPackages
    }));

    setNewMenuSection({
      packageIndex: 0,
      name: "",
      title: "",
      items: []
    });
  };

  const addSectionItem = (packageIndex, sectionIndex, itemGroupIndex) => {
    if (!newSectionItem) return;

    const updatedPackages = [...cateringPackages];
    updatedPackages[packageIndex].menuSections[sectionIndex]
      .items[itemGroupIndex].items.push({ name: newSectionItem, selected: true });

    setCateringPackages(updatedPackages);
    setFormData(prev => ({
      ...prev,
      cateringPackages: updatedPackages
    }));

    setNewSectionItem("");
  };

  const removeSectionItem = (packageIndex, sectionIndex, itemGroupIndex, itemIndex) => {
    const updatedPackages = [...cateringPackages];
    updatedPackages[packageIndex].menuSections[sectionIndex]
      .items[itemGroupIndex].items.splice(itemIndex, 1);

    setCateringPackages(updatedPackages);
    setFormData(prev => ({
      ...prev,
      cateringPackages: updatedPackages
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Service name is required";
    if (!formData.address.trim()) errors.address = "Address is required";
    if (!formData.description.trim()) errors.description = "Description is required";
    if (!formData.price) errors.price = "Price is required";
    if (isNaN(formData.price)) errors.price = "Price must be a number";
    if (!formData.duration) errors.duration = "Duration is required";
    if (formData.category === "venue" && !formData.capacity) {
      errors.capacity = "Capacity is required for venues";
    }
    
    if (formData.hasCatering) {
      cateringPackages.forEach((pkg, index) => {
        if (!pkg.name.trim()) {
          errors[`package-${index}-name`] = "Package name is required";
        }
        if (pkg.basePrice <= 0) {
          errors[`package-${index}-price`] = "Package price must be greater than 0";
        }
      });
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

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
  
      // Filter out unselected items before submitting
      const filteredPackages = cateringPackages.map(pkg => ({
        ...pkg,
        menuSections: pkg.menuSections.map(section => ({
          ...section,
          items: section.items.map(itemGroup => ({
            ...itemGroup,
            items: itemGroup.items
              .filter(item => item.selected)
              .map(item => item.name) // Convert back to string array for backend
          }))
        }))
      }));
  
      const formDataToSend = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'features') {
          formDataToSend.append(key, JSON.stringify(value));
        } else if (key === 'cateringPackages') {
          formDataToSend.append(key, JSON.stringify(filteredPackages));
        } else {
          formDataToSend.append(key, value);
        }
      });
      
      images.forEach(image => {
        formDataToSend.append('images', image);
      });
      
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

  const renderPackageForm = (pkg, pkgIndex) => (
    <div key={pkgIndex} className="card mb-4">
      <div className="card-header bg-light">
        <h5>{pkg.name}</h5>
      </div>
      <div className="card-body">
        <div className="row mb-3">
          <div className="col-md-4">
            <label className="form-label">Price Per Plate (NPR) *</label>
            <input
              type="number"
              className={`form-control ${formErrors[`package-${pkgIndex}-price`] ? "is-invalid" : ""}`}
              value={pkg.basePrice}
              onChange={(e) => handlePackageChange(pkgIndex, 'basePrice', Number(e.target.value))}
              min="0"
            />
            {formErrors[`package-${pkgIndex}-price`] && 
              <div className="invalid-feedback">{formErrors[`package-${pkgIndex}-price`]}</div>}
          </div>
          <div className="col-md-4">
            <label className="form-label">Min Guests</label>
            <input
              type="number"
              className="form-control"
              value={pkg.minGuests}
              onChange={(e) => handlePackageChange(pkgIndex, 'minGuests', Number(e.target.value))}
              min="1"
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Max Guests</label>
            <input
              type="number"
              className="form-control"
              value={pkg.maxGuests}
              onChange={(e) => handlePackageChange(pkgIndex, 'maxGuests', Number(e.target.value))}
              min={pkg.minGuests || 1}
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            rows="2"
            value={pkg.description}
            onChange={(e) => handlePackageChange(pkgIndex, 'description', e.target.value)}
          />
        </div>

        {/* Menu Sections */}
        {pkg.menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-4 p-3 border rounded">
            <h6 className="fw-bold">{section.name}</h6>
            
            {section.items.map((itemGroup, itemGroupIndex) => (
              <div key={itemGroupIndex} className="mb-3">
                <p className="fst-italic">{itemGroup.title}</p>
                <ul className="list-group">
                  {itemGroup.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id={`item-${pkgIndex}-${sectionIndex}-${itemGroupIndex}-${itemIndex}`}
                          checked={item.selected}
                          onChange={() => handleItemSelection(pkgIndex, sectionIndex, itemGroupIndex, itemIndex)}
                        />
                        <label
                          className="form-check-label"
                          htmlFor={`item-${pkgIndex}-${sectionIndex}-${itemGroupIndex}-${itemIndex}`}
                        >
                          {item.name}
                        </label>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removeSectionItem(pkgIndex, sectionIndex, itemGroupIndex, itemIndex)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="input-group mt-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Add new item"
                    value={newSectionItem}
                    onChange={(e) => setNewSectionItem(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addSectionItem(pkgIndex, sectionIndex, itemGroupIndex);
                      }
                    }}
                  />
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => addSectionItem(pkgIndex, sectionIndex, itemGroupIndex)}
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Add New Section */}
        <div className="border p-3 rounded">
          <h6>Add New Menu Section</h6>
          <div className="row">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control mb-2"
                placeholder="Section name (e.g., STARTERS)"
                value={newMenuSection.name}
                onChange={(e) => setNewMenuSection({...newMenuSection, name: e.target.value})}
              />
            </div>
            <div className="col-md-4">
              <input
                type="text"
                className="form-control mb-2"
                placeholder="Item group title (e.g., Veg. Any Three)"
                value={newMenuSection.title}
                onChange={(e) => setNewMenuSection({...newMenuSection, title: e.target.value})}
              />
            </div>
            <div className="col-md-4">
              <button
                className="btn btn-primary w-100"
                type="button"
                onClick={addMenuSection}
              >
                Add Section
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
        <div className="col-md-10">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h2 className="mb-0">Add New Service</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
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

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Address *</label>
                    <input
                      type="text"
                      name="address"
                      className={`form-control ${formErrors.address ? "is-invalid" : ""}`}
                      value={formData.address}
                      onChange={handleChange}
                    />
                    {formErrors.address && 
                      <div className="invalid-feedback">{formErrors.address}</div>}
                  </div>
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
                  {formErrors.description && 
                    <div className="invalid-feedback">{formErrors.description}</div>}
                </div>

                <div className="row">
                  <div className="col-md-4 mb-3">
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

                  <div className="col-md-4 mb-3">
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

                  <div className="col-md-4 mb-3">
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
                </div>

                {formData.category === "venue" && (
                  <div className="row mb-3">
                    <div className="col-md-6">
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
                    <div className="col-md-6">
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
                  </div>
                )}

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
                    onChange={() => setFormData(prev => ({ ...prev, isAvailable: !prev.isAvailable }))}
                  />
                  <label className="form-check-label" htmlFor="isAvailable">
                    Service is available for booking
                  </label>
                </div>

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
                        {cateringPackages.map((pkg, index) => 
                          renderPackageForm(pkg, index)
                        )}
                      </div>
                    )}
                  </div>
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