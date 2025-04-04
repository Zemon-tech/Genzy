import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

// Import routes
import userAuthRoutes from './routes/user/authRoutes.js';
import sellerAuthRoutes from './routes/seller/authRoutes.js';
import productRoutes from './routes/productRoutes.js';

// Import middleware
import { refreshAccessToken } from './middleware/authMiddleware.js';

// Configure environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load appropriate .env file based on environment
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: path.join(__dirname, envFile) });

const app = express();

// Middleware
app.use(cookieParser());

// Configure CORS with dynamic origins based on environment
const allowedOrigins = [
    'http://localhost', 
    'http://localhost:80', 
    'http://localhost:5173', 
    'http://frontend'
];

// Add production frontend URL if available
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, etc)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.some(allowed => origin.startsWith(allowed))) {
            callback(null, true);
        } else {
            console.warn(`Origin ${origin} not allowed by CORS`);
            callback(null, true); // Still allow for easier debugging, change to false in strict environments
        }
    },
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
    if (process.env.NODE_ENV !== 'production') {
        console.log('Request cookies:', req.cookies);
        console.log('Request headers:', req.headers);
        console.log('Request path:', req.path);
    }
    
    // Add headers to allow credentials
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    
    next();
});

// Routes
app.use('/api/user/auth', userAuthRoutes);
app.use('/api/seller/auth', sellerAuthRoutes);
app.use('/api/products', productRoutes);

// Add refresh token route
app.post('/api/auth/refresh', refreshAccessToken);

// Basic health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
}); 