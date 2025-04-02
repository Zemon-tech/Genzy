import { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../config/supabase';
import { useAuth } from './AuthContext';
import PropTypes from 'prop-types';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeWishlistItem, setActiveWishlistItem] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const { user } = useAuth();
  
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
        // Fetch cart items
        const { data: cartData, error: cartError } = await supabase
          .from('shopping_cart')
          .select('*, product:product_id(*)')
          .eq('user_id', user.id);
          
        if (cartError) {
          console.error('Error fetching cart data:', cartError);
          throw cartError;
        }
        
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

      // Re-validate coupon after cart changes
      if (appliedCoupon) {
        validateCoupon(appliedCoupon.code);
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

      // Re-validate coupon after cart changes
      if (appliedCoupon) {
        validateCoupon(appliedCoupon.code);
      }
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

      // Re-validate coupon after cart changes
      if (appliedCoupon) {
        validateCoupon(appliedCoupon.code);
      }
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

  // Coupon functions
  const applyCoupon = async (code) => {
    setCouponLoading(true);
    setCouponError(null);
    
    try {
      const result = await validateCoupon(code);
      return result;
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponError(error.message || 'Failed to apply coupon');
      setAppliedCoupon(null);
      return { success: false, error: error.message };
    } finally {
      setCouponLoading(false);
    }
  };

  const validateCoupon = async (code) => {
    if (!code || !user) {
      setCouponError('Invalid coupon code');
      setAppliedCoupon(null);
      return { success: false, error: 'Invalid coupon code' };
    }

    try {
      // Fetch coupon from database
      const { data: couponData, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (error || !couponData) {
        setCouponError('Coupon not found');
        setAppliedCoupon(null);
        return { success: false, error: 'Coupon not found' };
      }

      // Check if coupon is expired
      const now = new Date();
      const expiryDate = new Date(couponData.expiry_date);
      
      if (expiryDate < now) {
        setCouponError('Coupon has expired');
        setAppliedCoupon(null);
        return { success: false, error: 'Coupon has expired' };
      }

      // Check if coupon is valid for current cart
      if (couponData.brand_id) {
        // Brand-specific coupon
        const validItems = cart.filter(item => item.seller_id === couponData.brand_id);
        
        if (validItems.length === 0) {
          setCouponError(`This coupon is only valid for ${couponData.brand_name || 'specific'} brand products`);
          setAppliedCoupon(null);
          return { 
            success: false, 
            error: `This coupon is only valid for ${couponData.brand_name || 'specific'} brand products` 
          };
        }
      }

      // Check minimum order value
      const cartTotal = getCartTotal();
      if (couponData.min_order_value && cartTotal < couponData.min_order_value) {
        setCouponError(`Minimum order value of ₹${couponData.min_order_value} required for this coupon`);
        setAppliedCoupon(null);
        return { 
          success: false, 
          error: `Minimum order value of ₹${couponData.min_order_value} required for this coupon` 
        };
      }

      // All validations passed, apply coupon
      setAppliedCoupon(couponData);
      setCouponError(null);
      return { success: true, coupon: couponData };
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponError('Error validating coupon');
      setAppliedCoupon(null);
      return { success: false, error: 'Error validating coupon' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  // Calculate coupon discount
  const getCouponDiscount = () => {
    if (!appliedCoupon) return 0;
    
    let applicableTotal = getCartTotal();
    
    // For brand-specific coupons, only apply to eligible items
    if (appliedCoupon.brand_id) {
      applicableTotal = cart
        .filter(item => item.seller_id === appliedCoupon.brand_id)
        .reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
    }
    
    if (appliedCoupon.discount_type === 'percentage') {
      // Percentage discount
      const discount = (applicableTotal * appliedCoupon.discount_value) / 100;
      
      // Apply max discount cap if exists
      if (appliedCoupon.max_discount && discount > appliedCoupon.max_discount) {
        return appliedCoupon.max_discount;
      }
      
      return Math.round(discount);
    } else {
      // Fixed amount discount
      return Math.min(appliedCoupon.discount_value, applicableTotal);
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.selling_price * item.quantity), 0);
  };

  // Calculate the total MRP (before discount)
  const getCartMRP = () => {
    return cart.reduce((total, item) => total + (item.mrp * item.quantity), 0);
  };

  // Calculate total savings (MRP - selling price)
  const getTotalSavings = () => {
    return cart.reduce((total, item) => {
      const itemSaving = (item.mrp - item.selling_price) * item.quantity;
      return total + (itemSaving > 0 ? itemSaving : 0);
    }, 0);
  };

  // New function to calculate shipping fees based on seller/brand
  const getShippingFee = () => {
    // Group products by seller_id
    const sellerGroups = {};
    
    cart.forEach(item => {
      const sellerId = item.seller_id;
      if (!sellerGroups[sellerId]) {
        sellerGroups[sellerId] = [];
      }
      sellerGroups[sellerId].push(item);
    });
    
    // Calculate max shipping fee for each seller's products
    let totalShippingFee = 0;
    
    Object.values(sellerGroups).forEach(sellerItems => {
      // Find the max shipping charge for this seller's products
      const maxShippingCharge = Math.max(
        ...sellerItems.map(item => Number(item.shipping_charges || 0))
      );
      
      totalShippingFee += maxShippingCharge;
    });
    
    return totalShippingFee;
  };

  // Get maximum delivery time from all products in cart
  const getMaxDeliveryTime = () => {
    if (cart.length === 0) return null;
    
    const deliveryTimes = cart.map(item => Number(item.delivery_time || 0));
    return Math.max(...deliveryTimes);
  };

  // Calculate final amount (subtotal + shipping - coupon discount)
  const getFinalAmount = () => {
    const subtotal = getCartTotal();
    const shipping = getShippingFee();
    const couponDiscount = getCouponDiscount();
    
    return Math.max(0, subtotal + shipping - couponDiscount);
  };

  // Calculate percentage saved
  const getSavingsPercentage = () => {
    const mrpTotal = getCartMRP();
    const savings = getTotalSavings();
    return mrpTotal > 0 ? Math.round((savings / mrpTotal) * 100) : 0;
  };

  // Get full price breakdown
  const getPriceBreakdown = () => {
    const couponDiscount = getCouponDiscount();
    
    return {
      subtotal: getCartTotal(),
      mrpTotal: getCartMRP(),
      savings: getTotalSavings(),
      savingsPercentage: getSavingsPercentage(),
      shippingFee: getShippingFee(),
      couponDiscount,
      couponCode: appliedCoupon?.code,
      total: getFinalAmount(),
      maxDeliveryTime: getMaxDeliveryTime()
    };
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
      getCartMRP,
      getTotalSavings,
      getShippingFee,
      getMaxDeliveryTime,
      getFinalAmount,
      getSavingsPercentage,
      getPriceBreakdown,
      applyCoupon,
      removeCoupon,
      appliedCoupon,
      couponError,
      couponLoading,
      getCouponDiscount,
      activeWishlistItem,
      clearActiveWishlistItem
    }}>
      {children}
    </CartContext.Provider>
  );
};

CartProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 