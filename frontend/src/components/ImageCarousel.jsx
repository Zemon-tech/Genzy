import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

const ImageCarousel = ({ images, slides, autoPlayInterval = 5000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1); // 1 for next, -1 for previous

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, [images.length]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  }, [images.length]);

  // Handle swipe gesture
  const handleSwipe = (swipeInfo) => {
    // If swipe distance is greater than 50px, trigger slide change
    if (swipeInfo.offset.x > 50) {
      handleManualNavigation(prevSlide); // Swipe right = go to previous
    } else if (swipeInfo.offset.x < -50) {
      handleManualNavigation(nextSlide); // Swipe left = go to next
    }
  };

  // Reset autoplay when manually interacted
  const handleManualNavigation = (action) => {
    setIsPaused(true);
    action();
    
    // Resume autoplay after 10 seconds of inactivity
    setTimeout(() => {
      setIsPaused(false);
    }, 10000);
  };

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [nextSlide, autoPlayInterval, isPaused]);

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? "100%" : "-100%",
    }),
    center: {
      x: 0,
    },
    exit: (direction) => ({
      x: direction > 0 ? "-100%" : "100%",
    }),
  };

  return (
    <div className="relative h-full overflow-hidden">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          className="absolute inset-0 w-full h-full"
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "tween", duration: 0.5, ease: "easeInOut" },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleSwipe}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={images[currentIndex]}
              alt={`Slide ${currentIndex + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>

          {/* Content - Moved to bottom middle */}
          <div className="absolute bottom-12 left-0 right-0 text-white text-center px-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {slides[currentIndex]}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <button
        onClick={() => handleManualNavigation(prevSlide)}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 backdrop-blur-sm text-white/90 hover:bg-black/40 transition-colors"
      >
        <HiChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={() => handleManualNavigation(nextSlide)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 backdrop-blur-sm text-white/90 hover:bg-black/40 transition-colors"
      >
        <HiChevronRight className="w-6 h-6" />
      </button>

      {/* Updated Dots Navigation - Moved closer to bottom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              handleManualNavigation(() => setCurrentIndex(index));
            }}
            className="relative h-1.5 rounded-full transition-all duration-300 overflow-hidden"
            style={{
              width: index === currentIndex ? '1.5rem' : '0.375rem',
            }}
          >
            {/* Base layer - semi-transparent white */}
            <div className="absolute inset-0 bg-white/60" />

            {/* Progress bar - only shown for active dot */}
            {index === currentIndex && !isPaused && (
              <motion.div
                className="absolute inset-0 bg-white origin-left"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: autoPlayInterval / 1000,
                  ease: "linear",
                  repeat: 0
                }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel; 