// Script to verify RLS policies for shopping_cart and wishlist tables
import supabase from './src/config/supabase.js';

const verifyRlsPolicies = async () => {
  console.log('Starting RLS verification...');
  
  try {
    // 1. Check if we have an authenticated session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return;
    }
    
    console.log('Current session:', sessionData?.session ? 'Active' : 'None');
    
    if (!sessionData?.session) {
      console.log('No active session, skipping table access tests');
      return;
    }
    
    const userId = sessionData.session.user.id;
    console.log('User ID:', userId);
    
    // 2. Test shopping_cart table access
    console.log('\nTesting shopping_cart table access:');
    const { data: cartData, error: cartError } = await supabase
      .from('shopping_cart')
      .select('*')
      .limit(1);
      
    if (cartError) {
      console.error('Error accessing shopping_cart table:', cartError);
    } else {
      console.log('Successfully accessed shopping_cart table');
      console.log('Sample data:', cartData);
    }
    
    // 3. Test wishlist table access
    console.log('\nTesting wishlist table access:');
    const { data: wishlistData, error: wishlistError } = await supabase
      .from('wishlist')
      .select('*')
      .limit(1);
      
    if (wishlistError) {
      console.error('Error accessing wishlist table:', wishlistError);
    } else {
      console.log('Successfully accessed wishlist table');
      console.log('Sample data:', wishlistData);
    }
    
    // 4. Test specific user filtering
    console.log('\nTesting user-specific filtering:');
    const { data: userCartData, error: userCartError } = await supabase
      .from('shopping_cart')
      .select('*')
      .eq('user_id', userId)
      .limit(5);
      
    if (userCartError) {
      console.error('Error accessing user shopping_cart data:', userCartError);
    } else {
      console.log('Successfully accessed user shopping_cart data');
      console.log(`Found ${userCartData.length} cart items for this user`);
    }
    
    const { data: userWishlistData, error: userWishlistError } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', userId)
      .limit(5);
      
    if (userWishlistError) {
      console.error('Error accessing user wishlist data:', userWishlistError);
    } else {
      console.log('Successfully accessed user wishlist data');
      console.log(`Found ${userWishlistData.length} wishlist items for this user`);
    }
    
  } catch (error) {
    console.error('Verification script error:', error);
  }
  
  console.log('\nRLS verification complete');
};

// Execute the verification
verifyRlsPolicies(); 