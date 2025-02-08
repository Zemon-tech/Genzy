import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, SAMPLE_USER_CREDS } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
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
    if (formData.email === SAMPLE_USER_CREDS.email && formData.password === SAMPLE_USER_CREDS.password) {
      login({
        email: formData.email,
        name: 'John Doe',
        avatar: '👤'
      });
      navigate('/profile');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="p-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-center">Login</h2>
        <p className="mt-2 text-center text-gray-600">
          Welcome back to Genzy
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter your email"
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
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Login
        </button>

        <div className="text-center text-sm text-gray-600">
          <p>Sample credentials:</p>
          <p>Email: {SAMPLE_USER_CREDS.email}</p>
          <p>Password: {SAMPLE_USER_CREDS.password}</p>
        </div>
      </form>
    </div>
  );
};

export default Login; 