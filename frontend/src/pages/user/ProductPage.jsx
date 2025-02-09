import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import supabase from '../../config/supabase';
import ProductDetails from '../../components/product/ProductDetails';
import RelatedProducts from '../../components/product/RelatedProducts';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

const ProductPage = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);

  useEffect(() => {
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

  const handleSwipe = (swipeInfo) => {
    if (swipeInfo.offset.x > 50) {
      prevImage();
    } else if (swipeInfo.offset.x < -50) {
      nextImage();
    }
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
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleSwipe}
          >
            <img
              src={product.images[currentImageIndex]}
              alt={`${product.name} view ${currentImageIndex + 1}`}
              className="w-full h-full object-contain"
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <button
          onClick={prevImage}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full"
        >
          <HiChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextImage}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full"
        >
          <HiChevronRight className="w-6 h-6" />
        </button>

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
        />

        {/* Additional Info */}
        <div className="mt-8 space-y-6">
          {/* Description */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-2">Description</h3>
            <p className="text-gray-600">{product.description}</p>
          </div>

          {/* Features */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-2">Features</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Style Type: {product.style_type}</li>
              <li>Material: Premium Cotton</li>
              <li>Fit: Regular</li>
            </ul>
          </div>

          {/* Delivery */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-2">Delivery & Returns</h3>
            <div className="space-y-2 text-gray-600">
              <p>• Free shipping on orders above ₹999</p>
              <p>• Estimated delivery: {product.estimated_delivery}</p>
              <p>• {product.return_policy}</p>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className="py-16">
          <h2 className="text-2xl font-bold mb-8">Complete the Look</h2>
          <RelatedProducts 
            category={product.category}
            currentProductId={productId}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductPage; 