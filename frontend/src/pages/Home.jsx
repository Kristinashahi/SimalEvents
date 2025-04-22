import React, { useState, useEffect } from "react";
import { Link as RouterLink } from 'react-router-dom'; 
import { Link as ScrollLink } from 'react-scroll'; 
import '../styles/Home.css';

const Home = () => {
  // Slide data
  const slides = [
    {
      id: 1,
      image: "/img5.webp",
      title: "Dream Maker",
      subtitle: "Your personal dream maker",
      description: "We make your special events unforgettable",
      buttonText: "Book Now",
      
    },
    {
      id: 2,
      image: "/img2.avif",
      title: "Wedding Planning",
      subtitle: "Hassle-free weddings",
      description: "Your dream wedding, our expertise",
      buttonText: "Plan My Wedding",
    },
    {
      id: 3,
      image: "/img3.jpg",
      title: "Birthday Planning",
      subtitle: "Perfect birthday celebrations",
      description: "Let us handle all the details",
      buttonText: "Plan My Birthday",
      
    },
  ];

  // State for current slide
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, [slides.length]);

  // Handle manual slide change
  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const services = [
    { id: 1, url: "/img2.avif", title: "Birthday Planning" },
    { id: 2, url: "/img3.jpg", title: "Anniversary Planning" },
    { id: 3, url: "/img4.webp", title: "Camping Trip Planning" },
    { id: 4, url: "/img5.webp", title: "Game Night Planning" },
    { id: 5, url: "/img6.jpg", title: "Party Planning" },
    { id: 6, url: "/img1.jpg", title: "Wedding Planning" },
  ];

  return (
    <div className ="body">
      <section className="hero">
        <div className="slider">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`slide ${index === currentSlide ? "active" : ""}`}
            >
              <img src={slide.image} alt={slide.title} className="slide-image" />
              <div className="slide-content">
                <h3>{slide.title}</h3>
                <div>
                  <h1>{slide.subtitle}</h1>
                  <p>{slide.description}</p>
                  <RouterLink
                    to="/services" 
                    className="btn-slide"
                  >
                    {slide.buttonText}
                  </RouterLink>
                </div>
              </div>
            </div>
          ))}
          <div className="slider-nav">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentSlide ? "active" : ""}`}
                onClick={() => goToSlide(index)}
              ></button>
            ))}
          </div>
        </div>
      </section>

      <div className="services container">
        <h2>OUR SERVICES</h2>
        <div className="banner">
          {services.map((element) => (
            <div className="item" key={element.id}>
              <h3>{element.title}</h3>
              <img src={element.url} alt={element.title} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;