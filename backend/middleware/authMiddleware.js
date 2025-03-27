import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // In production, always use environment variable
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

// Middleware to verify access token
export const verifyToken = (req, res, next) => {
    try {
        console.log('Cookies received:', req.cookies);
        const token = req.cookies.accessToken;
        
        if (!token) {
            console.log('No access token found in cookies');
            return res.status(401).json({
                success: false,
                message: 'Access token not found'
            });
        }

        console.log('Verifying token with secret');
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