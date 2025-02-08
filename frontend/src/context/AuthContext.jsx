<<<<<<< HEAD
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../config/supabaseClient'
import { useNavigate } from 'react-router-dom'
=======
import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types'; // Import PropTypes for validation
>>>>>>> main

// Move constants to a separate file
import { API_URL, SAMPLE_USER_CREDS } from '../config/constants';

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
<<<<<<< HEAD
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
=======
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
>>>>>>> main

  useEffect(() => {
    // Check current session
    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    } catch (error) {
      console.error('Error checking auth:', error)
    } finally {
      setLoading(false)
    }
<<<<<<< HEAD
  }

  const value = {
    user,
    loading,
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: async () => {
      await supabase.auth.signOut()
      setUser(null)
      navigate('/login')
    }
  }
=======
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

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userAuth');
  };
>>>>>>> main

  if (loading) {
    return null; // or a loading spinner
  }

  return (
<<<<<<< HEAD
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
} 
=======
    <AuthContext.Provider value={{ user, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};

// Add PropTypes validation
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Create a custom hook for using auth context
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { useAuth }; 
>>>>>>> main
