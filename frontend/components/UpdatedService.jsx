import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { getAuthData } from "../src/utils/auth-utils.js";
import { toast } from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const UpdateService = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address:"",
    category: "",
    price: "",
    capacity: "",
    area: "",
    images: [],
    isAvailable: true
  });

  useEffect(() => {
    const fetchServiceDetails = async () => {
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
          setFormData({
            name: response.data.name || "",
            description: response.data.description || "",
            category: response.data.category || "venue",
            price: response.data.price ? response.data.price.toString() : "",
            capacity: response.data.capacity ? response.data.capacity.toString() : "",
            area: response.data.area ? response.data.area.toString() : "",
            images: response.data.images || [],
            isAvailable: response.data.isAvailable ?? true
          });
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching service details:", error);
        toast.error("Failed to fetch service details");
        navigate("/vendor-dashboard");
      }
    };

    fetchServiceDetails();
  }, [serviceId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    const filePromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises).then(imageUrls => {
      setFormData({
        ...formData,
        images: [...formData.images, ...imageUrls]
      });
    });
  };

  const removeImage = (index) => {
    const updatedImages = [...formData.images];
    updatedImages.splice(index, 1);
    setFormData({
      ...formData,
      images: updatedImages
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const authData = getAuthData();
      if (!authData || !authData.token) {
        navigate("/login");
        return;
      }

      // Prepare form data for submission
      const serviceData = {
        ...formData,
        // Convert numeric fields to numbers
        price: parseFloat(formData.price),
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        area: formData.area ? parseFloat(formData.area) : undefined,
      };

      const response = await axios.put(
        `${API_BASE_URL}/api/services/${serviceId}`,
        serviceData,
        {
          headers: {
            Authorization: `Bearer ${authData.token}`
          }
        }
      );

      toast.success("Service updated successfully!");
      navigate("/vendor-dashboard");
    } catch (error) {
      console.error("Error updating service:", error);
      toast.error(error.response?.data?.message || "Failed to update service");
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
              <h4 className="mb-0">Update Service</h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Service Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="description" className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                <div className="mb-3">
                  <label htmlFor="category" className="form-label">Category</label>
                  <select
                    className="form-select"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="venue">Venue</option>
                    <option value="decoration">Decoration</option>
                    <option value="photography">Photography</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="price" className="form-label">Price (NPR)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                </div>

                {formData.category === "venue" && (
                  <>
                    <div className="mb-3">
                      <label htmlFor="capacity" className="form-label">Capacity (people)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="capacity"
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="area" className="form-label">Area (sq.ft)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="area"
                        name="area"
                        value={formData.area}
                        onChange={handleChange}
                      />
                    </div>
                  </>
                )}

                <div className="mb-3">
                  <label className="form-label">Current Images</label>
                  <div className="row">
                    {formData.images.map((imgUrl, index) => (
                      <div key={index} className="col-md-4 mb-2">
                        <div className="position-relative">
                          <img src={imgUrl} alt="Service" className="img-thumbnail" />
                          <button 
                            type="button" 
                            className="btn btn-danger btn-sm position-absolute top-0 end-0"
                            onClick={() => removeImage(index)}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="images" className="form-label">Add New Images</label>
                  <input
                    type="file"
                    className="form-control"
                    id="images"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                  />
                </div>

                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="isAvailable"
                    name="isAvailable"
                    checked={formData.isAvailable}
                    onChange={e => setFormData({...formData, isAvailable: e.target.checked})}
                  />
                  <label className="form-check-label" htmlFor="isAvailable">Service is Available</label>
                </div>

                <div className="d-flex justify-content-between">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => navigate("/vendor-dashboard")}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Update Service</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateService;