import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { calculateDiscount } from '../../utils/helpers';
import { Link } from 'react-router-dom';
import { Skeleton } from '../../components/ui/skeleton';
import { ShoppingBag, Heart, Trash2, MoveRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Wishlist = () => {
  const { 
    wishlist, 
    removeFromWishlist,
    moveToCart,
    loading
  } = useCart();

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

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="bg-gray-100 p-4 rounded-full mb-4">
        <Heart className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">Your wishlist is empty</h3>
      <p className="text-sm text-gray-500 mb-6 text-center">
        Items added to your wishlist will appear here.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
      >
        Start Shopping
      </Link>
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 p-4 bg-white rounded-lg shadow-sm">
          <Skeleton className="w-24 h-24 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/4 mb-4" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
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
          <div className="flex items-center justify-center gap-2 py-2">
            <Heart className="w-5 h-5" />
            <h1 className="text-xl font-semibold">My Wishlist ({wishlist.length})</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <motion.div
              key="wishlist"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {wishlist.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="space-y-4">
                  {wishlist.map((item) => (
                    <WishlistItem key={item.id} item={item} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Wishlist; 