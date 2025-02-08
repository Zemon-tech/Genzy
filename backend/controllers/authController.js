const supabase = require('../config/supabase');

exports.signup = async (req, res) => {
    try {
        const { email, password, full_name } = req.body;

        // Sign up the user with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password
        });

        if (authError) throw authError;

        // Add user to user_profiles table with only the allowed fields
        const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .insert([
                {
                    id: authData.user.id,  // UUID from auth.users
                    full_name,             // Only storing full_name, as per schema
                }
            ]);

        if (profileError) throw profileError;

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: authData
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data
        });

    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
}; 