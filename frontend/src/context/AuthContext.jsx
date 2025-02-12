import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import supabase from '../config/supabase';

const API_URL = 'http://localhost:5011/api';

// Sample user credentials
export const SAMPLE_USER_CREDS = {
  email: 'user@genzy.com',
  password: 'User@123'
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on component mount
    const loggedInUser = localStorage.getItem('userAuth');
    if (loggedInUser) {
      const userData = JSON.parse(loggedInUser);
      setUser(userData);
      // Restore Supabase session
      if (userData.session?.access_token) {
        supabase.auth.setSession({
          access_token: userData.session.access_token,
          refresh_token: userData.session.refresh_token
        });
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await fetch(`${API_URL}/user/auth/login`, {
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

    const userData = {
      ...data.data.user,
      session: data.data.session,
    };

    // Set the Supabase session
    if (userData.session?.access_token) {
      await supabase.auth.setSession({
        access_token: userData.session.access_token,
        refresh_token: userData.session.refresh_token
      });
    }

    setUser(userData);
    localStorage.setItem('userAuth', JSON.stringify(userData));
    return userData;
  };

  const signup = async (email, password, full_name) => {
    const response = await fetch(`${API_URL}/user/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, full_name }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }

    return data;
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      localStorage.removeItem('userAuth');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (loading) {
    return null; // or a loading spinner
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};

// Add PropTypes validation
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 