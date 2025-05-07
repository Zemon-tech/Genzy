import supabase from '../../config/supabase.js';

/**
 * Create a new seller account as an admin
 * This endpoint will:
 * 1. Create a user in auth.users
 * 2. Add a record to the sellers table
 * 3. Set the user as verified by default
 */
export const createSeller = async (req, res) => {
    try {
        const { brand_name, business_email, phone_number, password } = req.body;
        
        // Validate required fields
        if (!brand_name || !business_email || !phone_number || !password) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(business_email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Check if the email is already in use
        const { data: existingUser, error: userError } = await supabase.auth.admin.listUsers();
        if (userError) {
            console.error('Error checking existing users:', userError);
            return res.status(500).json({
                success: false,
                message: 'Error checking existing users'
            });
        }

        const emailExists = existingUser.users.some(user => user.email === business_email);
        if (emailExists) {
            return res.status(400).json({
                success: false,
                message: 'Email already in use'
            });
        }

        // Create user with admin API
        const { data: userData, error: createError } = await supabase.auth.admin.createUser({
            email: business_email,
            password: password,
            email_confirm: true,
            user_metadata: {
                role: 'seller'
            }
        });

        if (createError) {
            console.error('Error creating user:', createError);
            return res.status(400).json({
                success: false,
                message: createError.message
            });
        }

        // Create seller profile
        const { data: sellerData, error: sellerError } = await supabase
            .from('sellers')
            .insert([{
                id: userData.user.id,
                brand_name,
                business_email,
                phone_number,
                is_verified: true, // Auto-verify when created by admin
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (sellerError) {
            console.error('Error creating seller profile:', sellerError);
            
            // Try to delete the auth user if profile creation fails
            try {
                await supabase.auth.admin.deleteUser(userData.user.id);
            } catch (err) {
                console.error('Failed to clean up user after profile creation failure:', err);
            }
            
            return res.status(400).json({
                success: false,
                message: sellerError.message
            });
        }

        // Return success response
        res.status(201).json({
            success: true,
            message: 'Seller created successfully',
            data: sellerData
        });

    } catch (error) {
        console.error('Error in createSeller:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 