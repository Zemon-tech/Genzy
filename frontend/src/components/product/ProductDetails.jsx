import { useState } from 'react';
import { calculateDiscount } from '../../utils/helpers';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';
import PropTypes from 'prop-types';
import { Clock, Truck, Award, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProductDetails = ({
  product,
  selectedSize,
  setSelectedSize,
  selectedColor,
  setSelectedColor,
  quantity,
  setQuantity,
  openSizeChart
}) => {
  const { addToCart, loading } = useCart();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [showSelectionPopup, setShowSelectionPopup] = useState(false);

  if (!product) {
    return <div>Loading...</div>;
  }

  // Truncate description for initial view
  const truncateDescription = (text, wordLimit = 15) => {
    if (!text) return '';
    const words = text.split(/\s+/);
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  const handleAddToCartFromPopup = () => {
    // Validate selections
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
      return;
    }
    
    addToCart({
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
    
    setShowSelectionPopup(false);
  };

  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  return (
    <div className="space-y-5">
      {/* Brand & Title */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm text-gray-500 uppercase tracking-wider">
            {product.sellers?.brand_name || 'Brand'}
          </h2>
          <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded text-xs text-green-700">
            <Award className="w-3 h-3" />
            <span>Verified Seller</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mt-1">
          {product.name}
        </h1>
      </div>

      {/* Price Section with Delivery Info */}
      <div className="space-y-2 pb-2 border-b border-gray-100">
        {/* Price */}
        <div className="flex items-baseline gap-4">
          <span className="text-xl font-bold">₹{product.selling_price}</span>
          <span className="text-base text-gray-500 line-through">₹{product.mrp}</span>
          {calculateDiscount(product.mrp, product.selling_price) > 0 && (
            <span className="text-green-600 font-medium text-sm">
              {calculateDiscount(product.mrp, product.selling_price)}% off
            </span>
          )}
        </div>

        {/* Delivery & Shipping Info - Remove return policy */}
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>{product.estimated_delivery || '3-5 working days'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Truck className="w-3.5 h-3.5 text-gray-400" />
            <span>Shipping: ₹{product.shipping_charges || 'Free'}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="py-2 border-b border-gray-100">
        <p className="text-sm text-gray-600">
          {showFullDescription ? product.description : truncateDescription(product.description)}
          {product.description && product.description.split(/\s+/).length > 15 && (
            <button 
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="ml-1 text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {showFullDescription ? 'Show less' : 'Read more'}
            </button>
          )}
        </p>
      </div>

      {/* Size Selection - Only visible in main view */}
      {!showSelectionPopup && (
        <div className="py-2 border-b border-gray-100" data-section="size-selection">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-900">Select Size</h3>
            <button 
              className="text-xs text-indigo-600 hover:text-indigo-700"
              onClick={openSizeChart}
            >
              Size Guide
            </button>
          </div>

          {/* Sizes */}
          <div className="grid grid-cols-5 gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`py-2 text-sm font-medium border rounded-md transition-colors
                  ${selectedSize === size
                    ? 'border-customBlack bg-customBlack text-white'
                    : 'border-gray-300 hover:border-gray-900'
                  }`}
              >
                {size}
              </button>
            ))}
          </div>
          {!selectedSize && (
            <p className="mt-2 text-xs text-red-500">Please select a size</p>
          )}
        </div>
      )}

      {/* Colors - Only visible in main view and only if product has colors */}
      {!showSelectionPopup && product.colors && product.colors.length > 0 && (
        <div className="py-2 border-b border-gray-100" data-section="color-selection">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Select Color</h3>
          <div className="flex gap-3">
            {product.colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-9 h-9 rounded-full border-2 transition-all
                  ${selectedColor === color 
                    ? 'border-customBlack scale-110' 
                    : 'border-transparent hover:scale-110'
                  }`}
              >
                <span
                  className="block w-full h-full rounded-full"
                  style={{ backgroundColor: color.toLowerCase() }}
                />
              </button>
            ))}
          </div>
          {!selectedColor && (
            <p className="mt-2 text-xs text-red-500">Please select a color</p>
          )}
        </div>
      )}

      {/* Quantity - Only visible in main view */}
      {!showSelectionPopup && (
        <div className="py-2 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Quantity</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
            >
              -
            </button>
            <span className="w-10 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
              className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Collapsible Sections */}
      <div className="space-y-2">
        {/* Features & Specifications */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button 
            onClick={() => toggleSection('specs')}
            className="w-full flex justify-between items-center p-3 text-left hover:bg-gray-50"
          >
            <h3 className="font-medium text-sm">Features & Specifications</h3>
            <span>{expandedSection === 'specs' ? '−' : '+'}</span>
          </button>
          
          {expandedSection === 'specs' && (
            <div className="p-3 pt-0 border-t text-xs text-gray-600">
              <ul className="space-y-2">
                <li><span className="font-medium">Style Type:</span> {product.style_type}</li>
                {product.colors?.length > 0 && (
                  <li><span className="font-medium">Available Colors:</span> {product.colors.join(', ')}</li>
                )}
                <li><span className="font-medium">Available Sizes:</span> {product.sizes.join(', ')}</li>
                <li><span className="font-medium">Gender:</span> {product.gender || 'Unisex'}</li>
                {product.stock_quantity && (
                  <li><span className="font-medium">In Stock:</span> {product.stock_quantity} units</li>
                )}
              </ul>
            </div>
          )}
        </div>
        
        {/* Shipping & Returns */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button 
            onClick={() => toggleSection('shipping')}
            className="w-full flex justify-between items-center p-3 text-left hover:bg-gray-50"
          >
            <h3 className="font-medium text-sm">Delivery & Returns</h3>
            <span>{expandedSection === 'shipping' ? '−' : '+'}</span>
          </button>
          
          {expandedSection === 'shipping' && (
            <div className="p-3 pt-0 border-t text-xs text-gray-600">
              <div className="space-y-2">
                <div>
                  <p>Estimated Delivery: {product.estimated_delivery || '3-5 working days'}</p>
                  <p>Shipping Charges: ₹{product.shipping_charges || 'Free'}</p>
                  <p>Return Policy: {product.return_policy || '7 days return'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Seller Information */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button 
            onClick={() => toggleSection('seller')}
            className="w-full flex justify-between items-center p-3 text-left hover:bg-gray-50"
          >
            <h3 className="font-medium text-sm">Seller Information</h3>
            <span>{expandedSection === 'seller' ? '−' : '+'}</span>
          </button>
          
          {expandedSection === 'seller' && (
            <div className="p-3 pt-0 border-t text-xs text-gray-600">
              <div className="space-y-2">
                <p><span className="font-medium">Brand:</span> {product.sellers?.brand_name || 'Brand'}</p>
                <p><span className="font-medium">Email:</span> {product.sellers?.business_email || 'Not available'}</p>
                <p><span className="font-medium">Contact:</span> {product.sellers?.phone_number || 'Not available'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selection Popup - Shows when adding to cart without selecting required options */}
      <AnimatePresence>
        {showSelectionPopup && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowSelectionPopup(false)}
            />
            
            {/* Popup */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5 z-50 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Select Options</h3>
                <button 
                  onClick={() => setShowSelectionPopup(false)}
                  className="p-1 rounded-full bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-5">
                {/* Size Selection */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Select Size</h4>
                    <button 
                      className="text-xs text-indigo-600"
                      onClick={() => {
                        setShowSelectionPopup(false);
                        openSizeChart();
                      }}
                    >
                      Size Guide
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`py-2 text-sm font-medium border rounded-md transition-colors
                          ${selectedSize === size
                            ? 'border-customBlack bg-customBlack text-white'
                            : 'border-gray-300 hover:border-gray-900'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  {!selectedSize && (
                    <p className="mt-2 text-xs text-red-500">Please select a size</p>
                  )}
                </div>
                
                {/* Color Selection - Only if product has colors */}
                {product.colors && product.colors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Select Color</h4>
                    <div className="flex gap-3">
                      {product.colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`w-9 h-9 rounded-full border-2 transition-all
                            ${selectedColor === color 
                              ? 'border-customBlack scale-110' 
                              : 'border-transparent hover:scale-110'
                            }`}
                        >
                          <span
                            className="block w-full h-full rounded-full"
                            style={{ backgroundColor: color.toLowerCase() }}
                          />
                        </button>
                      ))}
                    </div>
                    {!selectedColor && (
                      <p className="mt-2 text-xs text-red-500">Please select a color</p>
                    )}
                  </div>
                )}
                
                {/* Quantity Selection */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Quantity</h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
                    >
                      -
                    </button>
                    <span className="w-10 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                      className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="pt-2">
                  <button
                    onClick={handleAddToCartFromPopup}
                    className="w-full bg-customBlack text-white py-3 rounded-full hover:bg-gray-900 transition-colors text-sm"
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

ProductDetails.propTypes = {
  product: PropTypes.object.isRequired,
  selectedSize: PropTypes.string,
  setSelectedSize: PropTypes.func.isRequired,
  selectedColor: PropTypes.string,
  setSelectedColor: PropTypes.func.isRequired,
  quantity: PropTypes.number.isRequired,
  setQuantity: PropTypes.func.isRequired,
  openSizeChart: PropTypes.func.isRequired
};

export default ProductDetails; 