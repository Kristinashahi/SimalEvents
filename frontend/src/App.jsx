import React from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from 'react-bootstrap';
import Navbar from "/components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import HeroSection from "../components/HeroSection.jsx";
import Contact from "./pages/Contact.jsx";
import Services from "/components/Services.jsx";
import Footer from "/components/Footer.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import About from "./pages/About.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ProtectedRoute from "/components/ProtectedRoute.jsx";
import ManageUsers from "./pages/ManageUsers.jsx";
import VendorRegistration from "./pages/VendorRegistration.jsx";
import VendorDashboard from "./pages/VendorDashboard.jsx";
import ManageVendor from "./pages/ManageVendor.jsx";
import "bootstrap/dist/css/bootstrap.min.css";


const AppContent = () => {
  const location = useLocation(); 

  // Define paths where Navbar and Footer should NOT appear
  const hideNavbarFooter = ["/signin", "/signup", "/admin-dashboard", "/manageusers", "/vendordashboard", "/managevendor"].includes(location.pathname);

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
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/manageusers" element={<ManageUsers/>}/>
        <Route path="/managevendor" element={<ManageVendor/>}/>
      </Routes>
      {!hideNavbarFooter && <Footer />}
      </>
    
  );
};

// Main App component now just provides the Router context
const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
