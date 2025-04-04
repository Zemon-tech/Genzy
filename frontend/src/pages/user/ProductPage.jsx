import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import supabase from '../../config/supabase';
import ProductDetails from '../../components/product/ProductDetails';
import ProductDescription from '../../components/product/ProductDescription';
import RelatedProducts from '../../components/product/RelatedProducts';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { scrollToTop } from '../../utils/helpers';

const ProductPage = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [dragDirection, setDragDirection] = useState(0); // Track drag direction for animation

  useEffect(() => {
    // Scroll to top when component mounts or product ID changes
    scrollToTop();
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

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  const handleDrag = (_, info) => {
    // Update drag direction for visual feedback while dragging
    if (info.offset.x > 0) {
      setDragDirection(1); // Dragging right
    } else if (info.offset.x < 0) {
      setDragDirection(-1); // Dragging left
    } else {
      setDragDirection(0);
    }
  };

  const handleSwipe = (_, info) => {
    // If velocity is significant, it means the user swiped quickly
    if (info.velocity.x > 500 || info.offset.x > 100) {
      prevImage();
    } else if (info.velocity.x < -500 || info.offset.x < -100) {
      nextImage();
    }
    // Reset drag direction
    setDragDirection(0);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div className="min-h-screen bg-white">
      {/* Image Slider Section */}
      <div className="relative h-[70vh] bg-gray-100">
        <AnimatePresence initial={false}>
          <motion.div
            key={currentImageIndex}
            className="absolute inset-0"
            initial={{ opacity: 0, x: 100 }}
            animate={{ 
              opacity: 1, 
              x: 0,
              scale: dragDirection !== 0 ? 0.95 : 1 // Slight scale down when dragging
            }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.3}
            onDrag={handleDrag}
            onDragEnd={handleSwipe}
            style={{
              cursor: 'grab'
            }}
            whileTap={{ cursor: 'grabbing' }}
          >
            <img
              src={product.images[currentImageIndex]}
              alt={`${product.name} view ${currentImageIndex + 1}`}
              className="w-full h-full object-contain"
              draggable="false"
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <button
          onClick={prevImage}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md hover:bg-white transition-colors"
        >
          <HiChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextImage}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md hover:bg-white transition-colors"
        >
          <HiChevronRight className="w-6 h-6" />
        </button>

        {/* Swipe Instruction - Display briefly when page loads */}
        <motion.div 
          className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm"
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: 20 }}
          transition={{ delay: 2, duration: 0.8 }}
        >
          Swipe to view more images
        </motion.div>

        {/* Image Counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
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