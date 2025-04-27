import React, { useState, useEffect } from "react";
import { Link as RouterLink } from 'react-router-dom'; 
import aboutHero from "/img4.webp"; // Replace with your image paths
import teamImage from "/img3.jpg";
import eventImage1 from "/img5.webp";
import eventImage2 from "/img3.jpg";
import "../styles/AboutUs.css";

const About = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-image" style={{ backgroundImage: `url(${aboutHero})` }}>
          <div className="hero-overlay">
            <h1>Our Story</h1>
            <p>Crafting unforgettable experiences since 2015</p>
          </div>
        </div>
      </section>

      {/* About Content */}
      <section className="about-content container">
        <div className="section-header">
          <h4>Who We Are</h4>
          <h2>ABOUT SIMAL EVENTS</h2>
        </div>

        <div className="about-grid">
          <div className="about-text">
            <p>
              Founded in 2015, Simal Events has grown from a small local event planner to a premier 
              full-service event management company. We specialize in creating extraordinary experiences 
              that leave lasting impressions.
            </p>
            <p>
              Our team of passionate professionals brings together creativity, precision, and dedication 
              to transform your vision into reality. Whether it's a corporate gathering, wedding, or 
              social celebration, we handle every detail with care.
            </p>
            <div className="stats-container">
              <div className="stat-item">
                <h3>500+</h3>
                <p>Events Organized</p>
              </div>
              <div className="stat-item">
                <h3>50+</h3>
                <p>Dedicated Team Members</p>
              </div>
              <div className="stat-item">
                <h3>100%</h3>
                <p>Client Satisfaction</p>
              </div>
            </div>
          </div>
          <div className="about-image">
            <img src={teamImage} alt="Simal Events Team" />
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="our-approach">
        <div className="container">
          <h2>Our Approach</h2>
          <div className="approach-cards">
            <div className="approach-card">
              <div className="card-icon">✨</div>
              <h3>Creative Vision</h3>
              <p>We bring fresh, innovative ideas to every event while staying true to your unique style.</p>
            </div>
            <div className="approach-card">
              <div className="card-icon">✓</div>
              <h3>Meticulous Planning</h3>
              <p>Every detail is carefully considered to ensure flawless execution.</p>
            </div>
            <div className="approach-card">
              <div className="card-icon">❤️</div>
              <h3>Personalized Service</h3>
              <p>We treat each event as if it were our own, with dedicated attention from start to finish.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Event Gallery */}
      <section className="event-gallery container">
        <h2>Our Signature Events</h2>
        <div className="gallery-grid">
          <div className="gallery-item">
            <img src={eventImage1} alt="Corporate Event" />
            <div className="gallery-caption">
              <h3>Corporate Events</h3>
              <p>From product launches to annual conferences</p>
            </div>
          </div>
          <div className="gallery-item">
            <img src={eventImage2} alt="Wedding Celebration" />
            <div className="gallery-caption">
              <h3>Weddings</h3>
              <p>Creating your perfect day, exactly as you imagine</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <div className="container">
          <h2>Ready to create something extraordinary?</h2>
          <button className="cta-button">Get in Touch</button>
        </div>
      </section>
    </div>
  );
};

export default About;