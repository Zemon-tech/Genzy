const express = require('express');
const router = express.Router();
const { signup, login, logout, getSession } = require('../../controllers/user/authController');
const { verifyToken } = require('../../middleware/authMiddleware');

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/session', verifyToken, getSession);

module.exports = router; 