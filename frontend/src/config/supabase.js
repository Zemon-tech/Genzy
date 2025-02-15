import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: localStorage,
        storageKey: 'my-app-auth',
        flowType: 'pkce'
    }
});

// Minimal auth state change logging
supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'TOKEN_REFRESHED' && session) {
        localStorage.setItem('my-app-auth', JSON.stringify(session));
    } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('my-app-auth');
    }
});

// Helper function to generate a unique file name
export const generateFileName = (file) => {
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    return `${timestamp}-${randomString}.${fileExtension}`;
};

export default supabase; 