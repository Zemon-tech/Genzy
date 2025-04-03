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
                        setUser(session.user);
                    } else {
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
            if (!mounted) return;

            switch (event) {
                case 'SIGNED_IN':
                    setUser(session.user);
                    break;
                case 'SIGNED_OUT':
                    setUser(null);
                    break;
                case 'TOKEN_REFRESHED':
                    if (session) {
                        setUser(session.user);
                    }
                    break;
                case 'USER_UPDATED':
                    if (session) {
                        setUser(session.user);
                    }
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
        signup: async (email, password, full_name) => {
            try {
                const { data, error } = await supabase.auth.signUp({
                    email: email.trim().toLowerCase(),
                    password,
                    options: {
                        data: {
                            full_name
                        }
                    }
                });

                if (error) {
                    console.error('Signup error:', error);
                    throw error;
                }

                // Check if a profile already exists
                const { data: existingProfile } = await supabase
                    .from('user_profiles')
                    .select('id')
                    .eq('id', data.user.id)
                    .maybeSingle();

                // Only create a profile if one doesn't exist yet
                if (!existingProfile) {
                    const { error: profileError } = await supabase
                        .from('user_profiles')
                        .insert([
                            {
                                id: data.user.id,
                                full_name,
                                email: email.trim().toLowerCase(),
                                address: '',
                                landmark: '',
                                city: '',
                                state: '',
                                pincode: '',
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            }
                        ]);

                    if (profileError) {
                        console.error('Profile creation error:', profileError);
                        // Don't throw here - the auth user is created successfully
                        // Just log the error and continue
                    }
                }

                return data;
            } catch (error) {
                console.error('Signup process error:', error);
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