const supabase = require('../../config/supabase');

exports.signup = async (req, res) => {
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
                }
            ])
            .select()
            .single();

        if (profileError) throw profileError;

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                user: {
                    ...authData.user,
                    profile: profileData
                },
                session: authData.session
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

exports.login = async (req, res) => {
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

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    ...data.user,
                    profile: profileData || null
                },
                session: data.session
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