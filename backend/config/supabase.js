const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials. Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    },
    db: {
        schema: 'public'
    }
});

// Test database connection
const testConnection = async () => {
    try {
        const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
        if (error) {
            console.error('Database connection error:', error);
        } else {
            console.log('Database connection successful');
        }
    } catch (err) {
        console.error('Failed to test database connection:', err);
    }
};

testConnection();

module.exports = supabase; 