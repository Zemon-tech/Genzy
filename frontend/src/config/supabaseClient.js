import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zxefjghtlnmkhnwkdlej.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZWZqZ2h0bG5ta2hud2tkbGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5OTAzMTgsImV4cCI6MjA1NDU2NjMxOH0.juwsoUH3tiDPaQvlci8Y55obZJJH76hJQHHIpYMftZc'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey
    }
  },
  db: {
    schema: 'public'
  }
}) 