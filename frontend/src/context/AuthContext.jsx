import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import supabase from '../config/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                // Get current session from Supabase
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error) {
                    console.error('Session retrieval error:', error);
                    throw error;
                }

                if (mounted) {
                    if (session?.user) {
                        console.log('Existing session found', session.user);
                        setUser(session.user);
                    } else {
                        console.log('No existing session found');
                        setUser(null);
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                if (mounted) setUser(null);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state change event:', event);
            if (!mounted) return;

            switch (event) {
                case 'SIGNED_IN':
                    console.log('Sign in event detected:', session);
                    setUser(session.user);
                    break;
                case 'SIGNED_OUT':
                    console.log('Sign out event detected');
                    setUser(null);
                    break;
                case 'TOKEN_REFRESHED':
                    console.log('Token refresh event detected:', session);
                    if (session) {
                        setUser(session.user);
                    }
                    break;
                case 'USER_UPDATED':
                    console.log('User updated event detected:', session);
                    if (session) {
                        setUser(session.user);
                    }
                    break;
                default:
                    console.log('Unhandled auth event:', event);
                    break;
            }
        });

        return () => {
            mounted = false;
            subscription?.unsubscribe();
        };
    }, []);

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        login: async (email, password) => {
            try {
                console.log('Attempting login for:', email);
                
                // Attempt to sign in
                console.log('Initiating sign in...');
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email.trim().toLowerCase(),
                    password: password
                });

                if (error) {
                    console.error('Login error details:', {
                        message: error.message,
                        status: error.status,
                        name: error.name,
                        stack: error.stack
                    });
                    
                    // Handle specific error cases
                    if (error.message.includes('schema')) {
                        throw new Error('Authentication service is temporarily unavailable. Please try again later.');
                    }
                    throw error;
                }

                if (!data?.session) {
                    console.error('No session data received');
                    throw new Error('Login failed: No session data received');
                }

                console.log('Login successful, session established');
                
                // Update the auth state (should happen automatically through onAuthStateChange)
                // but we'll set it here too to ensure immediate UI update
                setUser(data.user);

                return data;
            } catch (error) {
                console.error('Login process error:', error);
                // Cleanup any partial state
                setUser(null);
                throw error;
            }
        },
        logout: async () => {
            try {
                await supabase.auth.signOut();
                setUser(null);
            } catch (error) {
                console.error('Logout error:', error);
                throw error;
            }
        }
    };

    return (
        <AuthContext.Provider value={value}>
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