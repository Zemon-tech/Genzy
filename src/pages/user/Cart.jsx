import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';

const Cart = () => {
  // Mock cart items - in real app, this would come from a cart context/state
  const cartItems = [
    {
      id: 1,
      name: 'Classic White Shirt',
      price: 1499,
      quantity: 1,
      size: 'M',
      image: '/products/shirt1.jpg',
    },
    {
      id: 2,
      name: 'Black T-Shirt',
      price: 899,
      quantity: 2,
      size: 'L',
      image: '/products/tshirt1.jpg',
    },
  ];

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <div className="pb-32 pt-4">
      <h1 className="text-xl font-bold mb-4">Shopping Cart</h1>

      {/* Cart Items */}
      <div className="space-y-4">
        {cartItems.map((item) => (
          <div key={item.id} className="flex gap-4 py-4 border-b">
            {/* Product Image */}
            <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0"></div>

            {/* Product Details */}
            <div className="flex-1">
              <h3 className="font-medium">{item.name}</h3>
              <p className="text-gray-600 text-sm">Size: {item.size}</p>
              <p className="font-bold mt-1">₹{item.price}</p>

              {/* Quantity Controls */}
              <div className="flex items-center gap-4 mt-2">
                <button className="p-1 rounded-full bg-gray-100">
                  <Minus className="w-4 h-4" />
                </button>
                <span>{item.quantity}</span>
                <button className="p-1 rounded-full bg-gray-100">
                  <Plus className="w-4 h-4" />
                </button>
                <button className="p-1 rounded-full bg-gray-100 ml-auto">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      <div className="fixed bottom-16 left-0 right-0">
        <div className="max-w-md mx-auto bg-white border-t border-gray-200">
          <div className="px-4 py-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Total</span>
              <span className="text-xl font-bold">₹{calculateTotal()}</span>
            </div>
            <button className="w-full bg-black text-white py-3 rounded-full font-medium">
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>

      {/* Empty Cart State */}
      {cartItems.length === 0 && (
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="w-16 h-16 bg-gray-100 rounded-full mb-4 flex items-center justify-center">
            <Trash2 className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600">Your cart is empty</p>
        </div>
      )}
    </div>
  );
};

export default Cart; 