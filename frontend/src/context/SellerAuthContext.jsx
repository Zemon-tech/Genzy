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
    const checkSellerSession = async () => {
      try {
        // Get current session - this uses the seller-specific storage
        const { data: { session }, error } = await sellerSupabase.auth.getSession();
        
        if (error) {
          console.error('Error checking seller session:', error);
          setSeller(null);
          setLoading(false);
          return;
        }

        if (!session) {
          console.log('No seller session found');
          setSeller(null);
          setLoading(false);
          return;
        }

        // Get seller data
        const { data: sellerData, error: fetchError } = await sellerSupabase
          .from('sellers')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
          
        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching seller data:', fetchError);
          setSeller(null);
        } else if (sellerData) {
          setSeller({
            ...sellerData,
            session: session
          });
        } else {
          // User is authenticated but not a seller
          console.log('User is authenticated but not a seller');
          await sellerSupabase.auth.signOut(); // Sign out from seller auth
          setSeller(null);
        }
      } catch (err) {
        console.error('Error checking seller session:', err);
        setSeller(null);
      } finally {
        setLoading(false);
      }
    };

    checkSellerSession();
  }, []);

  const handleLogin = async (email, password) => {
    try {
      console.log('Attempting seller login for:', email);
      
      // First authenticate with Supabase Auth using seller instance
      console.log('Initiating Supabase auth...');
      const { data: authData, error: authError } = await sellerSupabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('Supabase auth error:', authError);
        throw authError;
      }

      console.log('Supabase auth successful, user ID:', authData.user.id);
      console.log('Fetching seller data from sellers table...');

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

      console.log('Seller data found:', data);

      // The existence of the seller record in the sellers table confirms this is a seller account
      const sellerData = {
        ...data,
        session: authData.session
      };

      console.log('Setting seller state with:', { 
        id: sellerData.id, 
        brand_name: sellerData.brand_name
      });
      
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

  if (loading) {
    return null; // or a loading spinner
  }

  return (
    <SellerAuthContext.Provider value={{ seller, handleLogin, logout, signup }}>
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