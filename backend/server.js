const express = require('express');
const cors = require('cors');
require('dotenv').config();

const userAuthRoutes = require('./routes/user/authRoutes');
const sellerAuthRoutes = require('./routes/seller/authRoutes');
const productRoutes = require('./routes/seller/productRoutes');

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Add your frontend URLs
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Other middleware
app.use(express.json());

// Routes
app.use('/api/user/auth', userAuthRoutes);
app.use('/api/seller/auth', sellerAuthRoutes);
app.use('/api/seller', productRoutes);

const port = process.env.PORT || 5011;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 