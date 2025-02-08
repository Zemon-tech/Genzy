import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { API_URL } from '../config/constants';

const SellerAuthContext = createContext(null);

export const SellerAuthProvider = ({ children }) => {
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if seller is logged in on component mount
    const loggedInSeller = localStorage.getItem('sellerAuth');
    if (loggedInSeller) {
      setSeller(JSON.parse(loggedInSeller));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await fetch(`${API_URL}/seller/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    const sellerData = {
      ...data.data.seller,
      session: data.data.session,
    };

    setSeller(sellerData);
    localStorage.setItem('sellerAuth', JSON.stringify(sellerData));
    return sellerData;
  };

  const signup = async (email, password, brand_name, phone_number) => {
    const response = await fetch(`${API_URL}/seller/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password, brand_name, phone_number }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }

    return data;
  };

  const logout = () => {
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