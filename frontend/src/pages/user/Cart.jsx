import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { calculateDiscount } from '../../utils/helpers';
import { Link } from 'react-router-dom';

const Cart = () => {
  const [activeTab, setActiveTab] = useState('cart'); // 'cart' or 'wishlist'
  const { 
    cart, 
    wishlist, 
    removeFromCart, 
    updateQuantity, 
    removeFromWishlist,
    moveToCart,
    getCartTotal 
  } = useCart();

  const CartItem = ({ item }) => (
    <div className="flex gap-4 py-4 border-b">
      <Link to={`/product/${item.id}`} className="shrink-0">
        <img
          src={item.images[0]}
          alt={item.name}
          className="w-24 h-24 object-cover rounded-md"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/product/${item.id}`}>
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {item.name}
          </h3>
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-bold">₹{item.selling_price}</span>
          <span className="text-xs text-gray-500 line-through">₹{item.mrp}</span>
          {calculateDiscount(item.mrp, item.selling_price) > 0 && (
            <span className="text-xs text-green-600">
              ({calculateDiscount(item.mrp, item.selling_price)}% off)
            </span>
          )}
        </div>
        <div className="mt-1 text-sm text-gray-500">
          Size: {item.selectedSize}, Color: {item.selectedColor}
        </div>
        <div className="mt-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateQuantity(
                item.id,
                item.selectedSize,
                item.selectedColor,
                Math.max(1, item.quantity - 1)
              )}
              className="p-1 rounded bg-gray-100 hover:bg-gray-200"
            >
              -
            </button>
            <span className="w-8 text-center">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(
                item.id,
                item.selectedSize,
                item.selectedColor,
                item.quantity + 1
              )}
              className="p-1 rounded bg-gray-100 hover:bg-gray-200"
            >
              +
            </button>
          </div>
          <button
            onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)}
            className="text-red-600 text-sm hover:text-red-700"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );

  const WishlistItem = ({ item }) => (
    <div className="flex gap-4 py-4 border-b">
      <Link to={`/product/${item.id}`} className="shrink-0">
        <img
          src={item.images[0]}
          alt={item.name}
          className="w-24 h-24 object-cover rounded-md"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/product/${item.id}`}>
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {item.name}
          </h3>
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-bold">₹{item.selling_price}</span>
          <span className="text-xs text-gray-500 line-through">₹{item.mrp}</span>
          {calculateDiscount(item.mrp, item.selling_price) > 0 && (
            <span className="text-xs text-green-600">
              ({calculateDiscount(item.mrp, item.selling_price)}% off)
            </span>
          )}
        </div>
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => moveToCart(item.id)}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            Move to Cart
          </button>
          <button
            onClick={() => removeFromWishlist(item.id)}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      {/* Tabs */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setActiveTab('cart')}
          className={`flex-1 py-2 text-center rounded-md ${
            activeTab === 'cart'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-600'
          }`}
        >
          Cart ({cart.length})
        </button>
        <button
          onClick={() => setActiveTab('wishlist')}
          className={`flex-1 py-2 text-center rounded-md ${
            activeTab === 'wishlist'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-600'
          }`}
        >
          Wishlist ({wishlist.length})
        </button>
      </div>

      {/* Cart Items */}
      {activeTab === 'cart' && (
        <div>
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Your cart is empty</p>
              <Link
                to="/"
                className="mt-4 inline-block text-indigo-600 hover:text-indigo-700"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {cart.map((item) => (
                  <CartItem key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} item={item} />
                ))}
              </div>
              <div className="mt-6 bg-white p-4 rounded-md">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>₹{getCartTotal()}</span>
                </div>
                <button
                  className="w-full mt-4 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700"
                >
                  Proceed to Checkout
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Wishlist Items */}
      {activeTab === 'wishlist' && (
        <div>
          {wishlist.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Your wishlist is empty</p>
              <Link
                to="/"
                className="mt-4 inline-block text-indigo-600 hover:text-indigo-700"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {wishlist.map((item) => (
                <WishlistItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Cart; 