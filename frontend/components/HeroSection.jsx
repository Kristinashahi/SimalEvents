import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Link } from "react-scroll";
import Services from "./Services.jsx";

const HeroSection = () => {
  return (
    <section className="hero">
        <img src= "/img1.jpg" alt= "event"/>
        <div className="item">
            <h3>Dream maker</h3>
            <div>
                <h1>your personal dream maker</h1>
                <p>jnfds sdfsdf dsfd sdf dfdfd sdfdf sdf</p>
                <Link to="contact" spy={true} smooth={true} duration={500}>Book Now</Link>
            </div>
        </div>
       
      
        
    </section>
    
    
  );
 
};

export default HeroSection;