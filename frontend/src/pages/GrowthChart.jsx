import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { format, subDays } from 'date-fns';
import { getAuthData } from '../utils/auth-utils.js';
import '../styles/TopServices.css';

Chart.register(...registerables);

const GrowthChart = () => {
  const [growthData, setGrowthData] = useState(null);
  const [timeRange, setTimeRange] = useState('7');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrowthData = async () => {
      const { token } = getAuthData();
      try {
        const response = await axios.get(
          `http://localhost:4000/admin/growth-stats`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setGrowthData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching growth data:', error);
        setLoading(false);
      }
    };

    fetchGrowthData();
  }, [timeRange]);

  if (loading) {
    return <div className="chart-loading">Loading growth data...</div>;
  }

  if (!growthData) {
    return <div className="chart-empty">No growth data available</div>;
  }

  const processChartData = (data, label, color) => {
    const dates = [];
    const counts = [];

    const days = parseInt(timeRange);
    const dateArray = Array.from({ length: days }, (_, i) =>
      format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd')
    );

    dateArray.forEach(date => {
      const found = data.find(item => item._id === date);
      dates.push(format(new Date(date), 'MMM dd'));
      counts.push(found ? found.count : 0);
    });

    return {
      labels: dates,
      datasets: [{
        label: label,
        data: counts,
        borderColor: color,
        backgroundColor: `${color}20`,
        tension: 0.3,
        fill: true
      }]
    };
  };

  const chartData = {
    labels: processChartData(growthData.userGrowth, 'Users', '#36A2EB').labels,
    datasets: [
      processChartData(growthData.userGrowth, 'Users', '#36A2EB').datasets[0],
      processChartData(growthData.vendorGrowth, 'Vendors', '#FFCE56').datasets[0]
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3 className="chart-title">User & Vendor Growth</h3>
        <div className="time-range-buttons">
          <button
            className={`time-range-btn ${timeRange === '7' ? 'active' : ''}`}
            onClick={() => setTimeRange('7')}
          >
            7 Days
          </button>
          <button
            className={`time-range-btn ${timeRange === '30' ? 'active' : ''}`}
            onClick={() => setTimeRange('30')}
          >
            30 Days
          </button>
        </div>
      </div>
      <div className="chart">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default GrowthChart;