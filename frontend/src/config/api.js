import axios from 'axios';

// Get environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Determine the base URL based on environment
// If we're in production (Cloudflare), use the full backend URL
// Otherwise, use the relative /api path for local development
const baseURL = import.meta.env.PROD ? `${BACKEND_URL}${API_BASE_URL}` : API_BASE_URL;

console.log('API Base URL:', baseURL); // Log the API URL for debugging

export const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add request interceptor to handle errors
api.interceptors.request.use(
    (config) => {
        console.log('Making request to:', config.url);
        console.log('Full URL:', `${baseURL}${config.url}`);
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('Response error:', error);
        return Promise.reject(error);
    }
); 