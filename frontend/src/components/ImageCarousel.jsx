import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ImageCarousel = ({ images, slides, autoPlayInterval = 5000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const progressTimerRef = useRef(null);
  const startTimeRef = useRef(null);
  const animationFrameRef = useRef(null);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setProgress(0);
    startTimeRef.current = Date.now();
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setProgress(0);
    startTimeRef.current = Date.now();
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setProgress(0);
    startTimeRef.current = Date.now();
  };

  // Optimize the animation logic
  useEffect(() => {
    let lastTime = Date.now();
    let rafId;

    const updateProgress = (timestamp) => {
      if (!isAutoPlaying) return;

      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      setProgress(prev => {
        const newProgress = prev + (deltaTime / autoPlayInterval) * 100;
        
        if (newProgress >= 100) {
          nextSlide();
          return 0;
        }
        return newProgress;
      });

      rafId = requestAnimationFrame(updateProgress);
    };

    if (isAutoPlaying) {
      rafId = requestAnimationFrame(updateProgress);
    }

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isAutoPlaying, autoPlayInterval]);

  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
    startTimeRef.current = Date.now();
  };

  return (
    <div 
      className="relative w-full h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Images */}
      <div className="relative h-full overflow-hidden">
        <div 
          className="flex h-full"
          style={{ 
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: 'transform 600ms cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'transform'
          }}
        >
          {images.map((image, index) => (
            <div
              key={index}
              className="w-full h-full flex-shrink-0 relative"
            >
              <img
                src={image}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Content Overlay for each slide */}
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-black/30 to-transparent">
                <div className="px-8 pb-12 text-white max-w-sm mx-auto text-center">
                  {slides[index]}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 group z-10"
      >
        <ChevronLeft className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          nextSlide();
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 group z-10"
      >
        <ChevronRight className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      </button>

      {/* Progress Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className="relative h-2 rounded-full overflow-hidden"
            style={{ width: index === currentIndex ? '24px' : '8px' }}
          >
            {/* Background bar */}
            <div className="absolute inset-0 bg-white/30" />
            
            {/* Progress bar */}
            {index === currentIndex && (
              <div 
                className="absolute inset-0 bg-white"
                style={{ 
                  transform: `scaleX(${progress / 100})`,
                  transformOrigin: 'left',
                  transition: 'transform 16ms linear'
                }}
              />
            )}
            
            {/* Inactive dots */}
            {index !== currentIndex && (
              <div className="absolute inset-0 bg-white/50 hover:bg-white/80 transition-colors" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel; 