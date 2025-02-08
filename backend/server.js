const express = require('express');
const cors = require('cors');
require('dotenv').config();

const userAuthRoutes = require('./routes/user/authRoutes');
const sellerAuthRoutes = require('./routes/seller/authRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/user/auth', userAuthRoutes);
app.use('/api/seller/auth', sellerAuthRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 