import React, { useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { Link } from "react-router-dom"; // Import Link

const Navbar = () => {
  const [show, setShow] = useState(false);

  return (
    <nav>
      <div className="logo">SIMAL EVENTS</div>
      <div className={show ? "navLinks showmenu" : "navLinks"}>
        <div className="links">
          <Link to="/" className="nav-link">HOME</Link>
          <Link to="/services" className="nav-link">SERVICES</Link>
          <Link to="/about" className="nav-link">ABOUT</Link>
          <Link to="/contact" className="nav-link">CONTACT</Link>

          {/* Sign In / Sign Up Links */}
          <div className="auth-buttons">
            <Link to="/signin" className="signin-link">
              Login
            </Link>
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