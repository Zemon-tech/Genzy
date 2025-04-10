import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import PropTypes from 'prop-types';

const ImageCarousel = ({ images, slides, autoPlayInterval = 5000, showArrows = true }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 for next, -1 for previous
  const [isPressed, setIsPressed] = useState(false);
  const [displayTimer, setDisplayTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Reset the timer when the slide changes
  useEffect(() => {
    setDisplayTimer(0);
    const timer = setInterval(() => {
      // Only increment timer if not paused by user pressing
      if (!isPaused) {
        setDisplayTimer(prev => {
          // Increment timer until it reaches autoPlayInterval
          if (prev >= autoPlayInterval) return prev;
          return prev + 100; // Update every 100ms for smoother animation
        });
      }
    }, 100);
    
    return () => clearInterval(timer);
  }, [currentIndex, autoPlayInterval, isPaused]);

  const nextSlide = useCallback(() => {
    // Only auto-advance when the full interval has passed and not paused
    if (displayTimer < autoPlayInterval || isPaused) return;
    
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, [images.length, displayTimer, autoPlayInterval, isPaused]);

  // For manual navigation
  const manualNextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    setDisplayTimer(0); // Reset timer on manual navigation
  }, [images.length]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    setDisplayTimer(0); // Reset timer on manual navigation
  }, [images.length]);

  // Handle swipe gesture
  const handleSwipe = (event, swipeInfo) => {
    // Make sure offset exists and has x property before accessing
    if (swipeInfo && swipeInfo.offset && typeof swipeInfo.offset.x === 'number') {
      // If swipe distance is greater than 50px, trigger slide change
      if (swipeInfo.offset.x > 50) {
        prevSlide(); // Swipe right = go to previous
      } else if (swipeInfo.offset.x < -50) {
        manualNextSlide(); // Swipe left = go to next
      }
    }
  };

  // Simple action handler without pausing autoplay
  const handleManualNavigation = (action) => {
    action();
  };

  // Press-and-hold handlers
  const handlePointerDown = () => {
    setIsPressed(true);
    setIsPaused(true); // Pause the carousel on press
  };

  const handlePointerUp = () => {
    setIsPressed(false);
    setIsPaused(false); // Resume the carousel on release
  };

  // Set up autoplay interval that advances precisely after the full interval
  useEffect(() => {
    if (displayTimer >= autoPlayInterval) {
      nextSlide();
    }
  }, [displayTimer, nextSlide, autoPlayInterval]);

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? "5%" : "-5%",
      opacity: 0.5
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "tween", duration: 0.5 },
        opacity: { duration: 0.5 }
      }
    },
    exit: (direction) => ({
      x: direction > 0 ? "-5%" : "5%",
      opacity: 0.5,
      transition: {
        x: { type: "tween", duration: 0.5 },
        opacity: { duration: 0.5 }
      }
    })
  };

  // Calculate progress percentage for the progress bar
  const progressPercentage = (displayTimer / autoPlayInterval) * 100;

  return (
    <div 
      className="relative h-full overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={currentIndex}
          className="absolute inset-0 w-full h-full will-change-transform"
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleSwipe}
          style={{
            touchAction: 'pan-y', // Allow vertical scroll, but handle horizontal
            cursor: isPressed ? 'grabbing' : 'grab',
          }}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={images[currentIndex]}
              alt={`Slide ${currentIndex + 1}`}
              className="w-full h-full object-cover"
              draggable="false"
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
      {showArrows && (
        <>
          <button
            onClick={() => handleManualNavigation(prevSlide)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 backdrop-blur-sm text-white/90 hover:bg-black/40 transition-colors z-10"
          >
            <HiChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => handleManualNavigation(manualNextSlide)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 backdrop-blur-sm text-white/90 hover:bg-black/40 transition-colors z-10"
          >
            <HiChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Updated Dots Navigation - Moved closer to bottom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              handleManualNavigation(() => {
                setCurrentIndex(index);
                setDisplayTimer(0); // Reset timer when a dot is clicked
              });
            }}
            className="relative h-1.5 rounded-full transition-all duration-300 overflow-hidden"
            style={{
              width: index === currentIndex ? '1.5rem' : '0.375rem',
            }}
          >
            {/* Base layer - semi-transparent white */}
            <div className="absolute inset-0 bg-white/60" />

            {/* Progress bar - based on actual display time */}
            {index === currentIndex && (
              <motion.div
                className="absolute inset-0 bg-white origin-left"
                style={{ scaleX: progressPercentage / 100 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

ImageCarousel.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string).isRequired,
  slides: PropTypes.arrayOf(PropTypes.node).isRequired,
  autoPlayInterval: PropTypes.number,
  showArrows: PropTypes.bool
};

export default ImageCarousel; 