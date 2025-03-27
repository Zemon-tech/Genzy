import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL;

console.log('API URL:', API_URL); // Log the API URL for debugging

export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add request interceptor to handle errors
api.interceptors.request.use(
    (config) => {
        console.log('Making request to:', config.url);
        console.log('Full URL:', `${API_URL}${config.url}`);
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