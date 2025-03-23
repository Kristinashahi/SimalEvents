import React from 'react'

const Services = () => {
    const services = [
      {
        id: 1,
        url: "/img2.avif",
        title: "Birthday Planning",
      },
      {
        id: 2, 
        url: "/img3.jpg",
        title: "Anniversary Planning",
      },
      {
        id: 3,
        url: "/img4.webp",
        title: "Camping Trip Planning",
      },
      {
        id: 4,
        url: "/img5.webp",
        title: "Game Night Planning",
      },
      {
        id: 5,
        url: "/img6.jpg",
        title: "Party Planning",
      },
      {
        id: 6,
        url: "/img1.jpg",
        title: "Wedding Planning",
      },
    ];
    return (
        <>
          <div className="services container">
            <h2>OUR SERVICES</h2>
            <div className="banner">
              {services.map((element) => {
                return (
                  <div className="item" key={element.id}>
                    <h3>{element.title}</h3>
                    <img src={element.url} alt={element.title} />
                  </div>
                );
              })}
            </div>
          </div>
        </>
      );
    };
    

export default Services;