import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5011/api';

// Create axios instance with credentials
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Important for cookies
    headers: {
        'Content-Type': 'application/json',
    }
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401 and we haven't retried yet and it's not a refresh token request
        if (error.response?.status === 401 && 
            !originalRequest._retry && 
            !originalRequest.url.includes('/auth/refresh')) {
            
            if (isRefreshing) {
                // If refreshing, wait for it to complete
                try {
                    await new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    });
                    return api(originalRequest);
                } catch (err) {
                    return Promise.reject(err);
                }
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await api.post('/auth/refresh');
                processQueue(null);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Function to check session status
    const checkSession = async () => {
        try {
            console.log('Checking session...');
            const response = await api.get('/user/auth/session');
            console.log('Session response:', response.data);
            
            if (response.data.success) {
                setUser(response.data.data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Session check error:', error.response?.data || error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Check session on mount
        checkSession();

        // No need for refresh interval as the interceptor will handle it
    }, []);

    const login = async (email, password) => {
        try {
            console.log('Attempting login...');
            const response = await api.post('/user/auth/login', {
                email,
                password,
            });
            console.log('Login response:', response.data);

            if (response.data.success) {
                setUser(response.data.data.user);
            }

            return response.data;
        } catch (error) {
            console.error('Login error:', error.response?.data || error);
            throw error.response?.data || error;
        }
    };

    const signup = async (email, password, full_name) => {
        try {
            console.log('Attempting signup...');
            const response = await api.post('/user/auth/signup', {
                email,
                password,
                full_name
            });
            console.log('Signup response:', response.data);

            if (response.data.success) {
                setUser(response.data.data.user);
            }

            return response.data;
        } catch (error) {
            console.error('Signup error:', error.response?.data || error);
            throw error.response?.data || error;
        }
    };

    const logout = async () => {
        try {
            console.log('Attempting logout...');
            await api.post('/user/auth/logout');
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error.response?.data || error);
            throw error.response?.data || error;
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