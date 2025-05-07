import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { dirname } from 'path';

// Get the directory path for the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials. Please check your .env file.');
}

// Check if we're using the service role key
const isUsingServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY && 
                         supabaseKey === process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`Using Supabase ${isUsingServiceKey ? 'service role' : 'anon'} key for backend operations.`);

if (!isUsingServiceKey) {
    console.warn('WARNING: Using anon key for backend operations. Some admin features will not work.');
    console.warn('Set SUPABASE_SERVICE_ROLE_KEY in your .env file for full admin functionality.');
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

export default supabase; 