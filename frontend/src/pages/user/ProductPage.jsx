import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigationType } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import supabase from '../../config/supabase';
import ProductDetails from '../../components/product/ProductDetails';
import ProductDescription from '../../components/product/ProductDescription';
import RelatedProducts from '../../components/product/RelatedProducts';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

// Track navigation direction globally to ensure consistent animations
const DirectionContext = {
  current: 1, // Default direction (1 = forward, -1 = backward)
  set: function(dir) {
    this.current = dir;
  }
};

const ProductPage = () => {
  const { productId } = useParams();
  const navigationType = useNavigationType();
  // Check if we're returning to this page (POP navigation)
  const isReturningToPage = navigationType === 'POP';
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [displayTimer, setDisplayTimer] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [isPaused, setIsPaused] = useState(false);
  const sliderRef = useRef(null);
  const prevIndexRef = useRef(0);

  // Preload all product images when product data is received
  useEffect(() => {
    if (product && product.images) {
      const preloadImages = async () => {
        const newLoadedState = {...imagesLoaded};
        
        // Create promise for each image
        const loadPromises = product.images.map((src, index) => {
          return new Promise((resolve) => {
            // Skip if already loaded
            if (newLoadedState[index]) {
              resolve();
              return;
            }
            
            const img = new Image();
            img.src = src; // No need for cache-busting, we're preloading
            img.onload = () => {
              newLoadedState[index] = true;
              resolve();
            };
            img.onerror = () => {
              newLoadedState[index] = false;
              resolve();
            };
          });
        });
        
        // Prioritize loading current image and adjacent ones first (preload strategy)
        if (product.images.length > 1) {
          const nextIndex = (currentImageIndex + 1) % product.images.length;
          const prevIndex = (currentImageIndex - 1 + product.images.length) % product.images.length;
          
          // Load current image first
          await loadPromises[currentImageIndex];
          setImagesLoaded(prev => ({...prev, [currentImageIndex]: true}));
          
          // Then load next and previous images
          await Promise.all([loadPromises[nextIndex], loadPromises[prevIndex]]);
          setImagesLoaded(prev => ({
            ...prev, 
            [nextIndex]: true, 
            [prevIndex]: true
          }));
          
          // Then load the rest
          await Promise.all(loadPromises);
          setImagesLoaded(newLoadedState);
        } else {
          // Only one image, just load it
          await Promise.all(loadPromises);
          setImagesLoaded(newLoadedState);
        }
      };
      
      preloadImages();
    }
  }, [product, currentImageIndex]);

  useEffect(() => {
    // We're now handling scroll position globally with the router
    // scrollToTop();
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, sellers(*)') 
        .eq('id', productId)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine the actual direction based on current and target index
  const determineDirection = (currentIdx, targetIdx, totalLength) => {
    if (currentIdx === targetIdx) return 1; // Default to forward on same index
    
    // Handle wrap-around cases specifically
    if (currentIdx === 0 && targetIdx === totalLength - 1) {
      return -1; // Going from first to last is backward
    }
    if (currentIdx === totalLength - 1 && targetIdx === 0) {
      return 1; // Going from last to first is forward
    }
    
    // Normal case - compare indices
    return targetIdx > currentIdx ? 1 : -1;
  };

  // Auto-advance next image after the interval
  const autoNextImage = () => {
    if (!product?.images?.length) return;
    
    const nextIdx = (currentImageIndex + 1) % product.images.length;
    // Always set direction to forward (1) when auto-advancing
    DirectionContext.set(1);
    prevIndexRef.current = currentImageIndex;
    setCurrentImageIndex(nextIdx);
  };

  // Manual navigation - immediately go to next image and reset timer
  const nextImage = () => {
    if (!product?.images?.length) return;
    
    const nextIdx = (currentImageIndex + 1) % product.images.length;
    // Always set direction to forward (1) when explicitly going forward
    DirectionContext.set(1);
    prevIndexRef.current = currentImageIndex;
    setCurrentImageIndex(nextIdx);
    setDisplayTimer(0); // Reset the timer on manual navigation
  };

  // Manual navigation - immediately go to previous image and reset timer
  const prevImage = () => {
    if (!product?.images?.length) return;
    
    const prevIdx = (currentImageIndex - 1 + product.images.length) % product.images.length;
    // Always set direction to backward (-1) when explicitly going backward
    DirectionContext.set(-1);
    prevIndexRef.current = currentImageIndex;
    setCurrentImageIndex(prevIdx);
    setDisplayTimer(0); // Reset the timer on manual navigation
  };

  // Timer for controlling how long each image displays
  useEffect(() => {
    if (!product?.images?.length) return;
    
    // Reset timer when image changes
    setDisplayTimer(0);
    
    // Update timer every 100ms for smooth progress
    const timerInterval = 100; // ms
    const autoPlayInterval = 5000; // 5 seconds between slides
    
    const timer = setInterval(() => {
      // Only update timer if not paused
      if (!isPaused) {
        setDisplayTimer(prev => {
          // Once we reach the autoPlayInterval, trigger next image
          if (prev >= autoPlayInterval) {
            autoNextImage();
            return 0;
          }
          return prev + timerInterval;
        });
      }
    }, timerInterval);
    
    // Clean up timer when component unmounts or image changes
    return () => clearInterval(timer);
  }, [currentImageIndex, product, isPaused]);

  const handleDragStart = () => {
    setIsDragging(true);
    setIsPaused(true); // Pause when dragging starts
  };

  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    setIsPaused(false); // Resume when dragging ends
    
    // Make sure info and offset exist before accessing properties
    if (!info || !info.offset) return;
    
    // Use velocity to determine swipe intent - high velocity = clear swipe intent
    if (info.velocity.x > 300) {
      prevImage(); // Swiping right goes to previous
    } else if (info.velocity.x < -300) {
      nextImage(); // Swiping left goes to next
    } 
    // If velocity is low but distance is significant, also trigger swipe
    else if (info.offset.x > 80) {
      prevImage(); // Swiping right goes to previous
    } else if (info.offset.x < -80) {
      nextImage(); // Swiping left goes to next
    } 
    // Otherwise no action needed, it will snap back automatically
  };

  // Add press/touch handlers to pause timer
  const handlePress = () => {
    setIsPaused(true);
  };

  const handleRelease = () => {
    setIsPaused(false);
  };

  // Calculate progress for thumbnail indicators
  const progressPercentage = displayTimer / 5000; // Based on 5 second default

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!product) return <div>Product not found</div>;

  // Image transition variants
  const imageVariants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0.5,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 }
      }
    },
    exit: (direction) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0.5,
      scale: 0.95,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 }
      }
    }),
    // Add a "none" variant for when we're returning to the page
    none: {
      x: 0,
      opacity: 1,
      scale: 1
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Image Slider Section */}
      <div className="relative h-[70vh] bg-gray-100 overflow-hidden">
        {/* Loading indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          {!imagesLoaded[currentImageIndex] && (
            <div className="flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
              <div className="mt-4 text-gray-600">Loading image...</div>
            </div>
          )}
        </div>
            
        <AnimatePresence initial={!isReturningToPage} custom={DirectionContext.current} mode="popLayout">
          <motion.div
            ref={sliderRef}
            key={currentImageIndex}
            className="absolute inset-0 touch-manipulation will-change-transform"
            custom={DirectionContext.current}
            variants={imageVariants}
            initial={isReturningToPage ? "none" : "enter"}
            animate="center"
            exit={isReturningToPage ? "none" : "exit"}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.4}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onPointerDown={handlePress}
            onPointerUp={handleRelease}
            onPointerLeave={handleRelease}
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              touchAction: 'pan-y', // Allow vertical scroll, but handle horizontal
            }}
            onDrag={(_, info) => {
              // Make sure info exists before accessing properties
              if (!info || !info.offset) return;
              // Visual feedback during drag - set direction based on drag direction
              DirectionContext.set(info.offset.x > 0 ? -1 : 1);
            }}
          >
            <div className="w-full h-full overflow-hidden">
              <motion.img
                src={product.images[currentImageIndex]}
                alt={`${product.name} view ${currentImageIndex + 1}`}
                className="w-full h-full object-contain will-change-transform"
                draggable="false"
                style={{ pointerEvents: "none" }} 
                initial={isReturningToPage ? { opacity: 1 } : { opacity: 0 }}
                animate={{ 
                  opacity: imagesLoaded[currentImageIndex] ? 1 : 0,
                  transition: isReturningToPage ? { duration: 0 } : { duration: 0.3 }
                }}
                onError={() => {
                  // Handle image load error by setting to not loaded
                  setImagesLoaded(prev => ({...prev, [currentImageIndex]: false}));
                }}
              />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons with updated style */}
        <button
          onClick={prevImage}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md hover:bg-white transition-colors z-10"
          aria-label="Previous image"
        >
          <HiChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextImage}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md hover:bg-white transition-colors z-10"
          aria-label="Next image"
        >
          <HiChevronRight className="w-6 h-6" />
        </button>

        {/* Image Thumbnails */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 px-4">
          {product.images.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                // Set direction based on which thumbnail is clicked relative to current image
                const direction = determineDirection(
                  currentImageIndex, 
                  index, 
                  product.images.length
                );
                DirectionContext.set(direction);
                prevIndexRef.current = currentImageIndex;
                setCurrentImageIndex(index);
                setDisplayTimer(0); // Reset timer when a thumbnail is clicked
              }}
              className="relative h-2 rounded-full transition-all duration-300 overflow-hidden"
              style={{
                width: index === currentImageIndex ? '1.5rem' : '0.375rem',
              }}
              aria-label={`Go to image ${index + 1}`}
            >
              {/* Base indicator */}
              <div className="absolute inset-0 bg-gray-400" />
              
              {/* Active indicator with progress */}
              {index === currentImageIndex && (
                <div 
                  className="absolute inset-0 bg-black origin-left" 
                  style={{ 
                    transform: `scaleX(${progressPercentage})` 
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Image Counter */}
        <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm z-10">
          {currentImageIndex + 1} / {product.images.length}
        </div>
      </div>

      {/* Product Details Section */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <ProductDetails
          product={product}
          selectedSize={selectedSize}
          setSelectedSize={setSelectedSize}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          quantity={quantity}
          setQuantity={setQuantity}
          openSizeChart={() => setIsSizeChartOpen(true)}
        />
        
        {/* Product Description Tabs */}
        <div className="mt-12">
          <ProductDescription 
            product={product} 
            isChartOpen={isSizeChartOpen}
            setIsChartOpen={setIsSizeChartOpen}
          />
        </div>
      </div>
      
      {/* Related Products */}
      <div className="mt-16 bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <RelatedProducts category={product.category} currentProductId={product.id} />
        </div>
      </div>
    </div>
  );
};

export default ProductPage; 