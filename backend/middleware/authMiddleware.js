import jwt from 'jsonwebtoken';
import supabase from '../config/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // In production, always use environment variable
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

// New middleware that uses Supabase directly for token verification
export const verifySupabaseToken = async (req, res, next) => {
    try {
        console.log('Headers received:', JSON.stringify(req.headers));
        
        // Get token from Authorization header
        let supabaseToken = null;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            supabaseToken = req.headers.authorization.substring(7);
            console.log('Using Supabase token from Authorization header, length:', supabaseToken.length);
        }
        
        if (!supabaseToken) {
            console.log('No Supabase token found in Authorization header');
            return res.status(401).json({
                success: false,
                message: 'Access token not found'
            });
        }

        // Verify the token with Supabase Auth API
        const { data, error } = await supabase.auth.getUser(supabaseToken);
        
        if (error) {
            console.error('Supabase token verification error:', error);
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        
        if (!data || !data.user) {
            console.error('No user data returned from Supabase');
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        
        console.log('Supabase token verified, user:', data.user.id);
        
        // Attach the user data to the request
        req.user = {
            userId: data.user.id,
            email: data.user.email,
            user_metadata: data.user.user_metadata,
            raw_user_meta_data: data.user.raw_user_meta_data
        };
        
        next();
    } catch (error) {
        console.error('Supabase authentication error:', error);
        return res.status(401).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

// Updated verifyAdminRole to use the user data from Supabase token verification
export const verifyAdminRoleWithSupabase = async (req, res, next) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Check user metadata for admin role from the attached user data
        const isAdmin = 
            req.user?.user_metadata?.role === 'admin' || 
            req.user?.raw_user_meta_data?.role === 'admin';

        // If not found in metadata, check the user_profiles table
        if (!isAdmin) {
            const { data: profileData, error: profileError } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', req.user.userId)
                .single();
            
            if (profileError && profileError.code !== 'PGRST116') {
                console.error('Error fetching user profile:', profileError);
                return res.status(500).json({
                    success: false,
                    message: 'Error verifying admin role'
                });
            }

            if (profileData && profileData.role === 'admin') {
                // Allow access if the role is admin
                next();
                return;
            }

            // Access denied for non-admins
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        // Allow access for admins
        next();
    } catch (error) {
        console.error('Admin verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error verifying admin role'
        });
    }
};

// Middleware to verify admin role - for backwards compatibility
export const verifyAdminRole = async (req, res, next) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Get user data to check role
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
            req.user.userId
        );
        
        if (userError) {
            console.error('Error fetching user data:', userError);
            return res.status(500).json({
                success: false,
                message: 'Error verifying admin role'
            });
        }

        if (!userData) {
            return res.status(403).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check user metadata for admin role
        const isAdmin = 
            userData.user?.user_metadata?.role === 'admin' || 
            userData.user?.raw_user_meta_data?.role === 'admin';

        // If not found in metadata, check the user_profiles table
        if (!isAdmin) {
            const { data: profileData, error: profileError } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', req.user.userId)
                .single();
            
            if (profileError && profileError.code !== 'PGRST116') {
                console.error('Error fetching user profile:', profileError);
                return res.status(500).json({
                    success: false,
                    message: 'Error verifying admin role'
                });
            }

            if (profileData && profileData.role === 'admin') {
                // Allow access if the role is admin
                next();
                return;
            }

            // Access denied for non-admins
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        // Allow access for admins
        next();
    } catch (error) {
        console.error('Admin verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error verifying admin role'
        });
    }
};

// Existing middleware - keep for compatibility with existing endpoints but use the new ones for admin routes
export const verifyToken = (req, res, next) => {
    try {
        console.log('Headers received:', JSON.stringify(req.headers));
        console.log('Cookies received:', req.cookies);
        
        // First check for token in cookies
        let token = req.cookies?.accessToken;
        
        // If not in cookies, check Authorization header
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            console.log('Auth header found:', authHeader);
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
                console.log('Using token from Authorization header, length:', token.length);
            }
        }
        
        if (!token) {
            console.log('No access token found in cookies or Authorization header');
            return res.status(401).json({
                success: false,
                message: 'Access token not found'
            });
        }

        console.log('Verifying token with secret, token starts with:', token.substring(0, 15) + '...');
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                console.log('Token verification error:', err.name, err.message);
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        success: false,
                        message: 'Token expired'
                    });
                }
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token'
                });
            }
            
            console.log('Token verified successfully, decoded:', decoded);
            req.user = decoded;
            next();
        });
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

// Generate tokens
export const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { userId: user.id },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
};

// Set cookies
export const setTokenCookies = (res, { accessToken, refreshToken }) => {
    // Set access token cookie
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Only use HTTPS in production
        sameSite: 'lax', // Changed from 'strict' to 'lax' for cross-origin
        path: '/',
        maxAge: 15 * 60 * 1000 // 15 minutes
    });

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Changed from 'strict' to 'lax' for cross-origin
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

// Clear auth cookies
export const clearTokenCookies = (res) => {
    res.cookie('accessToken', '', { 
        maxAge: 0,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
    res.cookie('refreshToken', '', { 
        maxAge: 0,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
};

// Refresh token middleware
export const refreshAccessToken = async (req, res) => {
    try {
        console.log('Refresh token request received');
        console.log('Cookies:', req.cookies);
        
        const refreshToken = req.cookies.refreshToken;
        
        if (!refreshToken) {
            console.log('No refresh token found in cookies');
            return res.status(401).json({
                success: false,
                message: 'Refresh token not found'
            });
        }

        console.log('Verifying refresh token');
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        console.log('Refresh token verified, decoded:', decoded);

        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens({ 
            id: decoded.userId,
            email: decoded.email // Include email if available in refresh token
        });
        
        console.log('New tokens generated');
        
        // Set the new cookies
        setTokenCookies(res, { accessToken, refreshToken: newRefreshToken });
        
        console.log('New cookies set');

        return res.json({
            success: true,
            message: 'Token refreshed successfully'
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        
        // Clear cookies on refresh token failure
        clearTokenCookies(res);
        
        return res.status(401).json({
            success: false,
            message: error.name === 'TokenExpiredError' 
                ? 'Refresh token has expired' 
                : 'Invalid refresh token'
        });
    }
}; 