import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { calculateDiscount } from '../../utils/helpers';
import { Link } from 'react-router-dom';
import { Skeleton } from '../../components/ui/skeleton';
import { ShoppingBag, Heart, Trash2, Plus, Minus, MoveRight, ShoppingBasket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Cart = () => {
  const [activeTab, setActiveTab] = useState('cart');
  const { 
    cart, 
    wishlist, 
    removeFromCart, 
    updateQuantity, 
    removeFromWishlist,
    moveToCart,
    getCartTotal,
    loading
  } = useCart();

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
    <div className="min-h-screen bg-gray-50">
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
                      <div className="space-y-4">
                        {cart.map((item) => (
                          <CartItem 
                            key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} 
                            item={item} 
                          />
                        ))}
                      </div>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 bg-white p-6 rounded-lg shadow-sm"
                      >
                        <div className="flex justify-between items-center text-lg font-bold mb-6">
                          <span>Total Amount</span>
                          <span>₹{getCartTotal()}</span>
                        </div>
                        <button className="w-full flex items-center justify-center gap-2 bg-black text-white py-4 rounded-lg hover:bg-gray-900 transition-colors">
                          <span>Proceed to Checkout</span>
                          <MoveRight className="w-5 h-5" />
                        </button>
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
    </div>
  );
};

export default Cart; 