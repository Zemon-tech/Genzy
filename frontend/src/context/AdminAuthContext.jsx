import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { createClient } from '@supabase/supabase-js';

// Get the same Supabase URL and key from the main client
// but create a separate instance with a different storage key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create an admin-specific Supabase client with a different storage key
const adminSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: 'sb-admin-auth-token', // Different storage key than the user or seller auth
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: localStorage
  }
});

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin is logged in on component mount
    checkAdminSession();
  }, []);

  const checkAdminSession = async () => {
    try {
      setLoading(true);
      // Get current session - this uses the admin-specific storage
      const { data: { session }, error } = await adminSupabase.auth.getSession();
      
      if (error) {
        console.error('Error checking admin session:', error);
        setAdmin(null);
        return;
      }

      if (!session) {
        setAdmin(null);
        return;
      }

      // Get admin data and verify role
      await fetchAndSetAdminData(session);
    } catch (err) {
      console.error('Error checking admin session:', err);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to fetch admin data and update state
  const fetchAndSetAdminData = async (session) => {
    try {
      if (!session) return;
      
      console.log('Fetching admin data for user ID:', session.user.id);
      
      // Check if the user has admin role in auth.users metadata
      const { data: userData, error: userError } = await adminSupabase.auth.getUser();
      
      if (userError) {
        console.error('Error fetching user data:', userError);
        setAdmin(null);
        return;
      }
      
      // Get profile data
      const { data: profileData, error: profileError } = await adminSupabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
        
      if (profileError) {
        console.error('Error fetching admin profile data:', profileError);
        setAdmin(null);
        return;
      }
      
      // Check for admin role in any of the possible locations
      const isAdmin = 
        userData?.user?.user_metadata?.role === 'admin' || 
        userData?.user?.raw_user_meta_data?.role === 'admin' ||
        profileData?.role === 'admin' ||
        false;
      
      console.log('Admin check in fetchAndSetAdminData:', isAdmin);
      console.log('Profile role:', profileData?.role);
      
      if (!isAdmin) {
        console.warn('User is authenticated but not an admin');
        await adminSupabase.auth.signOut(); // Sign out from admin auth
        setAdmin(null);
        return;
      }
      
      console.log('Successfully fetched admin data');
      setAdmin({
        ...profileData,
        id: session.user.id,
        email: session.user.email,
        role: 'admin',
        session: session
      });
      
    } catch (error) {
      console.error('Error in fetchAndSetAdminData:', error);
      setAdmin(null);
    }
  };

  const login = async (email, password) => {
    try {
      // First authenticate with Supabase Auth using admin instance
      const { data: authData, error: authError } = await adminSupabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('Admin login error:', authError);
        throw authError;
      }

      if (!authData || !authData.user) {
        throw new Error('No authentication data returned');
      }

      console.log('User authenticated successfully, checking admin role...');
      console.log('User ID:', authData.user.id);

      // Verify the user has admin role
      const { data: userData, error: userError } = await adminSupabase.auth.getUser();
      
      if (userError) {
        console.error('Error fetching user data:', userError);
        throw userError;
      }
      
      // Check if user has admin role in user metadata or raw_user_meta_data
      console.log('User metadata:', JSON.stringify(userData.user.user_metadata));
      console.log('Raw user metadata:', JSON.stringify(userData.user.raw_user_meta_data));
      
      // Get profile data to check role there as well
      const { data: profileData, error: profileError } = await adminSupabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();
        
      if (profileError) {
        console.error('Error fetching admin profile data:', profileError);
      } else {
        console.log('Profile data:', JSON.stringify(profileData));
      }
      
      // Check for admin role in any of the possible locations
      const isAdmin = 
        userData?.user?.user_metadata?.role === 'admin' || 
        userData?.user?.raw_user_meta_data?.role === 'admin' ||
        profileData?.role === 'admin' ||
        false;
      
      console.log('Is admin check result:', isAdmin);
      
      if (!isAdmin) {
        // User is not an admin, sign them out
        await adminSupabase.auth.signOut();
        throw new Error('User is not authorized as admin');
      }

      // Fetch admin data to complete the login
      await fetchAndSetAdminData(authData.session);
      
      return { success: true };
    } catch (error) {
      console.error('Admin login process error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await adminSupabase.auth.signOut();
      setAdmin(null);
      return { success: true };
    } catch (error) {
      console.error('Admin logout error:', error);
      return { success: false, error: error.message };
    }
  };

  // Function to fetch all users from the database
  const fetchAllUsers = async () => {
    try {
      if (!admin || !admin.session) {
        return { success: false, error: 'Not authenticated as admin' };
      }

      const { data, error } = await adminSupabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in fetchAllUsers:', error);
      return { success: false, error: error.message };
    }
  };

  // Function to fetch all sellers from the database
  const fetchAllSellers = async () => {
    try {
      if (!admin || !admin.session) {
        return { success: false, error: 'Not authenticated as admin' };
      }

      const { data, error } = await adminSupabase
        .from('sellers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sellers:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in fetchAllSellers:', error);
      return { success: false, error: error.message };
    }
  };

  // Function to fetch all products from the database
  const fetchAllProducts = async () => {
    try {
      if (!admin || !admin.session) {
        return { success: false, error: 'Not authenticated as admin' };
      }

      const { data, error } = await adminSupabase
        .from('products')
        .select('*, sellers(brand_name)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in fetchAllProducts:', error);
      return { success: false, error: error.message };
    }
  };

  // Function to fetch all orders from the database
  const fetchAllOrders = async () => {
    try {
      if (!admin || !admin.session) {
        return { success: false, error: 'Not authenticated as admin' };
      }

      const { data, error } = await adminSupabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in fetchAllOrders:', error);
      return { success: false, error: error.message };
    }
  };

  // Function to update a seller's status (enabled/disabled)
  const updateSellerStatus = async (sellerId, isEnabled) => {
    try {
      if (!admin || !admin.session) {
        return { success: false, error: 'Not authenticated as admin' };
      }

      const { data, error } = await adminSupabase
        .from('sellers')
        .update({ is_verified: isEnabled })
        .eq('id', sellerId)
        .select();

      if (error) {
        console.error('Error updating seller status:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateSellerStatus:', error);
      return { success: false, error: error.message };
    }
  };

  // Function to update a product's status
  const updateProductStatus = async (productId, isEnabled) => {
    try {
      if (!admin || !admin.session) {
        return { success: false, error: 'Not authenticated as admin' };
      }

      const { data, error } = await adminSupabase
        .from('products')
        .update({ is_active: isEnabled })
        .eq('id', productId)
        .select();

      if (error) {
        console.error('Error updating product status:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateProductStatus:', error);
      return { success: false, error: error.message };
    }
  };

  // Function to manage featured categories
  const manageFeaturedCategories = async (categories) => {
    try {
      if (!admin || !admin.session) {
        return { success: false, error: 'Not authenticated as admin' };
      }

      // For simplicity, we'll replace all featured categories
      // In a real app, you might want more sophisticated management
      const { data, error } = await adminSupabase
        .from('featured_categories')
        .upsert(categories)
        .select();

      if (error) {
        console.error('Error managing featured categories:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in manageFeaturedCategories:', error);
      return { success: false, error: error.message };
    }
  };

  // Function to manage havendrip collection (curated products)
  const manageHavendripCollection = async (productIds) => {
    try {
      if (!admin || !admin.session) {
        return { success: false, error: 'Not authenticated as admin' };
      }

      // Create entries for the havendrip collection
      // Each entry has a product_id and a rank order
      const collectionEntries = productIds.map((productId, index) => ({
        product_id: productId,
        rank: index + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Delete all existing entries first
      const { error: deleteError } = await adminSupabase
        .from('havendrip_collection')
        .delete()
        .gte('id', 0); // Delete all records

      if (deleteError) {
        console.error('Error deleting existing havendrip collection:', deleteError);
        return { success: false, error: deleteError.message };
      }

      // Insert new entries
      const { data, error } = await adminSupabase
        .from('havendrip_collection')
        .insert(collectionEntries)
        .select();

      if (error) {
        console.error('Error managing havendrip collection:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in manageHavendripCollection:', error);
      return { success: false, error: error.message };
    }
  };

  // Function to get havendrip collection products
  const getHavendripCollection = async () => {
    try {
      if (!admin || !admin.session) {
        return { success: false, error: 'Not authenticated as admin' };
      }

      const { data, error } = await adminSupabase
        .from('havendrip_collection')
        .select('*, products(*)')
        .order('rank', { ascending: true });

      if (error) {
        console.error('Error fetching havendrip collection:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in getHavendripCollection:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    admin,
    loading,
    isAuthenticated: !!admin,
    login,
    logout,
    fetchAllUsers,
    fetchAllSellers,
    fetchAllProducts,
    fetchAllOrders,
    updateSellerStatus,
    updateProductStatus,
    manageFeaturedCategories,
    manageHavendripCollection,
    getHavendripCollection
    // Note: Seller creation from admin panel was removed due to database constraint issues
    // Sellers should register themselves through the seller registration page
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {!loading && children}
    </AdminAuthContext.Provider>
  );
};

AdminAuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}; 