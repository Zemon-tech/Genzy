import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Sample credentials (in real app, these would be in the database)
const SAMPLE_CREDS = {
  email: 'seller@genzy.com',
  password: 'Seller@123'
};

const SellerLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple validation for demo
    if (formData.email === SAMPLE_CREDS.email && formData.password === SAMPLE_CREDS.password) {
      localStorage.setItem('sellerAuth', 'true');
      navigate('/seller/dashboard');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-lg mx-auto p-6">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-center text-gray-900">
              Seller Login
            </h2>
            <p className="mt-2 text-center text-gray-600">
              Enter your credentials to access the seller dashboard
            </p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Brand Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your brand email"
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
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Login to Dashboard
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SellerLogin; 