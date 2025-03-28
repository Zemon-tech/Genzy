import supabase from '../../config/supabase.js';
import { generateTokens, setTokenCookies, clearTokenCookies } from '../../middleware/authMiddleware.js';

export const signup = async (req, res) => {
    try {
        const { email, password, full_name } = req.body;

        // Sign up the user with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name
                }
            }
        });

        if (authError) throw authError;

        // Add user to user_profiles table with only the allowed fields
        const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .insert([
                {
                    id: authData.user.id,
                    full_name,
                    email: email,
                    address: '',
                    landmark: '',
                    city: '',
                    state: '',
                    pincode: '',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (profileError) throw profileError;

        // Generate tokens and set cookies
        const tokens = generateTokens(authData.user);
        setTokenCookies(res, tokens);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                user: {
                    ...authData.user,
                    profile: profileData
                }
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // Get user profile data
        const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError && profileError.code !== 'PGRST116') {
            throw profileError;
        }

        // Generate tokens and set cookies
        const tokens = generateTokens(data.user);
        setTokenCookies(res, tokens);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    ...data.user,
                    profile: profileData || null
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

export const logout = async (req, res) => {
    try {
        await supabase.auth.signOut();
        clearTokenCookies(res);
        
        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get current user session
export const getSession = async (req, res) => {
    try {
        // The user object is attached by the verifyToken middleware
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'No active session'
            });
        }

        const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', req.user.userId)
            .single();

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: req.user.userId,
                    email: req.user.email,
                    profile: profileData || null
                }
            }
        });
    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 