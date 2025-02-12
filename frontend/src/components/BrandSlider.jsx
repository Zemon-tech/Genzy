import React, { useEffect, useState, useRef } from 'react';

const BrandSlider = ({ brands }) => {
  const [position, setPosition] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollWidth = container.scrollWidth;
    const viewWidth = container.offsetWidth;
    const maxScroll = scrollWidth - viewWidth;

    const scroll = () => {
      setPosition((prev) => {
        const next = prev + 0.5;
        return next >= maxScroll ? 0 : next;
      });
    };

    const interval = setInterval(scroll, 16);
    return () => clearInterval(interval);
  }, [brands.length]);

  return (
    <div className="w-full overflow-hidden">
      <div 
        ref={containerRef}
        className="flex overflow-hidden whitespace-nowrap"
      >
        <div 
          className="flex gap-6 px-3 transition-transform duration-300 ease-linear"
          style={{ 
            transform: `translateX(-${position}px)`,
            willChange: 'transform'
          }}
        >
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="flex-shrink-0 w-20"
            >
              <img
                src={brand.logo}
                alt={brand.name}
                className="w-full h-7 object-contain grayscale hover:grayscale-0 transition-all duration-300"
              />
            </div>
          ))}
          {brands.map((brand) => (
            <div
              key={`${brand.id}-dup`}
              className="flex-shrink-0 w-20"
            >
              <img
                src={brand.logo}
                alt={brand.name}
                className="w-full h-7 object-contain grayscale hover:grayscale-0 transition-all duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrandSlider; 