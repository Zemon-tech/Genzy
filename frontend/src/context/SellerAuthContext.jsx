import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { createClient } from '@supabase/supabase-js';

// Get the same Supabase URL and key from the main client
// but create a separate instance with a different storage key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a seller-specific Supabase client with a different storage key
const sellerSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: 'sb-seller-auth-token', // Different storage key than the user auth
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: localStorage
  }
});

const API_URL = 'http://localhost:5011/api';

const SellerAuthContext = createContext(null);

export const SellerAuthProvider = ({ children }) => {
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if seller is logged in on component mount
    checkSellerSession();
  }, []);

  const checkSellerSession = async () => {
    try {
      setLoading(true);
      // Get current session - this uses the seller-specific storage
      const { data: { session }, error } = await sellerSupabase.auth.getSession();
      
      if (error) {
        console.error('Error checking seller session:', error);
        setSeller(null);
        return;
      }

      if (!session) {
        setSeller(null);
        return;
      }

      // Get seller data
      await fetchAndSetSellerData(session);
    } catch (err) {
      console.error('Error checking seller session:', err);
      setSeller(null);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to fetch seller data and update state
  const fetchAndSetSellerData = async (session) => {
    try {
      if (!session) return;
      
      console.log('Fetching seller data for user ID:', session.user.id);
      
      const { data: sellerData, error: fetchError } = await sellerSupabase
        .from('sellers')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
        
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching seller data:', fetchError);
        setSeller(null);
      } else if (sellerData) {
        console.log('Successfully fetched seller data');
        setSeller({
          ...sellerData,
          session: session
        });
      } else {
        // User is authenticated but not a seller
        console.warn('User is authenticated but not a seller');
        await sellerSupabase.auth.signOut(); // Sign out from seller auth
        setSeller(null);
      }
    } catch (error) {
      console.error('Error in fetchAndSetSellerData:', error);
      setSeller(null);
    }
  };

  // Function to refresh seller data from the database
  const refreshSellerData = async () => {
    try {
      if (!seller || !seller.session) {
        console.warn('Cannot refresh: No active seller session');
        return { success: false, error: 'No active session' };
      }
      
      // Don't set loading to true for refresh operations
      // as it causes UI flicker
      await fetchAndSetSellerData(seller.session);
      return { success: true };
    } catch (error) {
      console.error('Error refreshing seller data:', error);
      return { success: false, error: error.message };
    }
  };

  // Function to update seller profile details
  const updateSellerProfile = async (profileData) => {
    try {
      if (!seller || !seller.id) {
        console.error('No seller authenticated');
        return { success: false, error: 'No seller authenticated' };
      }

      console.log('SellerAuthContext: Updating profile for seller ID:', seller.id);
      console.log('SellerAuthContext: Profile data to update:', profileData);
      
      // Use the sellerSupabase client with auth
      const { data, error } = await sellerSupabase
        .from('sellers')
        .update(profileData)
        .eq('id', seller.id)
        .select();
      
      if (error) {
        console.error('SellerAuthContext: Error updating seller profile:', error);
        return { success: false, error: error.message };
      }
      
      console.log('SellerAuthContext: Successfully updated seller profile:', data);
      
      // Update the seller data without triggering loading state
      if (data && data.length > 0) {
        setSeller({
          ...seller,
          ...data[0]
        });
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('SellerAuthContext: Error in updateSellerProfile:', error);
      return { success: false, error: error.message };
    }
  };

  // Dedicated function to update size chart images
  const updateSizeChartImages = async (imageUrls) => {
    try {
      if (!seller || !seller.id) {
        console.error('No seller authenticated');
        return { success: false, error: 'No seller authenticated' };
      }

      console.log('SellerAuthContext: Updating size chart images for seller ID:', seller.id);
      console.log('SellerAuthContext: Image URLs to update:', imageUrls);
      
      // Extract only the URL fields we need to update
      const updateData = {
        size_chart_image1_url: imageUrls.image1,
        size_chart_image2_url: imageUrls.image2,
        size_chart_image3_url: imageUrls.image3
      };
      
      // Use the sellerSupabase client with auth
      const { data, error } = await sellerSupabase
        .from('sellers')
        .update(updateData)
        .eq('id', seller.id)
        .select();
      
      if (error) {
        console.error('SellerAuthContext: Error updating size chart images:', error);
        return { success: false, error: error.message };
      }
      
      console.log('SellerAuthContext: Successfully updated size chart images:', data);
      
      // Update the seller data without triggering loading state
      if (data && data.length > 0) {
        setSeller({
          ...seller,
          ...data[0]
        });
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('SellerAuthContext: Error in updateSizeChartImages:', error);
      return { success: false, error: error.message };
    }
  };

  // Single-field update for size chart images
  const updateSingleSizeChartImage = async (imageKey, imageUrl) => {
    try {
      if (!seller || !seller.id) {
        console.error('No seller authenticated');
        return { success: false, error: 'No seller authenticated' };
      }

      const fieldName = `size_chart_image${imageKey.slice(-1)}_url`;
      console.log(`SellerAuthContext: Updating ${fieldName} for seller ID:`, seller.id);
      console.log('SellerAuthContext: Image URL to update:', imageUrl);
      
      // Create update object with only the single field
      const updateData = {};
      updateData[fieldName] = imageUrl;
      
      // Use the sellerSupabase client with auth
      const { data, error } = await sellerSupabase
        .from('sellers')
        .update(updateData)
        .eq('id', seller.id)
        .select();
      
      if (error) {
        console.error('SellerAuthContext: Error updating size chart image:', error);
        return { success: false, error: error.message };
      }
      
      console.log('SellerAuthContext: Successfully updated size chart image:', data);
      
      // Update the seller data without triggering loading state
      if (data && data.length > 0) {
        setSeller({
          ...seller,
          ...data[0]
        });
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('SellerAuthContext: Error in updateSingleSizeChartImage:', error);
      return { success: false, error: error.message };
    }
  };

  const handleLogin = async (email, password) => {
    try {
      // First authenticate with Supabase Auth using seller instance
      const { data: authData, error: authError } = await sellerSupabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('Supabase auth error:', authError);
        throw authError;
      }

      // Then get seller data using business_email
      const { data, error } = await sellerSupabase
        .from('sellers')
        .select('*')
        .eq('business_email', email)
        .single();

      if (error) {
        console.error('Error fetching seller data:', error);
        if (error.code === 'PGRST116') {
          throw new Error('This account is not registered as a seller');
        }
        throw error;
      }

      // The existence of the seller record in the sellers table confirms this is a seller account
      const sellerData = {
        ...data,
        session: authData.session
      };
      
      setSeller(sellerData);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Login failed. Please check your credentials.'
      };
    }
  };

  const signup = async (email, password, brand_name, phone_number) => {
    const response = await fetch(`${API_URL}/seller/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, brand_name, phone_number }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }

    return data;
  };

  const logout = async () => {
    await sellerSupabase.auth.signOut();
    setSeller(null);
  };

  // Fetch orders for the seller
  const fetchSellerOrders = async (status = 'pending') => {
    try {
      if (!seller) {
        throw new Error('No seller authenticated');
      }

      // Fetch orders that have items from this seller
      const { data, error } = await sellerSupabase
        .from('order_items')
        .select(`
          *,
          order:order_id(
            id, 
            created_at, 
            shipping_address, 
            phone_number, 
            tracking_number, 
            payment_method,
            total_amount,
            estimated_delivery_date,
            actual_delivery_date
          ),
          product:product_id(*)
        `)
        .eq('seller_id', seller.id)
        .eq('item_status', status)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching seller orders:', error);
      throw error;
    }
  };

  // Update order item status
  const updateOrderItemStatus = async (orderItemId, newStatus, trackingNumber = null) => {
    try {
      if (!seller) {
        throw new Error('No seller authenticated');
      }

      // Verify the order item belongs to this seller
      const { data: orderItem, error: verifyError } = await sellerSupabase
        .from('order_items')
        .select('*, order:order_id(*)')
        .eq('id', orderItemId)
        .eq('seller_id', seller.id)
        .single();

      if (verifyError || !orderItem) {
        throw new Error('Order item not found or not authorized');
      }

      // Updates to apply to the order
      const orderUpdates = {};
      
      // If tracking number is provided, update it in the order
      if (trackingNumber && newStatus === 'shipped') {
        orderUpdates.tracking_number = trackingNumber;
      }
      
      // If marking as delivered, set the actual delivery date
      if (newStatus === 'delivered') {
        orderUpdates.actual_delivery_date = new Date().toISOString();
      }
      
      // Only update the order if we have changes to make
      if (Object.keys(orderUpdates).length > 0) {
        const { error: orderError } = await sellerSupabase
          .from('orders')
          .update(orderUpdates)
          .eq('id', orderItem.order_id);

        if (orderError) {
          console.error('Error updating order:', orderError);
          throw orderError;
        }
      }

      // Use the improved function that updates both order and items status
      const { error: statusError } = await sellerSupabase
        .rpc('update_order_and_items_status', { 
          p_order_id: orderItem.order_id, 
          p_status: newStatus,
          p_seller_id: seller.id
        });

      if (statusError) {
        console.error('Error updating order status:', statusError);
        throw statusError;
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating order item status:', error);
      throw error;
    }
  };

  if (loading) {
    return null; // or a loading spinner
  }

  return (
    <SellerAuthContext.Provider
      value={{
        seller,
        loading,
        handleLogin,
        logout,
        signup,
        fetchSellerOrders,
        updateOrderItemStatus,
        refreshSellerData,
        updateSizeChartImages,
        updateSingleSizeChartImage,
        updateSellerProfile
      }}
    >
      {children}
    </SellerAuthContext.Provider>
  );
};

SellerAuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useSellerAuth = () => {
  const context = useContext(SellerAuthContext);
  if (!context) {
    throw new Error('useSellerAuth must be used within a SellerAuthProvider');
  }
  return context;
}; 