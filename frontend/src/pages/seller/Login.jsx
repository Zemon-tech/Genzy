import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSellerAuth } from '../../context/SellerAuthContext';

// Sample credentials (in real app, these would be in the database)
const SAMPLE_CREDS = {
  email: 'seller@genzy.com',
  password: 'Seller@123'
};

const SellerLogin = () => {
  const navigate = useNavigate();
  const { handleLogin, signup } = useSellerAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    brand_name: '',
    phone_number: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        await signup(
          formData.email,
          formData.password,
          formData.brand_name,
          formData.phone_number
        );
        // Show success message and switch to login
        setError('Signup successful! Please wait for verification before logging in.');
        setIsSignup(false);
        setFormData({
          email: '',
          password: '',
          brand_name: '',
          phone_number: ''
        });
      } else {
        const result = await handleLogin(formData.email, formData.password);
        if (result.success) {
          navigate('/seller/dashboard');
        } else {
          setError(result.error || 'Login failed');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-lg mx-auto p-6">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-center text-gray-900">
              {isSignup ? 'Seller Sign Up' : 'Seller Login'}
            </h2>
            <p className="mt-2 text-center text-gray-600">
              {isSignup
                ? 'Create your seller account'
                : 'Enter your credentials to access the seller dashboard'}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {isSignup && (
              <>
                <div>
                  <label htmlFor="brand_name" className="block text-sm font-medium text-gray-700">
                    Brand Name
                  </label>
                  <input
                    id="brand_name"
                    name="brand_name"
                    type="text"
                    required={isSignup}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your brand name"
                    value={formData.brand_name}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    required={isSignup}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your phone number"
                    value={formData.phone_number}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Business Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your business email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {error && (
              <div className={`text-sm text-center p-2 rounded ${
                error.includes('successful') ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'
              }`}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Processing...' : (isSignup ? 'Create Account' : 'Login to Dashboard')}
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError('');
                  setFormData({
                    email: '',
                    password: '',
                    brand_name: '',
                    phone_number: ''
                  });
                }}
                className="text-indigo-600 hover:text-indigo-500"
              >
                {isSignup
                  ? 'Already have an account? Login'
                  : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SellerLogin; 