import React from "react";
import { createRoot } from 'react-dom/client';
import "./App.css";
import "./styles/Services.css";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from 'react-bootstrap';
import Navbar from "/components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import HeroSection from "../components/HeroSection.jsx";
import Contact from "./pages/Contact.jsx";
import Services from "/components/Services.jsx";
import Footer from "/components/Footer.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import About from "./pages/About.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ProtectedRoute from "/components/ProtectedRoute.jsx";
import ManageUsers from "./pages/ManageUsers.jsx";
import ManageServices from "./pages/ManageServices.jsx";
import VendorRegistration from "./pages/VendorRegistration.jsx";
import VendorDashboard from "./pages/VendorDashboard.jsx";
import ManageVendor from "./pages/ManageVendor.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import AddServices from "./pages/AddServices.jsx";
import ManageAvailability from "./pages/ManageAvailibality.jsx";
import ServiceDetails from "../components/ServiceDetails.jsx";
import BookingForm from "../components/BookingForm.jsx";
import TopServicesTable from "./pages/TopServicesTable.jsx";
import Success from "./pages/Success.jsx";
import ManageBookings from "./pages/ManageBookings.jsx";

import "bootstrap/dist/css/bootstrap.min.css";


const AppContent = () => {
  const location = useLocation(); 

  // Define paths where Navbar and Footer should NOT appear
  const hideNavbarFooter = ["/signin", "/signup", "/admin-dashboard", "/manageusers", "/vendordashboard", "/managevendor", "/user-dashboard", "/managebookings"].includes(location.pathname);

  return (
    <>
      {!hideNavbarFooter && <Navbar />}
      <Toaster />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="" element={<HeroSection />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/vendordashboard" element={<VendorDashboard/>}/>
        <Route path="/vendorRegister" element={<VendorRegistration/>}/>
        <Route path="/add-service" element={<AddServices />} />
        <Route path="/book/:serviceId" element={<BookingForm />} />
        <Route path="/serviceDetails/:id" element={<ServiceDetails />} />
        <Route path="/TopServicesTable" element={<TopServicesTable />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        
        {/* Protected Routes */}
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/manage-availability" 
          element={
            <ProtectedRoute allowedRoles={["vendor"]}>
              <ManageAvailability />
            </ProtectedRoute>
          } 
        />
        <Route path="/manageusers" element={<ManageUsers/>}/>
        <Route path="/managevendor" element={<ManageVendor/>}/>
        <Route path="/manageservices" element={<ManageServices/>}/>
        <Route path="/user-dashboard" element={<UserDashboard/>}/>
        <Route path="/managebookings" element={<ManageBookings />} />
        <Route path="/payment-success" element={<Success/>}/>
      </Routes>
      {!hideNavbarFooter && <Footer />}
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;