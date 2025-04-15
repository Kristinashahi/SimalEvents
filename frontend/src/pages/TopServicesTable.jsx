import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthData } from '../utils/auth-utils';
import { FaStar, FaMoneyBillWave, FaUserTie } from 'react-icons/fa';

const TopServicesTable = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopServices = async () => {
      const { token } = getAuthData();
      try {
        const response = await axios.get(
          'http://localhost:4000/admin/top-services',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setServices(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching top services:', error);
        setLoading(false);
      }
    };

    fetchTopServices();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading top services...</div>;
  }

  if (!services || services.length === 0) {
    return <div className="text-center py-4">No services data available</div>;
  }

  return (
    <div className="card">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">Top 5 Services</h5>
      </div>
      <div className="table-responsive">
        <table className="table table-hover mb-0">
          <thead>
            <tr>
              <th>Service</th>
              <th>Category</th>
              <th className="text-center"><FaMoneyBillWave title="Price" /></th>
              <th className="text-center"><FaStar title="Popularity" /></th>
              <th>Vendor</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service, index) => (
              <tr key={index}>
                <td>
                  <strong>{service.name}</strong>
                  <div className="text-muted small">
                    {new Date(service.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td>
                  <span className="badge bg-info">{service.category}</span>
                </td>
                <td className="text-center">${service.price}</td>
                <td className="text-center">{service.bookings || 0}</td>
                <td>
                  <div className="d-flex align-items-center">
                    <FaUserTie className="me-2" />
                    {service.vendorName}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopServicesTable;