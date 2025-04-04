import { createRequestHandler } from '@cloudflare/itty-router-extensions';
import { Router } from 'itty-router';
import { createClient } from '@supabase/supabase-js';

// Create a new router
const router = Router();

// Initialize Supabase client
const createSupabaseClient = (env) => {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
};

// Define your routes here
router.get('/', () => new Response('Genzy API is running!'));

// Add your API routes here
// Example:
// router.get('/api/users', async (request, env) => {
//   const supabase = createSupabaseClient(env);
//   const { data, error } = await supabase.from('users').select('*');
//   
//   if (error) return new Response(JSON.stringify({ error: error.message }), {
//     status: 400,
//     headers: { 'Content-Type': 'application/json' }
//   });
//   
//   return new Response(JSON.stringify(data), {
//     headers: { 'Content-Type': 'application/json' }
//   });
// });

// Handle CORS preflight requests
router.options('*', () => new Response(null, {
  status: 204,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}));

// Add CORS headers to all responses
const addCorsHeaders = (response) => {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
};

// Handle all other requests
router.all('*', () => new Response('Not Found', { status: 404 }));

// Create the request handler
export default {
  fetch: (request, env, ctx) => {
    // Handle the request with the router
    return router.handle(request, env, ctx)
      .then(addCorsHeaders)
      .catch(error => {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      });
  }
}; 