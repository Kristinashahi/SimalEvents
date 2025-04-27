import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaMoneyBillWave, FaUserTie } from 'react-icons/fa';
import '../styles/AdminDashboard.css';

const TopServicesTable = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopServices = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/services/top-by-price');
        console.log("Top services response:", response.data);
        setServices(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching top services:', error);
        setLoading(false);
      }
    };

    fetchTopServices();
  }, []);

  console.log("Current services state:", services);

  if (loading) {
    return <div className="table-loading">Loading top services...</div>;
  }

  if (!services || services.length === 0) {
    return (
      <div className="table-empty">
        No services data available. Please ensure services exist in the database.
      </div>
    );
  }

  return (
    <div className="table-container">
      <h3 className="table-title">Top 5 Services by Price</h3>
      <table className="services-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Category</th>
            <th className="text-center">Price</th>
            <th>Vendor</th>
          </tr>
        </thead>
        <tbody>
          {services.map((service, index) => (
            <tr key={index}>
              <td>
                <strong>{service.name || 'N/A'}</strong>
              </td>
              <td>
                <span className="category-badge">{service.category || 'N/A'}</span>
              </td>
              <td className="text-center">NPR: {service.price || 0}</td>
              <td>
                <div className="vendor-info">
                  <FaUserTie className="vendor-icon" />
                  {service.vendorName || 'Unknown Vendor'}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TopServicesTable;