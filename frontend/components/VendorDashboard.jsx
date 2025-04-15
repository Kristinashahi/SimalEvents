import React from "react";

const VendorDashboard = () => {
  return (
    <div>
      <h2>Welcome, Vendor</h2>
      <p>Manage your services, accept bookings, and view reports.</p>
    </div>
  );
};

export default VendorDashboard;


/*
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { getAuthData, clearAuthData } from "../utils/auth-utils.js";
import { toast } from "react-hot-toast";
import "bootstrap/dist/css/bootstrap.min.css";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const VendorDashboard = () => {
  const navigate = useNavigate();
  const [vendorData, setVendorData] = useState(null);
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address:"",
    category: "",
    price: "",
    duration: "",
    capacity: "",
    area: "",
    isAvailable: true,
    images: []
  });
  const [newImages, setNewImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [availabilityData, setAvailabilityData] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { token } = getAuthData();
        
        // Fetch vendor profile
        const vendorRes = await axios.get(`${API_BASE_URL}/auth/vendor/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        setVendorData(vendorRes.data);
        
        // Fetch vendor's service
        const serviceRes = await axios.get(`${API_BASE_URL}/api/services/my-service`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
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
            images: serviceRes.data.images || []
          });
          
          // Fetch service availability if service exists
          const availabilityRes = await axios.get(
            `${API_BASE_URL}/api/availability/${serviceRes.data._id}`,
            { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
          );
          
          if (availabilityRes.data) {
            setAvailabilityData(availabilityRes.data);
          }

          // Fetch vendor bookings
          await fetchVendorBookings(token);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.response?.status === 401) {
          navigate("/signin");
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
        withCredentials: true
      });
      
      // Ensure we have the expected data structure
      const processedBookings = response.data.map(booking => ({
        ...booking,
        user: booking.user || { name: 'Unknown User' },
        service: booking.service || { name: 'Unknown Service' }
      }));
      
      setBookings(processedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookingError(error.response?.data?.message || "Failed to load bookings");
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
        { 
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );
      await fetchVendorBookings(token);
      toast.success("Booking status updated");
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error(error.response?.data?.message || "Failed to update booking status");
    }
  };
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setNewImages(files);
    
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleDeleteImage = (imageUrl) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      if (imageUrl.includes(API_BASE_URL)) {
        const relativePath = imageUrl.replace(`${API_BASE_URL}/`, '');
        setImagesToDelete([...imagesToDelete, relativePath]);
      }
      
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter(img => 
          img !== imageUrl && !img.includes(imageUrl.replace(`${API_BASE_URL}/`, ''))
      )}));
      
      setImagePreviews(prev => prev.filter(preview => preview !== imageUrl));
    }
  };

  const handleToggleAvailability = () => {
    setFormData(prev => ({ ...prev, isAvailable: !prev.isAvailable }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { token } = getAuthData();
      
      if (imagesToDelete.length > 0) {
        await axios.put(
          `${API_BASE_URL}/api/services/${service._id}/images`,
          { imageUrlsToDelete: imagesToDelete },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      const formDataToSend = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'images') {
          formDataToSend.append(key, value);
        }
      });

      formData.images
        .filter(img => !img.includes(API_BASE_URL))
        .forEach(img => formDataToSend.append('images', img));
      
      newImages.forEach(image => {
        formDataToSend.append('images', image);
      });
      
      const response = await axios.put(
        `${API_BASE_URL}/api/services/${service._id}`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          withCredentials: true
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
      toast.error(error.response?.data?.message || "Failed to update service");
    }
  };

  const handleLogout = () => {
    clearAuthData();
    window.location.href = "/signin";
  };

  const handleDelete = async () => {
    try {
      const { token } = getAuthData();
      await axios.delete(`${API_BASE_URL}/api/services/${service._id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      toast.success("Service deleted successfully");
      setService(null);
      setFormData({
        name: "",
        address:"",
        description: "",
        category: "",
        price: "",
        duration: "",
        capacity: "",
        area: "",
        isAvailable: true,
        images: []
      });
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Failed to delete service");
    }
  };

  const renderServiceForm = () => {
    const isVenue = formData.category === "venue";
    
    return (
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Service Name *</label>
          <input
            type="text"
            name="name"
            className="form-control"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="mb-3">
          <label className="form-label">Description *</label>
          <textarea
            name="description"
            className="form-control"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
          />
        </div>
        
        <div className="mb-3">
          <label className="form-label">Category *</label>
          <select
            name="category"
            className="form-select"
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
        
        <div className="mb-3">
          <label className="form-label">Price (NPR) *</label>
          <input
            type="number"
            name="price"
            className="form-control"
            value={formData.price}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="mb-3">
          <label className="form-label">Duration (hours) *</label>
          <input
            type="number"
            name="duration"
            className="form-control"
            value={formData.duration}
            onChange={handleChange}
            step="0.5"
            min="0.5"
            required
          />
        </div>
        
        <div className="mb-3">
          <label className="form-label">Service Images</label>
          <input
            type="file"
            className="form-control"
            onChange={handleImageChange}
            multiple
            accept="image/*"
          />
          <small className="text-muted">Upload additional images (5MB max per image)</small>
          
          <div className="d-flex flex-wrap mt-3">
            {formData.images
              .filter(img => typeof img === 'string')
              .map((image, index) => (
                <div key={`existing-${index}`} className="position-relative m-2">
                  <img
                    src={`${API_BASE_URL}/${image}`}
                    alt={`Service ${index}`}
                    className="img-thumbnail"
                    style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    className="btn btn-danger btn-sm position-absolute top-0 end-0"
                    onClick={() => handleDeleteImage(`${API_BASE_URL}/${image}`)}
                    style={{ transform: 'translate(50%, -50%)' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            
            {imagePreviews.map((preview, index) => (
              <div key={`new-${index}`} className="position-relative m-2">
                <img
                  src={preview}
                  alt={`New preview ${index}`}
                  className="img-thumbnail"
                  style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                />
                <button
                  type="button"
                    className="btn btn-danger btn-sm position-absolute top-0 end-0"
                    onClick={() => handleDeleteImage(preview)}
                    style={{ transform: 'translate(50%, -50%)' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {isVenue && (
            <>
              <div className="mb-3">
                <label className="form-label">Capacity (People)</label>
                <input
                  type="number"
                  name="capacity"
                  className="form-control"
                  value={formData.capacity}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Area (sq.ft)</label>
                <input
                  type="number"
                  name="area"
                  className="form-control"
                  value={formData.area}
                  onChange={handleChange}
                />
              </div>
            </>
          )}
          
          <div className="mb-3 form-check form-switch">
            <input
              type="checkbox"
              className="form-check-input"
              id="isAvailable"
              checked={formData.isAvailable}
              onChange={handleToggleAvailability}
            />
            <label className="form-check-label" htmlFor="isAvailable">
              Service is available for booking
            </label>
          </div>
          
          <div className="d-flex justify-content-between">
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
            <button
              type="button"
              className="btn btn-secondary"
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
      const isVenue = service?.category === "venue";
      
      return (
        <>
          <h4>{service.name}</h4>
          <p>{service.description}</p>
          <p>{service.address}</p>
          
          <div className="mb-3">
            {service.images?.length > 0 && (
              <div className="d-flex flex-wrap">
                {service.images.map((image, index) => (
                  <div key={index} className="m-2">
                    <img
                      src={`${API_BASE_URL}/${image}`}
                      alt={`Service ${index}`}
                      className="img-thumbnail"
                      style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <p><strong>Category:</strong> {service.category}</p>
          <p><strong>Price:</strong> NPR {service.price}</p>
          <p><strong>Duration:</strong> {service.duration} hours</p>
          
          {isVenue && (
            <>
              <p><strong>Capacity:</strong> {service.capacity} people</p>
              <p><strong>Area:</strong> {service.area} sq.ft</p>
            </>
          )}
          
          <p>
            <strong>Status:</strong> 
            <span className={`badge ${service.isAvailable ? 'bg-success' : 'bg-danger'} ms-2`}>
              {service.isAvailable ? "Available" : "Not Available"}
            </span>
          </p>
          
          <div className="mt-4">
            <button
              className="btn btn-primary me-2"
              onClick={() => setEditMode(true)}
            >
              Edit Service
            </button>
            <button
              className="btn btn-danger me-2"
              onClick={handleDelete}
            >
              Delete Service
            </button>
            <button
              className="btn btn-success"
              onClick={() => navigate("/manage-availability")}
            >
              Manage Availability
            </button>
          </div>
        </>
      );
    };
  
    if (loading) {
      return (
        <div className="d-flex justify-content-center p-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      );
    }
  
    return (
      <div className="container py-5">
        <div className="row">
          <div className="col-md-4">
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <h3>Vendor Profile</h3>
              </div>
              <div className="card-body">
                {vendorData && (
                  <>
                    <h4>{vendorData.businessName}</h4>
                    <p>{vendorData.description}</p>
                    <p><strong>Contact:</strong> {vendorData.name}</p>
                    <p><strong>Email:</strong> {vendorData.email}</p>
                    <p><strong>Phone:</strong> {vendorData.phoneNumber}</p>
                    <p><strong>Status:</strong> {vendorData.vendorStatus}</p>
                    <p><strong>Address:</strong>{vendorData.vendorAddress}</p>
                  </>
                )}
                <button className="btn btn-danger mb-3" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
          
          <div className="col-md-8">
            <div className="card mb-4">
              <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h3>My Service</h3>
                {!service && !editMode && (
                  <Link to="/add-service" className="btn btn-light">
                    Add Service
                  </Link>
                )}
              </div>
              <div className="card-body">
                {service && !editMode ? renderServiceDetails() : (!service && !editMode ? (
                  <div className="text-center p-5">
                    <p>You haven't added any services yet.</p>
                    <Link to="/add-service" className="btn btn-primary">
                      Add Your First Service
                    </Link>
                  </div>
                ) : renderServiceForm())}
              </div>
            </div>
            
            {service && (
              <>
                <div className="card mb-4">
                  <div className="card-header bg-primary text-white">
                    <h3>Service Availability</h3>
                  </div>
                  <div className="card-body">
                    {availabilityData.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-striped">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Time Slots</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {availabilityData.map((availability, index) => (
                              <tr key={index}>
                                <td>{new Date(availability.date).toLocaleDateString()}</td>
                                <td>{availability.timeSlots.join(', ')}</td>
                                <td>
                                  <span className={`badge ${availability.isBooked ? 'bg-danger' : 'bg-success'}`}>
                                    {availability.isBooked ? 'Booked' : 'Available'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center p-3">
                        <p>No availability data set yet.</p>
                        <Link to="/manage-availability" className="btn btn-primary">
                          Set Availability
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header bg-primary text-white">
                    <h3>Bookings</h3>
                  </div>
                  <div className="card-body">
                    {bookings.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-striped">
                          <thead>
                            <tr>
                              <th>Customer</th>
                              <th>Service</th>
                              <th>Date</th>
                              <th>Time Slots</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bookings.map((booking) => (
                              <tr key={booking._id}>
                                <td>{booking.user?.name || 'N/A'}</td>
                                <td>{booking.service?.name || 'N/A'}</td>
                                <td>{new Date(booking.date).toLocaleDateString()}</td>
                                <td>{booking.timeSlots.join(', ')}</td>
                                <td>
                                  <span className={`badge bg-${
                                    booking.status === 'confirmed' ? 'success' : 
                                    booking.status === 'pending' ? 'warning' : 
                                    booking.status === 'cancelled' ? 'danger' : 'info'
                                  }`}>
                                    {booking.status}
                                  </span>
                                </td>
                                <td>
                                  {booking.status === 'pending' && (
                                    <>
                                      <button 
                                        className="btn btn-sm btn-success me-1"
                                        onClick={() => updateBookingStatus(booking._id, 'confirmed')}
                                      >
                                        Confirm
                                      </button>
                                      <button 
                                        className="btn btn-sm btn-danger"
                                        onClick={() => updateBookingStatus(booking._id, 'cancelled')}
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center p-3">
                        <p>No bookings yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <style>{`
          .img-thumbnail {
            transition: all 0.3s ease;
          }
          .img-thumbnail:hover {
            opacity: 0.8;
          }
          .btn-danger.btn-sm {
            width: 24px;
            height: 24px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
          }
        `}</style>
      </div>
    );
  };
  
  export default VendorDashboard;*/