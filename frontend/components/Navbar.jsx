import React, { useState, useEffect } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { Link, useNavigate } from "react-router-dom";
import { getAuthData, clearAuthData } from "../src/utils/auth-utils.js"; // Import utility functions
import "./Navbar.css"

const Navbar = () => {
  const [show, setShow] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in on component mount
    const { token, userInfo } = getAuthData();
    
    if (token && userInfo) {
      setIsLoggedIn(true);
      setUser(userInfo);
    }
    
  }, []);

  const handleLogout = () => {
    // Clear all authentication data
    clearAuthData();
    setIsLoggedIn(false);
    setUser(null);
    navigate("/");
    window.location.href = "/";
  };

  const navigateToUserDashboard = () => {
    if (!user) return;
    
    // Redirect based on user role
    switch(user.role) {
      case "admin":
        navigate("/admin-dashboard");
        break;
      case "vendor":
        navigate("/vendordashboard");
        break;
      case "user":
        navigate("/user-dashboard");
        break;
      default:
        navigate("/user-dashboard");
    }
  };

  return (
    <nav>
      <div className="logo">SIMAL EVENTS</div>
      <div className={show ? "navLinks showmenu" : "navLinks"}>
        <div className="links">
          <Link to="/" className="nav-link">HOME</Link>
          <Link to="/services" className="nav-link">SERVICES</Link>
          <Link to="/about" className="nav-link">ABOUT</Link>
          <Link to="/contact" className="nav-link">CONTACT</Link>

          {/* Conditional rendering based on authentication status */}
          <div className="auth-buttons">
            {isLoggedIn ? (
              <>
                <div className="user-profile" onClick={navigateToUserDashboard}>
                  <span className="username">{user?.name || "Profile"}</span>
                </div>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </>
            ) : (
              <Link to="/signin" className="signin-link">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className="hamburger" onClick={() => setShow(!show)}>
        <GiHamburgerMenu />
      </div>
      
    </nav>
  );
};

export default Navbar;