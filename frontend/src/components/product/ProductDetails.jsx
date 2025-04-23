import { useState, useEffect } from 'react';
import { calculateDiscount } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';
import PropTypes from 'prop-types';

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
  const { isAuthenticated } = useAuth();
  const { addToCart, addToWishlist, removeFromWishlist, wishlist, loading } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Update wishlist state when wishlist data changes
  useEffect(() => {
    if (product && wishlist) {
      setIsWishlisted(wishlist.some(item => item.id === product.id));
    }
  }, [product, wishlist]);

  if (!product) {
    return <div>Loading...</div>;
  }

  const handleAddToCart = () => {
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
    
    // Check if size is selected
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
    
    // Check if color is selected (only if product has colors)
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
  };

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
      if (isWishlisted) {
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

  return (
    <div className="space-y-8">
      {/* Brand & Title */}
      <div>
        <h2 className="text-sm text-gray-500 uppercase tracking-wider">
          {product.sellers?.brand_name || 'Brand'}
        </h2>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">
          {product.name}
        </h1>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-4">
        <span className="text-2xl font-bold">₹{product.selling_price}</span>
        <span className="text-lg text-gray-500 line-through">₹{product.mrp}</span>
        {calculateDiscount(product.mrp, product.selling_price) > 0 && (
          <span className="text-green-600 font-medium">
            Save {calculateDiscount(product.mrp, product.selling_price)}%
          </span>
        )}
      </div>

      {/* Size Guide */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-900">Select Size</h3>
        <button 
          className="text-sm text-indigo-600 hover:text-indigo-700"
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
            className={`py-3 text-sm font-medium border rounded-md transition-colors
              ${selectedSize === size
                ? 'border-customBlack bg-customBlack text-white'
                : 'border-gray-300 hover:border-gray-900'
              }`}
          >
            {size}
          </button>
        ))}
      </div>

      {/* Colors - Only show if product has colors */}
      {product.colors && product.colors.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Select Color</h3>
          <div className="flex gap-3">
            {product.colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-10 h-10 rounded-full border-2 transition-all
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
        </div>
      ) : null}

      {/* Quantity */}
      <div>
        <h3 className="text-sm font-medium text-gray-900">Quantity</h3>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
          >
            -
          </button>
          <span className="w-12 text-center">{quantity}</span>
          <button
            onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
          >
            +
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4 pt-4">
        <button
          onClick={handleAddToCart}
          className="w-full bg-customBlack text-white py-4 rounded-full hover:bg-gray-900 transition-colors"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Add to Cart'}
        </button>
        <button
          onClick={toggleWishlist}
          className={`w-full py-4 rounded-full border transition-colors
            ${isWishlisted
              ? 'border-red-500 text-red-500 hover:bg-red-50'
              : 'border-gray-300 hover:border-gray-900'
            }`}
          disabled={loading}
        >
          {loading ? 'Loading...' : (isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist')}
        </button>
      </div>
    </div>
  );
};

ProductDetails.propTypes = {
  product: PropTypes.object.isRequired,
  selectedSize: PropTypes.string.isRequired,
  setSelectedSize: PropTypes.func.isRequired,
  selectedColor: PropTypes.string,
  setSelectedColor: PropTypes.func,
  quantity: PropTypes.number.isRequired,
  setQuantity: PropTypes.func.isRequired,
  openSizeChart: PropTypes.func.isRequired
};

export default ProductDetails; 