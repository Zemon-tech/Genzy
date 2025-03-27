import express from 'express';
import { signup, login, logout, getSession } from '../../controllers/user/authController.js';
import { verifyToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/session', verifyToken, getSession);

export default router; 