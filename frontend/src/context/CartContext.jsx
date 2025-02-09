import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  const [wishlist, setWishlist] = useState(() => {
    const savedWishlist = localStorage.getItem('wishlist');
    return savedWishlist ? JSON.parse(savedWishlist) : [];
  });

  // Save to localStorage whenever cart or wishlist changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(
        item => 
          item.id === product.id && 
          item.selectedSize === product.selectedSize &&
          item.selectedColor === product.selectedColor
      );

      if (existingItem) {
        // If item exists, update quantity
        return prevCart.map(item =>
          item === existingItem
            ? { ...item, quantity: item.quantity + (product.quantity || 1) }
            : item
        );
      }

      // If item doesn't exist, add new item
      return [...prevCart, { ...product, quantity: product.quantity || 1 }];
    });
  };

  const removeFromCart = (productId, size, color) => {
    setCart(prevCart =>
      prevCart.filter(
        item => 
          !(item.id === productId && 
            item.selectedSize === size && 
            item.selectedColor === color)
      )
    );
  };

  const updateQuantity = (productId, size, color, newQuantity) => {
    if (newQuantity < 1) return; // Prevent negative quantities
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId && 
        item.selectedSize === size && 
        item.selectedColor === color
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const addToWishlist = (product) => {
    setWishlist(prev => {
      // Check if product already exists in wishlist
      if (prev.some(item => item.id === product.id)) return prev;
      return [...prev, product];
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlist(prev => prev.filter(item => item.id !== productId));
  };

  const moveToCart = (productId) => {
    const wishlistItem = wishlist.find(item => item.id === productId);
    
    if (!wishlistItem) return;

    // Check if item already exists in cart
    const existingCartItem = cart.find(item => 
      item.id === productId &&
      item.selectedSize === wishlistItem.selectedSize &&
      item.selectedColor === wishlistItem.selectedColor
    );

    if (existingCartItem) {
      // If item exists in cart, just update quantity
      updateQuantity(
        productId,
        wishlistItem.selectedSize,
        wishlistItem.selectedColor,
        existingCartItem.quantity + 1
      );
    } else {
      // If item doesn't exist in cart, add it
      addToCart({ ...wishlistItem, quantity: 1 });
    }

    // Remove from wishlist
    removeFromWishlist(productId);
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.selling_price * item.quantity), 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      wishlist,
      addToCart,
      removeFromCart,
      updateQuantity,
      addToWishlist,
      removeFromWishlist,
      moveToCart,
      clearCart,
      getCartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 