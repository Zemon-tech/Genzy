import { useState } from 'react';
import { calculateDiscount } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

const ProductDetails = ({
  product,
  selectedSize,
  setSelectedSize,
  selectedColor,
  setSelectedColor,
  quantity,
  setQuantity
}) => {
  const { user } = useAuth();
  const { addToCart, addToWishlist, removeFromWishlist, wishlist } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(
    wishlist.some(item => item.id === product.id)
  );

  if (!product) {
    return <div>Loading...</div>;
  }

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      toast.error('Please select size and color', {
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
      selectedColor,
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

  const toggleWishlist = () => {
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
    setIsWishlisted(!isWishlisted);
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
        <button className="text-sm text-indigo-600 hover:text-indigo-700">
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
                ? 'border-black bg-black text-white'
                : 'border-gray-300 hover:border-gray-900'
              }`}
          >
            {size}
          </button>
        ))}
      </div>

      {/* Colors */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Select Color</h3>
        <div className="flex gap-3">
          {product.colors.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`w-10 h-10 rounded-full border-2 transition-all
                ${selectedColor === color 
                  ? 'border-black scale-110' 
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
          className="w-full bg-black text-white py-4 rounded-full hover:bg-gray-900 transition-colors"
        >
          Add to Cart
        </button>
        <button
          onClick={toggleWishlist}
          className={`w-full py-4 rounded-full border transition-colors
            ${isWishlisted
              ? 'border-red-500 text-red-500 hover:bg-red-50'
              : 'border-gray-300 hover:border-gray-900'
            }`}
        >
          {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        </button>
      </div>
    </div>
  );
};

export default ProductDetails; 