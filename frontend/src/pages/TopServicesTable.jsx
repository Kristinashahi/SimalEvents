import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaMoneyBillWave, FaUserTie } from 'react-icons/fa';

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
    return <div className="text-center py-4">Loading top services...</div>;
  }

  if (!services || services.length === 0) {
    return (
      <div className="text-center py-4">
        No services data available. Please ensure services exist in the database.
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">Top 5 Services by Price</h5>
      </div>
      <div className="table-responsive">
        <table className="table table-hover mb-0">
          <thead>
            <tr>
              <th>Service</th>
              <th>Category</th>
              <th className="text-center"><FaMoneyBillWave title="Price" /></th>
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
                  <span className="badge bg-info">{service.category || 'N/A'}</span>
                </td>
                <td className="text-center">NPR: {service.price || 0}</td>
                <td>
                  <div className="d-flex align-items-center">
                    <FaUserTie className="me-2" />
                    {service.vendorName || 'Unknown Vendor'}
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