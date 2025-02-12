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
    // Clear any existing sessions on mount
    const clearExistingSessions = async () => {
      try {
        await supabase.auth.signOut();
        localStorage.clear(); // Clear all localStorage data
        setUser(null);
      } catch (error) {
        console.error('Error clearing session:', error);
      } finally {
        setLoading(false);
      }
    };

    clearExistingSessions();

    // Only listen for sign-in events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      // Clear any existing data first
      await supabase.auth.signOut();
      localStorage.clear();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        setUser(data.user);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error.message);
      throw error;
    }
  };

  const signup = async (email, password, full_name) => {
    try {
      // Clear any existing data first
      await supabase.auth.signOut();
      localStorage.clear();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name }
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Signup error:', error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

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