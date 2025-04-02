import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { calculateDiscount } from '../../utils/helpers';
import { Link, useNavigate } from 'react-router-dom';
import { Skeleton } from '../../components/ui/skeleton';
import { ShoppingBag, Heart, Trash2, Plus, Minus, ShoppingBasket, Clock, CreditCard, Tag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SizeColorSelectionModal from '../../components/product/SizeColorSelectionModal';
import PropTypes from 'prop-types';

// Define PropTypes
const CartItemPropTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    images: PropTypes.arrayOf(PropTypes.string).isRequired,
    selling_price: PropTypes.number.isRequired,
    mrp: PropTypes.number.isRequired,
    selectedSize: PropTypes.string.isRequired,
    selectedColor: PropTypes.string.isRequired,
    delivery_time: PropTypes.number,
    quantity: PropTypes.number.isRequired
  }).isRequired
};

const WishlistItemPropTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    images: PropTypes.arrayOf(PropTypes.string).isRequired,
    selling_price: PropTypes.number.isRequired,
    mrp: PropTypes.number.isRequired
  }).isRequired
};

const EmptyStatePropTypes = {
  type: PropTypes.oneOf(['cart', 'wishlist']).isRequired
};

const Cart = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('cart');
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const { 
    cart, 
    wishlist, 
    removeFromCart, 
    updateQuantity, 
    removeFromWishlist,
    moveToCart,
    getMaxDeliveryTime,
    loading,
    activeWishlistItem,
    clearActiveWishlistItem,
    getPriceBreakdown,
    getFinalAmount,
    applyCoupon,
    removeCoupon,
    appliedCoupon,
    couponError,
    couponLoading
  } = useCart();

  // Handle size and color selection confirm
  const handleSelectionConfirm = (options) => {
    if (activeWishlistItem && options) {
      moveToCart(activeWishlistItem.id, options);
    }
  };

  const handleProceedToCheckout = () => {
    navigate('/checkout');
  };

  // Calculate the estimated delivery date
  const getEstimatedDeliveryDate = () => {
    const deliveryDays = getMaxDeliveryTime();
    
    if (!deliveryDays) return null;
    
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + deliveryDays);
    
    // Format the date as "Month Day, Year" (e.g., "May 28, 2023")
    return deliveryDate.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Handle coupon application
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setApplyingCoupon(true);
    try {
      const result = await applyCoupon(couponCode);
      if (result.success) {
        setCouponCode('');
      }
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Handle coupon removal
  const handleRemoveCoupon = () => {
    removeCoupon();
  };

  const CartItem = ({ item }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex gap-4 p-4 bg-white rounded-lg shadow-sm"
    >
      <Link to={`/product/${item.id}`} className="shrink-0">
        <img
          src={item.images[0]}
          alt={item.name}
          className="w-24 h-24 object-cover rounded-lg"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/product/${item.id}`}>
          <h3 className="text-sm font-medium text-gray-900 truncate hover:text-indigo-600 transition-colors">
            {item.name}
          </h3>
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-bold">₹{item.selling_price}</span>
          <span className="text-xs text-gray-500 line-through">₹{item.mrp}</span>
          {calculateDiscount(item.mrp, item.selling_price) > 0 && (
            <span className="text-xs font-medium px-1.5 py-0.5 bg-green-100 text-green-800 rounded">
              {calculateDiscount(item.mrp, item.selling_price)}% off
            </span>
          )}
        </div>
        <div className="mt-1 text-sm text-gray-500 space-x-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-800">
            Size: {item.selectedSize}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-800">
            Color: {item.selectedColor}
          </span>
        </div>
        {item.delivery_time && (
          <div className="mt-1 text-xs text-gray-600 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Delivers in {item.delivery_time} days</span>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => updateQuantity(
                item.id,
                item.selectedSize,
                item.selectedColor,
                Math.max(1, item.quantity - 1)
              )}
              className="p-1 rounded-md hover:bg-gray-200 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-medium">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(
                item.id,
                item.selectedSize,
                item.selectedColor,
                item.quantity + 1
              )}
              className="p-1 rounded-md hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)}
            className="text-red-600 hover:text-red-700 transition-colors inline-flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm">Remove</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
  
  CartItem.propTypes = CartItemPropTypes;

  const WishlistItem = ({ item }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex gap-4 p-4 bg-white rounded-lg shadow-sm"
    >
      <Link to={`/product/${item.id}`} className="shrink-0">
        <img
          src={item.images[0]}
          alt={item.name}
          className="w-24 h-24 object-cover rounded-lg"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/product/${item.id}`}>
          <h3 className="text-sm font-medium text-gray-900 truncate hover:text-indigo-600 transition-colors">
            {item.name}
          </h3>
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-bold">₹{item.selling_price}</span>
          <span className="text-xs text-gray-500 line-through">₹{item.mrp}</span>
          {calculateDiscount(item.mrp, item.selling_price) > 0 && (
            <span className="text-xs font-medium px-1.5 py-0.5 bg-green-100 text-green-800 rounded">
              {calculateDiscount(item.mrp, item.selling_price)}% off
            </span>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => moveToCart(item.id)}
            className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors inline-flex items-center gap-1"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Move to Cart</span>
          </button>
          <button
            onClick={() => removeFromWishlist(item.id)}
            className="text-sm text-red-600 hover:text-red-700 transition-colors inline-flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            <span>Remove</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
  
  WishlistItem.propTypes = WishlistItemPropTypes;

  const EmptyState = ({ type }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12 px-4"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        {type === 'cart' ? (
          <ShoppingBag className="w-8 h-8 text-gray-400" />
        ) : (
          <Heart className="w-8 h-8 text-gray-400" />
        )}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Your {type} is empty
      </h3>
      <p className="text-gray-500 mb-6">
        {type === 'cart' 
          ? "Looks like you haven't added any items to your cart yet."
          : "You haven't saved any items to your wishlist yet."}
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
      >
        <ShoppingBasket className="w-4 h-4" />
        <span>Start Shopping</span>
      </Link>
    </motion.div>
  );
  
  EmptyState.propTypes = EmptyStatePropTypes;

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div key={i} className="flex gap-4 p-4 bg-white rounded-lg">
          <Skeleton className="w-24 h-24 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/4 mb-4" />
            <Skeleton className="h-8 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('cart')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all ${
                activeTab === 'cart'
                  ? 'bg-black text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="font-medium">Cart ({cart.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all ${
                activeTab === 'wishlist'
                  ? 'bg-black text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Heart className="w-5 h-5" />
              <span className="font-medium">Wishlist ({wishlist.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <>
              {/* Cart Items */}
              {activeTab === 'cart' && (
                <motion.div
                  key="cart"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {cart.length === 0 ? (
                    <EmptyState type="cart" />
                  ) : (
                    <>
                      <div className="space-y-4 mb-6">
                        {cart.map((item) => (
                          <CartItem 
                            key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} 
                            item={item} 
                          />
                        ))}
                      </div>
                      
                      {/* Coupon Code Section */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 bg-white p-4 rounded-lg shadow-sm"
                      >
                        <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <Tag className="w-4 h-4 text-indigo-600" />
                          Apply Coupon
                        </h3>
                        
                        {appliedCoupon ? (
                          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm font-medium">
                                  {appliedCoupon.code}
                                </span>
                                <p className="text-xs text-gray-600 mt-1">
                                  {appliedCoupon.discount_type === 'percentage' 
                                    ? `${appliedCoupon.discount_value}% off` 
                                    : `₹${appliedCoupon.discount_value} off`}
                                  {appliedCoupon.brand_name && ` on ${appliedCoupon.brand_name} products`}
                                </p>
                              </div>
                              <button 
                                onClick={handleRemoveCoupon}
                                className="text-gray-500 hover:text-red-600 transition-colors"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                placeholder="Enter coupon code"
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              <button
                                onClick={handleApplyCoupon}
                                disabled={!couponCode.trim() || couponLoading || applyingCoupon}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:bg-indigo-300"
                              >
                                {applyingCoupon ? (
                                  <span className="inline-block h-4 w-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                                ) : (
                                  'Apply'
                                )}
                              </button>
                            </div>
                            {couponError && (
                              <p className="text-red-500 text-xs mt-1">{couponError}</p>
                            )}
                          </>
                        )}
                      </motion.div>
                      
                      {/* Price Summary with Checkout Button */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 bg-white p-6 rounded-lg shadow-sm space-y-4"
                      >
                        {/* Price breakdown */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span>₹{getPriceBreakdown().subtotal}</span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Delivery Fee</span>
                            <span>₹{getPriceBreakdown().shippingFee}</span>
                          </div>
                          
                          {getPriceBreakdown().couponDiscount > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                              <span className="flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                <span>Coupon Discount</span>
                              </span>
                              <span>- ₹{getPriceBreakdown().couponDiscount}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Cart total */}
                        <div className="flex justify-between items-center border-t pt-4">
                          <div>
                            <h3 className="font-medium text-lg">Total Amount</h3>
                            <p className="text-sm text-gray-500">Including delivery fee</p>
                          </div>
                          <div className="text-xl font-bold">₹{getFinalAmount()}</div>
                        </div>

                        {/* Delivery time estimate */}
                        {getMaxDeliveryTime() > 0 && (
                          <div className="flex items-center gap-3 text-gray-700 bg-gray-50 p-4 rounded-lg">
                            <Clock className="w-6 h-6 text-indigo-500" />
                            <div>
                              <h4 className="font-medium">Estimated Delivery</h4>
                              <p className="text-sm text-gray-600">
                                By {getEstimatedDeliveryDate()} 
                                <span className="text-xs text-gray-500 ml-1">
                                  (max {getMaxDeliveryTime()} days)
                                </span>
                              </p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-center mt-2">
                          <button 
                            onClick={handleProceedToCheckout}
                            className="w-full flex items-center justify-center gap-2 bg-black text-white py-4 rounded-lg hover:bg-gray-900 transition-colors"
                          >
                            <CreditCard className="w-5 h-5" />
                            <span>Proceed to Checkout</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </motion.div>
              )}

              {/* Wishlist Items */}
              {activeTab === 'wishlist' && (
                <motion.div
                  key="wishlist"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {wishlist.length === 0 ? (
                    <EmptyState type="wishlist" />
                  ) : (
                    <div className="space-y-4">
                      {wishlist.map((item) => (
                        <WishlistItem key={item.id} item={item} />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Size and Color Selection Modal */}
      <AnimatePresence>
        {activeWishlistItem && (
          <SizeColorSelectionModal
            isOpen={!!activeWishlistItem}
            onClose={clearActiveWishlistItem}
            product={activeWishlistItem}
            onConfirm={handleSelectionConfirm}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Cart; 