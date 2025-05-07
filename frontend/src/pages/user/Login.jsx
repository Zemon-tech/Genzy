import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../config/supabase';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const Login = () => {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [sendingReset, setSendingReset] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: ''
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
        await signup(formData.email, formData.password, formData.full_name);
        // After successful signup, log them in
        await login(formData.email, formData.password);
      } else {
        await login(formData.email, formData.password);
      }
      navigate('/profile');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!resetEmail || !resetEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setCheckingEmail(true);
      setError('');
      
      // Use the admin auth API to check if a user with this email exists
      // For security reasons, Supabase doesn't provide a direct way to check if 
      // an email exists without sending an OTP or password reset email
      
      // Try to sign in with OTP (magic link) but don't actually send the email
      const { error: userError } = await supabase.auth.signInWithOtp({
        email: resetEmail,
        options: {
          shouldCreateUser: false, // Don't create a new user if not found
        }
      });
      
      // If we get any error, the email likely doesn't exist or there's another issue
      if (userError) {
        console.log('Error checking email:', userError.message);
        
        // Handle all possible error messages that indicate the user doesn't exist
        if (userError.message.includes('not found') || 
            userError.message.includes('No user found') || 
            userError.message.includes('Invalid login credentials') ||
            userError.message.includes('Signups not allowed') ||
            userError.message.includes('not allowed for otp')) {
          setError('Email is not registered. Please signup ❤️');
          setEmailVerified(false);
          return;
        }
        
        // Other errors should be thrown
        throw userError;
      }
      
      // If we reach here without an error, the email exists
      setEmailVerified(true);
      toast.success('Email verified! You can now send a reset link.');
      
    } catch (err) {
      console.error('Error verifying email:', err);
      
      // Handle all possible error messages that indicate the user doesn't exist
      if (err.message.includes('not found') || 
          err.message.includes('No user') || 
          err.message.includes('Invalid login credentials') ||
          err.message.includes('Signups not allowed') ||
          err.message.includes('not allowed for otp')) {
        setError('Email is not registered. Please signup ❤️');
        setEmailVerified(false);
      } else {
        setError(err.message || 'Failed to verify email');
      }
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!emailVerified) {
      setError('Please verify your email first');
      return;
    }

    try {
      setSendingReset(true);
      setError('');
      
      // Email is already verified, send the reset email
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;
      
      toast.success('Password reset email sent. Please check your inbox.');
      setForgotPassword(false);
      setResetEmail('');
      setEmailVerified(false);
    } catch (err) {
      console.error('Error sending reset email:', err);
      setError(err.message || 'Failed to send reset email');
    } finally {
      setSendingReset(false);
    }
  };

  const handleResetEmailChange = (e) => {
    setResetEmail(e.target.value);
    // Reset verification when email changes
    setEmailVerified(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-[480px] mx-auto min-h-screen">
        {/* Brand Header with Dark Background */}
        <div className="bg-[#292728] px-4 pt-3 pb-6 text-center">
          <img 
            src="/photologo.svg" 
            alt="Brand Logo" 
            className="h-14 mx-auto object-contain drop-shadow-lg"
          />
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative px-6 py-8 -mt-4 rounded-t-3xl bg-white shadow-lg min-h-[calc(100vh-100px)]"
        >
          <h2 className="text-2xl font-bold text-center mb-1">
            {isSignup 
              ? 'Sign Up' 
              : forgotPassword 
                ? 'Reset Password' 
                : 'Login'}
          </h2>
          <p className="text-center text-gray-500 text-sm mb-6">
            {isSignup 
              ? 'Create your account to get started' 
              : forgotPassword 
                ? 'Enter your email to receive a reset link' 
                : 'Welcome back to Haven'}
          </p>

          {forgotPassword ? (
            <form className="space-y-4" onSubmit={handleForgotPasswordSubmit}>
              <div>
                <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="resetEmail"
                  type="email"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={handleResetEmailChange}
                  disabled={checkingEmail || sendingReset}
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center bg-red-50 p-2.5 rounded-xl">
                  {error}
                </div>
              )}

              {emailVerified && (
                <div className="text-green-500 text-sm text-center bg-green-50 p-2.5 rounded-xl">
                  Email verified! You can now send a reset link.
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleVerifyEmail}
                  disabled={checkingEmail || !resetEmail || sendingReset}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                >
                  {checkingEmail ? 'Checking...' : 'Verify Email'}
                </button>
                
                <button
                  type="submit"
                  disabled={sendingReset || !emailVerified}
                  className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white ${emailVerified ? 'bg-[#292728] hover:bg-black' : 'bg-gray-400 cursor-not-allowed'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#292728] disabled:opacity-50 transition-colors`}
                >
                  {sendingReset ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>

              <div className="flex justify-between mt-5 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setForgotPassword(false);
                    setError('');
                    setEmailVerified(false);
                  }}
                  className="text-gray-600 hover:text-[#292728] transition-colors"
                >
                  ← Back to Login
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setForgotPassword(false);
                    setIsSignup(true);
                    setError('');
                    setEmailVerified(false);
                  }}
                  className="text-[#292728] font-medium hover:text-black transition-colors"
                >
                  Sign Up →
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {isSignup && (
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    required={isSignup}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="Enter your full name"
                    value={formData.full_name}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              {!isSignup && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPassword(true);
                      setError('');
                    }}
                    className="text-sm text-[#292728] hover:text-black transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {error && (
                <div className="text-red-500 text-sm text-center bg-red-50 p-2.5 rounded-xl">
                  {error}
                </div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#292728] hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#292728] disabled:opacity-50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? 'Processing...' : (isSignup ? 'Sign Up' : 'Login')}
              </motion.button>

              <div className="flex items-center my-4">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink px-3 text-xs text-gray-500">or</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(!isSignup);
                    setError('');
                    setFormData({
                      email: '',
                      password: '',
                      full_name: ''
                    });
                  }}
                  className="text-sm text-[#292728] hover:text-black font-medium transition-colors"
                >
                  {isSignup
                    ? 'Already have an account? Login'
                    : "Don't have an account? Sign Up"}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Login; 