import { useState } from 'react';
import { supabase } from '../../config/supabaseClient';
import { useNavigate } from 'react-router-dom';

const SellerLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    brandName: '',
    phoneNumber: '',
    businessAddress: '',
    gstNumber: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // Validate form data
      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      console.log('Starting signup process...'); // Debug log

      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            is_seller: true, // Add metadata to identify seller accounts
          },
        },
      });

      console.log('Auth response:', authData, authError); // Debug log

      if (authError) throw authError;

      if (!authData?.user?.id) {
        throw new Error('Failed to create account');
      }

      console.log('Creating seller profile...'); // Debug log

      // 2. Create seller profile
      const { data: sellerData, error: profileError } = await supabase
        .from('sellers')
        .insert([{
          id: authData.user.id,
          brand_name: formData.brandName,
          business_email: formData.email,
          phone_number: formData.phoneNumber,
          business_address: formData.businessAddress,
          gst_number: formData.gstNumber,
          is_verified: false
        }])
        .select()
        .single();

      console.log('Seller profile response:', sellerData, profileError); // Debug log

      if (profileError) {
        // If profile creation fails, attempt to delete the auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.error('Seller profile creation error:', profileError);
        throw new Error(profileError.message || 'Failed to create seller profile');
      }

      // Success
      alert('Registration successful! Please check your email to verify your account. Our team will verify your seller account soon.');
      setIsLogin(true);
      
    } catch (error) {
      console.error('Signup error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      // 1. Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // 2. Check if user is a seller
      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (sellerError || !sellerData) {
        throw new Error('Unauthorized: Not a seller account');
      }

      if (!sellerData.is_verified) {
        throw new Error('Your seller account is pending verification');
      }

      // Successful login
      navigate('/seller/dashboard');
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Seller Login' : 'Register as Seller'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={isLogin ? handleLogin : handleSignup}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Business Email"
              />
            </div>
            
            {!isLogin && (
              <>
                <div>
                  <input
                    name="brandName"
                    type="text"
                    required
                    value={formData.brandName}
                    onChange={handleChange}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Brand Name"
                  />
                </div>
                <div>
                  <input
                    name="phoneNumber"
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Phone Number"
                  />
                </div>
                <div>
                  <input
                    name="businessAddress"
                    type="text"
                    required
                    value={formData.businessAddress}
                    onChange={handleChange}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Business Address"
                  />
                </div>
                <div>
                  <input
                    name="gstNumber"
                    type="text"
                    required
                    value={formData.gstNumber}
                    onChange={handleChange}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="GST Number"
                  />
                </div>
              </>
            )}
            
            <div>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign in' : 'Register')}
            </button>
          </div>
          
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-600 hover:text-indigo-500"
            >
              {isLogin ? 'Need a seller account? Register' : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellerLogin; 