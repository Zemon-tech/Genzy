import { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../config/supabase';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeWishlistItem, setActiveWishlistItem] = useState(null);
  const { user, isAuthenticated } = useAuth();
  
  // Fetch cart and wishlist from Supabase when user is authenticated
  useEffect(() => {
    if (!user) {
      // If not authenticated, clear cart and wishlist
      setCart([]);
      setWishlist([]);
      setLoading(false);
      return;
    }
    
    const fetchUserData = async () => {
      setLoading(true);
      
      try {
        console.log('Fetching cart and wishlist data for user:', user.id);
        
        // Fetch cart items
        const { data: cartData, error: cartError } = await supabase
          .from('shopping_cart')
          .select('*, product:product_id(*)')
          .eq('user_id', user.id);
          
        if (cartError) {
          console.error('Error fetching cart data:', cartError);
          throw cartError;
        }
        
        console.log('Cart data fetched:', cartData?.length || 0, 'items');
        
        // Transform cart data to match the expected format
        const formattedCart = cartData?.map(item => ({
          ...item.product,
          quantity: item.quantity,
          selectedSize: item.size || null,
          selectedColor: item.color || null,
          cartItemId: item.id // Store the cart item ID for easier updates
        })) || [];
        
        setCart(formattedCart);
        
        // Fetch wishlist items
        const { data: wishlistData, error: wishlistError } = await supabase
          .from('wishlist')
          .select('*, product:product_id(*)')
          .eq('user_id', user.id);
          
        if (wishlistError) {
          console.error('Error fetching wishlist data:', wishlistError);
          throw wishlistError;
        }
        
        console.log('Wishlist data fetched:', wishlistData?.length || 0, 'items');
        
        // Transform wishlist data
        const formattedWishlist = wishlistData?.map(item => ({
          ...item.product,
          wishlistItemId: item.id // Store the wishlist item ID
        })) || [];
        
        setWishlist(formattedWishlist);
      } catch (error) {
        console.error('Error fetching cart/wishlist:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user]);

  // Add to cart - now saves to Supabase
  const addToCart = async (product) => {
    if (!user) {
      console.error('User must be authenticated to add items to cart');
      return;
    }
    
    try {
      const existingItemIndex = cart.findIndex(
        item => 
          item.id === product.id && 
          item.selectedSize === product.selectedSize &&
          item.selectedColor === product.selectedColor
      );
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const existingItem = cart[existingItemIndex];
        const newQuantity = existingItem.quantity + (product.quantity || 1);
        
        const { error } = await supabase
          .from('shopping_cart')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.cartItemId);
          
        if (error) {
          console.error('Error updating cart item:', error);
          throw error;
        }
        
        // Update local state
        setCart(prevCart => prevCart.map((item, index) => 
          index === existingItemIndex
            ? { ...item, quantity: newQuantity }
            : item
        ));
      } else {
        // Add new item
        const { data, error } = await supabase
          .from('shopping_cart')
          .insert({
            user_id: user.id,
            product_id: product.id,
            quantity: product.quantity || 1,
            size: product.selectedSize || null,
            color: product.selectedColor || null
          })
          .select();
          
        if (error) {
          console.error('Error adding item to cart:', error);
          throw error;
        }
        
        // Add to local state
        setCart(prevCart => [
          ...prevCart, 
          { 
            ...product, 
            quantity: product.quantity || 1,
            cartItemId: data[0].id
          }
        ]);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  // Remove from cart - now deletes from Supabase
  const removeFromCart = async (productId, size, color) => {
    if (!user) {
      console.error('User must be authenticated to remove items from cart');
      return;
    }
    
    try {
      const itemToRemove = cart.find(
        item => 
          item.id === productId && 
          item.selectedSize === size && 
          item.selectedColor === color
      );
      
      if (!itemToRemove) return;
      
      const { error } = await supabase
        .from('shopping_cart')
        .delete()
        .eq('id', itemToRemove.cartItemId);
        
      if (error) throw error;
      
      // Update local state
      setCart(prevCart =>
        prevCart.filter(item => item.cartItemId !== itemToRemove.cartItemId)
      );
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  // Update quantity - now updates in Supabase
  const updateQuantity = async (productId, size, color, newQuantity) => {
    if (!user) {
      console.error('User must be authenticated to update cart');
      return;
    }
    
    if (newQuantity < 1) return; // Prevent negative quantities
    
    try {
      const itemToUpdate = cart.find(
        item => 
          item.id === productId && 
          item.selectedSize === size && 
          item.selectedColor === color
      );
      
      if (!itemToUpdate) return;
      
      const { error } = await supabase
        .from('shopping_cart')
        .update({ quantity: newQuantity })
        .eq('id', itemToUpdate.cartItemId);
        
      if (error) throw error;
      
      // Update local state
      setCart(prevCart =>
        prevCart.map(item =>
          item.cartItemId === itemToUpdate.cartItemId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  // Add to wishlist - now saves to Supabase
  const addToWishlist = async (product) => {
    if (!user) {
      console.error('User must be authenticated to add items to wishlist');
      return;
    }
    
    try {
      // Check if product already exists in wishlist
      if (wishlist.some(item => item.id === product.id)) return;
      
      const { data, error } = await supabase
        .from('wishlist')
        .insert({
          user_id: user.id,
          product_id: product.id
        })
        .select();
        
      if (error) throw error;
      
      // Update local state
      setWishlist(prev => [
        ...prev, 
        { 
          ...product,
          wishlistItemId: data[0].id
        }
      ]);
    } catch (error) {
      console.error('Error adding to wishlist:', error);
    }
  };

  // Remove from wishlist - now deletes from Supabase
  const removeFromWishlist = async (productId) => {
    if (!user) {
      console.error('User must be authenticated to remove items from wishlist');
      return;
    }
    
    try {
      const itemToRemove = wishlist.find(item => item.id === productId);
      
      if (!itemToRemove) return;
      
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', itemToRemove.wishlistItemId);
        
      if (error) throw error;
      
      // Update local state
      setWishlist(prev => prev.filter(item => item.id !== productId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  // Move from wishlist to cart - updated to handle size and color selection
  const moveToCart = async (productId, options = null) => {
    if (!user) {
      console.error('User must be authenticated to move items to cart');
      return;
    }
    
    const wishlistItem = wishlist.find(item => item.id === productId);
    
    if (!wishlistItem) return;
    
    // If options (size and color) are provided, add to cart with those options
    if (options && options.size && options.color) {
      await addToCart({
        ...wishlistItem,
        selectedSize: options.size,
        selectedColor: options.color,
        quantity: 1
      });
      
      // Then remove from wishlist
      await removeFromWishlist(productId);
    } else {
      // If no options, set the active wishlist item for selection modal
      setActiveWishlistItem(wishlistItem);
    }
  };

  // Function to clear the active wishlist item
  const clearActiveWishlistItem = () => {
    setActiveWishlistItem(null);
  };

  // Clear cart - now removes all items from Supabase
  const clearCart = async () => {
    if (!user) {
      console.error('User must be authenticated to clear cart');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('shopping_cart')
        .delete()
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Update local state
      setCart([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.selling_price * item.quantity), 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      wishlist,
      loading,
      addToCart,
      removeFromCart,
      updateQuantity,
      addToWishlist,
      removeFromWishlist,
      moveToCart,
      clearCart,
      getCartTotal,
      activeWishlistItem,
      clearActiveWishlistItem
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