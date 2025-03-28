import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import supabase from '../config/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initialize auth by getting the current session
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                setLoading(true);
                
                // Get current session from Supabase
                const { data, error } = await supabase.auth.getSession();
                
                if (error) {
                    console.error('Session retrieval error:', error);
                    throw error;
                }

                if (data?.session) {
                    console.log('Existing session found:', data.session.user.id);
                    setUser(data.session.user);
                } else {
                    console.log('No existing session found');
                    setUser(null);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    // Subscribe to auth changes
    useEffect(() => {
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state change event:', event);
            
            switch (event) {
                case 'SIGNED_IN':
                    console.log('Sign in event detected:', session?.user?.id);
                    if (session?.user) {
                        setUser(session.user);
                    }
                    break;
                case 'SIGNED_OUT':
                    console.log('Sign out event detected');
                    setUser(null);
                    break;
                case 'TOKEN_REFRESHED':
                    console.log('Token refresh event detected:', session?.user?.id);
                    if (session?.user) {
                        setUser(session.user);
                    }
                    break;
                case 'USER_UPDATED':
                    console.log('User updated event detected:', session?.user?.id);
                    if (session?.user) {
                        setUser(session.user);
                    }
                    break;
                default:
                    console.log('Unhandled auth event:', event);
                    break;
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const login = async (email, password) => {
        try {
            console.log('Attempting login for:', email);
            
            // Attempt to sign in
            console.log('Initiating sign in...');
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password
            });

            if (error) {
                console.error('Login error details:', error);
                
                if (error.message.includes('schema')) {
                    throw new Error('Authentication service is temporarily unavailable. Please try again later.');
                }
                throw error;
            }

            if (!data?.session) {
                console.error('No session data received');
                throw new Error('Login failed: No session data received');
            }

            console.log('Login successful, user ID:', data.user.id);
            setUser(data.user);
            return data;
        } catch (error) {
            console.error('Login process error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isAuthenticated: !!user,
            login,
            logout
        }}>
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