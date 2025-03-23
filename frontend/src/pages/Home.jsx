import React from "react";
import { Link } from "react-scroll";

const Home = () => {
  const services = [
    { id: 1, url: "/img2.avif", title: "Birthday Planning" },
    { id: 2, url: "/img3.jpg", title: "Anniversary Planning" },
    { id: 3, url: "/img4.webp", title: "Camping Trip Planning" },
    { id: 4, url: "/img5.webp", title: "Game Night Planning" },
    { id: 5, url: "/img6.jpg", title: "Party Planning" },
    { id: 6, url: "/img1.jpg", title: "Wedding Planning" },
  ];

  return (
    <div>
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