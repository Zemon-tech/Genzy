import { useEffect, useState, useRef } from 'react';

const BrandSlider = ({ brands }) => {
  const [position, setPosition] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollWidth = container.scrollWidth;
    const viewWidth = container.offsetWidth;
    const totalBrands = brands.length;
    const brandWidth = viewWidth / 3; // Show 3 brands at a time on mobile
    const maxScroll = totalBrands * brandWidth;

    const scroll = () => {
      setPosition((prev) => {
        const next = prev + 1;
        return next >= maxScroll ? 0 : next;
      });
    };

    const interval = setInterval(scroll, 30);
    return () => clearInterval(interval);
  }, [brands.length]);

  return (
    <div className="relative overflow-hidden bg-white py-4">
      <div className="max-w-screen-md mx-auto px-2">
        <div 
          ref={containerRef}
          className="relative"
        >
          <div 
            className="flex transition-transform duration-300 ease-linear"
            style={{ 
              transform: `translateX(-${position}px)`,
            }}
          >
            {/* Original brands */}
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="flex-shrink-0 w-1/3 px-2" // Reduced padding
              >
                <div className="aspect-[3/2] flex items-center justify-center bg-white rounded-lg p-3">
                  <img 
                    src={brand.logo} 
                    alt={brand.name}
                    className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                  />
                </div>
              </div>
            ))}
            {/* Duplicate brands for seamless loop */}
            {brands.map((brand) => (
              <div
                key={`${brand.id}-dup`}
                className="flex-shrink-0 w-1/3 px-2" // Reduced padding
              >
                <div className="aspect-[3/2] flex items-center justify-center bg-white rounded-lg p-3">
                  <img 
                    src={brand.logo} 
                    alt={brand.name}
                    className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Gradient overlays */}
      <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white to-transparent" />
      <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent" />
    </div>
  );
};

export default BrandSlider; 