import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigationType } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import supabase from '../../config/supabase';
import ProductDetails from '../../components/product/ProductDetails';
import RelatedProducts from '../../components/product/RelatedProducts';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Heart } from 'lucide-react';

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
  const { isAuthenticated } = useAuth();
  const { addToCart, addToWishlist, removeFromWishlist, wishlist } = useCart();
  
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
  const [showStickyButton, setShowStickyButton] = useState(true);
  const sliderRef = useRef(null);
  const prevIndexRef = useRef(0);
  const productActionsRef = useRef(null);

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

  // Add a scroll listener to hide the sticky button when product actions are visible
  useEffect(() => {
    const handleScroll = () => {
      if (productActionsRef.current) {
        const rect = productActionsRef.current.getBoundingClientRect();
        // If the product actions section is visible in the viewport
        // Hide the sticky button
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setShowStickyButton(false);
        } else {
          setShowStickyButton(true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // When product data is loaded, DON'T initialize the first size anymore
  useEffect(() => {
    // Don't auto-select size by default, let user choose
    // Just initialize other product-related state
    
    // Set quantity to 1
    setQuantity(1);
  }, [product]);

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to wishlist', {
        position: 'top-center',
        duration: 2000,
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '10px',
          padding: '16px'
        }
      });
      return;
    }
    
    try {
      const isCurrentlyWishlisted = wishlist && wishlist.some(item => item.id === product.id);
      if (isCurrentlyWishlisted) {
        await removeFromWishlist(product.id);
        toast.success('Removed from wishlist', {
          position: 'top-center',
          duration: 2000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '10px',
            padding: '16px'
          }
        });
      } else {
        await addToWishlist(product);
        toast.success('Added to wishlist', {
          position: 'top-center',
          duration: 2000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '10px',
            padding: '16px'
          }
        });
      }
    } catch (err) {
      toast.error('Error updating wishlist', {
        position: 'top-center',
        duration: 2000,
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '10px',
          padding: '16px'
        }
      });
      console.error('Wishlist update error:', err);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart', {
        position: 'top-center',
        duration: 2000,
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '10px',
          padding: '16px'
        }
      });
      return;
    }
    
    if (!selectedSize) {
      toast.error('Please select a size', {
        position: 'top-center',
        duration: 2000,
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '10px',
          padding: '16px'
        }
      });
      
      // Scroll to size selection
      const sizeElement = document.querySelector('[data-section="size-selection"]');
      if (sizeElement) {
        sizeElement.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      toast.error('Please select a color', {
        position: 'top-center',
        duration: 2000,
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '10px',
          padding: '16px'
        }
      });
      
      // Scroll to color selection
      const colorElement = document.querySelector('[data-section="color-selection"]');
      if (colorElement) {
        colorElement.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    
    await addToCart({
      ...product,
      selectedSize,
      selectedColor: product.colors && product.colors.length > 0 ? selectedColor : null,
      quantity
    });
    
    toast.success('Added to Cart', {
      position: 'top-center',
      duration: 2000,
      style: {
        background: '#333',
        color: '#fff',
        borderRadius: '10px',
        padding: '16px'
      }
    });
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

  const isWishlisted = wishlist && wishlist.some(item => item.id === product.id);

  return (
    <div className="min-h-screen bg-white flex justify-center">
      <div className="w-full max-w-[480px] flex flex-col relative">
        {/* Image Slider Section - Full width on mobile */}
        <div className="relative h-[60vh] w-full bg-gray-100 overflow-hidden">
          {/* Wishlist button on top right */}
          <button
            onClick={toggleWishlist}
            className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md"
            aria-label="Toggle wishlist"
          >
            {isWishlisted ? (
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            ) : (
              <Heart className="w-5 h-5" />
            )}
          </button>

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
                {product && (
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
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons with updated style */}
          {product && product.images?.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md hover:bg-white transition-colors z-10"
                aria-label="Previous image"
              >
                <HiChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md hover:bg-white transition-colors z-10"
                aria-label="Next image"
              >
                <HiChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Image Thumbnails */}
          {product && product.images?.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4">
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
                  className="relative h-1.5 rounded-full transition-all duration-300 overflow-hidden"
                  style={{
                    width: index === currentImageIndex ? '1.25rem' : '0.375rem',
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
          )}

          {/* Image Counter - Moved to the left */}
          {product && product.images?.length > 1 && (
            <div className="absolute top-4 left-4 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-10">
              {currentImageIndex + 1} / {product.images.length}
            </div>
          )}
        </div>

        {/* Product Details Section */}
        <div className="px-4 py-4 pb-20">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
              <div className="h-5 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-40 bg-gray-200 rounded mb-6"></div>
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
            </div>
          ) : error ? (
            <div className="text-red-500">Error: {error}</div>
          ) : !product ? (
            <div>Product not found</div>
          ) : (
            <div>
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
              
              {/* Add to Cart and Wishlist buttons */}
              <div ref={productActionsRef} className="space-y-3 mt-8 mb-20">
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-customBlack text-white py-3 rounded-full hover:bg-gray-900 transition-colors text-sm font-medium"
                >
                  Add to Cart
                </button>
                <button
                  onClick={toggleWishlist}
                  className={`w-full py-3 rounded-full border transition-colors text-sm font-medium flex items-center justify-center gap-2
                    ${isWishlisted 
                      ? 'border-red-500 text-red-500 hover:bg-red-50' 
                      : 'border-gray-300 text-gray-700 hover:border-gray-900'
                    }`}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500' : ''}`} />
                  {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                </button>
              </div>
            </div>
          )}
        </div>
      
        {/* Related Products */}
        <div className="mt-6 bg-gray-50 py-8 w-full">
          <div className="px-4">
            {product && (
              <RelatedProducts category={product.category} currentProductId={product.id} />
            )}
          </div>
        </div>
      </div>

      {/* Size Chart Modal - Keep this section */}
      <AnimatePresence>
        {product && isSizeChartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setIsSizeChartOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg p-4 w-full max-w-[90%] sm:max-w-[420px] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-bold">Size Chart</h3>
                <button 
                  onClick={() => setIsSizeChartOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              {/* Size Chart Images */}
              <div className="overflow-y-auto max-h-[70vh]">
                {product.size_chart ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <img 
                        src={product.size_chart} 
                        alt="Product Size Chart" 
                        className="max-w-full h-auto"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {product.sellers?.size_chart_image1_url || 
                     product.sellers?.size_chart_image2_url || 
                     product.sellers?.size_chart_image3_url ? (
                      <div className="space-y-4">
                        {product.sellers.size_chart_image1_url && (
                          <div className="flex justify-center">
                            <img 
                              src={product.sellers.size_chart_image1_url} 
                              alt="Size Chart 1" 
                              className="max-w-full h-auto"
                            />
                          </div>
                        )}
                        
                        {product.sellers.size_chart_image2_url && (
                          <div className="flex justify-center mt-4">
                            <img 
                              src={product.sellers.size_chart_image2_url} 
                              alt="Size Chart 2" 
                              className="max-w-full h-auto"
                            />
                          </div>
                        )}
                        
                        {product.sellers.size_chart_image3_url && (
                          <div className="flex justify-center mt-4">
                            <img 
                              src={product.sellers.size_chart_image3_url} 
                              alt="Size Chart 3" 
                              className="max-w-full h-auto"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500">No size chart available for this product.</p>
                        <p className="text-xs text-gray-400 mt-2">Please contact the seller for sizing information.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Add to Cart or Wishlist Button - Visible only when regular button is NOT in view */}
      {product && !loading && showStickyButton && (
        <div className="fixed bottom-16 left-0 right-0 z-30 flex justify-center">
          <div className="w-full max-w-[480px] px-4 py-3 bg-white border-t shadow-lg">
            {isWishlisted ? (
              <button
                onClick={toggleWishlist}
                className="w-full border border-red-500 text-red-500 py-3 rounded-full transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4 fill-red-500" />
                Remove from Wishlist
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                className="w-full bg-customBlack text-white py-3 rounded-full hover:bg-gray-900 transition-colors text-sm font-medium"
              >
                Add to Cart
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPage; 