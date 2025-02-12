import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zxefjghtlnmkhnwkdlej.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZWZqZ2h0bG5ta2hud2tkbGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5OTAzMTgsImV4cCI6MjA1NDU2NjMxOH0.juwsoUH3tiDPaQvlci8Y55obZJJH76hJQHHIpYMftZc';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    flowType: 'pkce'
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