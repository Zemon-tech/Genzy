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
                
                if (error) throw error;

                if (mounted) {
                    if (session?.user) {
                        setUser(session.user);
                        localStorage.setItem('my-app-auth', JSON.stringify(session));
                    } else {
                        setUser(null);
                        localStorage.removeItem('my-app-auth');
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
                    localStorage.setItem('my-app-auth', JSON.stringify(session));
                    break;
                case 'SIGNED_OUT':
                    setUser(null);
                    localStorage.removeItem('my-app-auth');
                    break;
                case 'TOKEN_REFRESHED':
                    if (session) {
                        setUser(session.user);
                        localStorage.setItem('my-app-auth', JSON.stringify(session));
                    }
                    break;
                default:
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
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            return data;
        },
        logout: async () => {
            await supabase.auth.signOut();
            localStorage.removeItem('my-app-auth');
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