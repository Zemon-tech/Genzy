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

  const login = async (email, password) => {
    try {
      // First, authenticate with Supabase
      const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (supabaseError) throw supabaseError;

      // Then authenticate with your backend
      const response = await fetch(`${API_URL}/seller/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      const sellerData = {
        ...data.data.user,
        session: supabaseData.session, // Use Supabase session
      };

      setSeller(sellerData);
      localStorage.setItem('sellerAuth', JSON.stringify(sellerData));
      return sellerData;
    } catch (error) {
      throw error;
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
    <SellerAuthContext.Provider value={{ seller, login, logout, signup }}>
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