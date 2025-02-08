const supabase = require('../../config/supabase');

exports.signup = async (req, res) => {
    try {
        const { email, password, brand_name, phone_number } = req.body;

        // Sign up the seller with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password
        });

        if (authError) throw authError;

        // Add seller to sellers table with required fields
        const { data: sellerData, error: sellerError } = await supabase
            .from('sellers')
            .insert([
                {
                    id: authData.user.id,
                    brand_name,
                    business_email: email,
                    phone_number,
                    is_verified: false // Default to false, admin will verify later
                }
            ]);

        if (sellerError) throw sellerError;

        res.status(201).json({
            success: true,
            message: 'Seller account created successfully. Please wait for verification.',
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

        // First authenticate with Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) throw authError;

        // Check if seller is verified
        const { data: sellerData, error: sellerError } = await supabase
            .from('sellers')
            .select('is_verified')
            .eq('id', authData.user.id)
            .single();

        if (sellerError) throw sellerError;

        if (!sellerData.is_verified) {
            throw new Error('Your account is pending verification. Please wait for admin approval.');
        }

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: authData
        });

    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
}; 