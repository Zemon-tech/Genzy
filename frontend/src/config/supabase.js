import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials. Please check your .env file.');
}

// Log the URL (without the key) for debugging
console.log('Supabase URL being used:', supabaseUrl);

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: localStorage,
        storageKey: 'sb-auth-token'
    }
});

// Verify connection and session
const verifyConnection = async () => {
    try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
            console.error('Supabase connection error:', error);
        } else {
            console.log('Supabase connection verified successfully', data);
        }
    } catch (err) {
        console.error('Failed to verify Supabase connection:', err);
    }
};

verifyConnection();

// Test connection and log any issues
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session);
});

// Helper function to generate a unique file name
export const generateFileName = (file) => {
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    return `${timestamp}-${randomString}.${fileExtension}`;
};

export default supabase; 