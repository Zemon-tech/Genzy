import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../config/supabase';
import toast from 'react-hot-toast';

const UpdatePassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if we have a hash fragment with access_token, indicating password reset flow
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token')) {
      toast.error('Invalid password reset link. Please request a new one.');
      navigate('/login');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate input
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);

      // Update password 
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      // Show success and redirect after a delay
      setSuccess(true);
      toast.success('Password updated successfully!');
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Error updating password:', error);
      setError(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[480px] mx-auto bg-white min-h-screen p-4">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-center">Set New Password</h2>
          <p className="mt-2 text-center text-gray-600">
            Please enter your new password
          </p>
        </div>

        {success ? (
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-green-700 mb-2">Password updated successfully!</p>
            <p className="text-gray-600">Redirecting to login page...</p>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-indigo-600 hover:text-indigo-500"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UpdatePassword; 