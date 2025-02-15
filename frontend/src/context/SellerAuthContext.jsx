import { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../config/supabase';

const API_URL = 'http://localhost:5011/api';

const SellerAuthContext = createContext(null);

export const SellerAuthProvider = ({ children }) => {
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if seller is logged in on component mount
    const loggedInSeller = localStorage.getItem('sellerAuth');
    if (loggedInSeller) {
      const sellerData = JSON.parse(loggedInSeller);
      setSeller(sellerData);
      // Set Supabase session
      if (sellerData.session?.access_token) {
        supabase.auth.setSession({
          access_token: sellerData.session.access_token,
          refresh_token: sellerData.session.refresh_token
        });
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = async (email, password) => {
    try {
      // First authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      // Then get seller data using business_email
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('business_email', email) // Changed from email to business_email
        .single();

      if (error) throw error;

      // Make sure brand_name is included in the seller data
      const sellerData = {
        ...data,
        session: authData.session // Include the session data
      };

      localStorage.setItem('sellerAuth', JSON.stringify(sellerData));
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
    try {
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
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSeller(null);
    localStorage.removeItem('sellerAuth');
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

export const useSellerAuth = () => {
  const context = useContext(SellerAuthContext);
  if (!context) {
    throw new Error('useSellerAuth must be used within a SellerAuthProvider');
  }
  return context;
}; 