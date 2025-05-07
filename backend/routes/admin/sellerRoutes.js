import express from 'express';
import { createSeller } from '../../controllers/admin/sellerController.js';
import { verifySupabaseToken, verifyAdminRoleWithSupabase } from '../../middleware/authMiddleware.js';
import supabase from '../../config/supabase.js';

const router = express.Router();

// Test endpoint for validating Supabase tokens
router.post('/validate-token', async (req, res) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const token = authHeader.substring(7);
        console.log('Validating token:', token.substring(0, 15) + '...');

        // Verify the token directly with Supabase
        const { data, error } = await supabase.auth.getUser(token);
        
        if (error) {
            console.error('Token validation error:', error);
            return res.status(401).json({
                success: false,
                message: 'Invalid Supabase token',
                error: error.message
            });
        }

        if (!data || !data.user) {
            return res.status(401).json({
                success: false,
                message: 'Token did not return a valid user'
            });
        }

        // Check if user has admin role
        const isAdmin = 
            data.user?.user_metadata?.role === 'admin' || 
            data.user?.raw_user_meta_data?.role === 'admin';
        
        // If not in metadata, get from database
        if (!isAdmin) {
            const { data: profileData, error: profileError } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', data.user.id)
                .single();
                
            if (profileError && profileError.code !== 'PGRST116') {
                return res.status(500).json({
                    success: false,
                    message: 'Error checking user role',
                    error: profileError.message
                });
            }
            
            if (!profileData || profileData.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'User is not an admin',
                    user: {
                        id: data.user.id,
                        email: data.user.email,
                        role: profileData?.role || 'unknown'
                    }
                });
            }
        }

        // Success!
        return res.status(200).json({
            success: true,
            message: 'Token is valid and user is an admin',
            user: {
                id: data.user.id,
                email: data.user.email,
                role: 'admin'
            }
        });
    } catch (error) {
        console.error('Error validating token:', error);
        return res.status(500).json({
            success: false,
            message: 'Error validating token',
            error: error.message
        });
    }
});

// Simple auth check endpoint for admins
router.get('/auth-check', verifySupabaseToken, verifyAdminRoleWithSupabase, (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Admin authentication verified',
        user: {
            id: req.user.userId,
            email: req.user.email
        }
    });
});

// All admin routes should be protected
// Use the new middleware that verifies Supabase tokens directly
router.post('/create-seller', verifySupabaseToken, verifyAdminRoleWithSupabase, createSeller);

export default router; 