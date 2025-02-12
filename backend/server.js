const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const userAuthRoutes = require('./routes/user/authRoutes');
const sellerAuthRoutes = require('./routes/seller/authRoutes');

const app = express();

// Middleware
app.use(cookieParser());

// Configure CORS
const corsOptions = {
    origin: ['http://localhost', 'http://localhost:80', 'http://localhost:5173', 'http://frontend'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Set-Cookie'],
    exposedHeaders: ['Set-Cookie'],
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.use(express.json());

// Debug middleware for cookies and headers
app.use((req, res, next) => {
    console.log('Request cookies:', req.cookies);
    console.log('Request headers:', req.headers);
    console.log('Request path:', req.path);
    
    // Add headers to allow credentials
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    
    next();
});

// Routes
app.use('/api/user/auth', userAuthRoutes);
app.use('/api/seller/auth', sellerAuthRoutes);

// Add refresh token route
const { refreshAccessToken } = require('./middleware/authMiddleware');
app.post('/api/auth/refresh', refreshAccessToken);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 