import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials. Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: localStorage,
        storageKey: 'supabase-auth',
    }
});

// Verify connection
const verifyConnection = async () => {
    try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
            console.error('Supabase connection error:', error);
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