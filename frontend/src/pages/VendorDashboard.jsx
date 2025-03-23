import React, { useState } from 'react';

const VendorDashboard = () => {
    const [key, setKey] = useState('overview');

    const handleTabChange = (tabKey) => {
        setKey(tabKey);
    };

    return (
        <div className="container mt-4">
            <h2 className="mb-4">Vendor Dashboard</h2>
            <div className="row">
                <div className="col-sm-3">
                    <div className="nav flex-column nav-pills">
                        <button 
                            className={`nav-link ${key === 'overview' ? 'active' : ''}`} 
                            onClick={() => handleTabChange('overview')}
                        >
                            Overview
                        </button>
                        <button 
                            className={`nav-link ${key === 'events' ? 'active' : ''}`} 
                            onClick={() => handleTabChange('events')}
                        >
                            Events
                        </button>
                        <button 
                            className={`nav-link ${key === 'bookings' ? 'active' : ''}`} 
                            onClick={() => handleTabChange('bookings')}
                        >
                            Bookings
                        </button>
                        <button 
                            className={`nav-link ${key === 'payments' ? 'active' : ''}`} 
                            onClick={() => handleTabChange('payments')}
                        >
                            Payments
                        </button>
                        <button 
                            className={`nav-link ${key === 'settings' ? 'active' : ''}`} 
                            onClick={() => handleTabChange('settings')}
                        >
                            Settings
                        </button>
                    </div>
                </div>
                <div className="col-sm-9">
                    <div className="tab-content">
                        {/* Overview Section */}
                        <div className={`tab-pane ${key === 'overview' ? 'active show' : ''}`}>
                            {key === 'overview' && (
                                <div className="card">
                                    <div className="card-body">
                                        <h5 className="card-title">Overview</h5>
                                        <p>Welcome to your vendor dashboard! Manage your events, bookings, and payments here.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Events Section */}
                        <div className={`tab-pane ${key === 'events' ? 'active show' : ''}`}>
                            {key === 'events' && (
                                <div className="card">
                                    <div className="card-body">
                                        <h5 className="card-title">Manage Events</h5>
                                        <table className="table table-striped table-bordered table-hover">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Event Name</th>
                                                    <th>Date</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>1</td>
                                                    <td>Wedding Gala</td>
                                                    <td>12th Aug 2025</td>
                                                    <td><button className="btn btn-warning btn-sm">Edit</button></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bookings Section */}
                        <div className={`tab-pane ${key === 'bookings' ? 'active show' : ''}`}>
                            {key === 'bookings' && (
                                <div className="card">
                                    <div className="card-body">
                                        <h5 className="card-title">Bookings</h5>
                                        <table className="table table-striped table-bordered table-hover">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Client Name</th>
                                                    <th>Event</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>1</td>
                                                    <td>Jane Smith</td>
                                                    <td>Wedding Gala</td>
                                                    <td>Confirmed</td>
                                                    <td><button className="btn btn-primary btn-sm">View</button></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Payments Section */}
                        <div className={`tab-pane ${key === 'payments' ? 'active show' : ''}`}>
                            {key === 'payments' && (
                                <div className="card">
                                    <div className="card-body">
                                        <h5 className="card-title">Payments</h5>
                                        <table className="table table-striped table-bordered table-hover">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Client</th>
                                                    <th>Amount</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>1</td>
                                                    <td>Jane Smith</td>
                                                    <td>$500.00</td>
                                                    <td>Pending</td>
                                                    <td><button className="btn btn-success btn-sm">Mark Paid</button></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Settings Section */}
                        <div className={`tab-pane ${key === 'settings' ? 'active show' : ''}`}>
                            {key === 'settings' && (
                                <div className="card">
                                    <div className="card-body">
                                        <h5 className="card-title">Settings</h5>
                                        <p>Update your profile and preferences here.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VendorDashboard;