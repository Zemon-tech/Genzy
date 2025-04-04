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
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Middleware
app.use(cookieParser());

// Configure CORS
const corsOptions = {
    origin: [
        'http://localhost', 
        'http://localhost:80', 
        'http://localhost:5173', 
        'http://frontend',
        // Add your Cloudflare Pages domain here
        'https://genzy.pages.dev',
        // If you have a custom domain, add it here
        // 'https://yourdomain.com'
    ],
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
app.use('/api/products', productRoutes);

// Add refresh token route
app.post('/api/auth/refresh', refreshAccessToken);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 