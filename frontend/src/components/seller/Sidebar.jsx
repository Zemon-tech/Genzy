import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSellerAuth } from '../../context/SellerAuthContext';
import supabase from '../../config/supabase';
import toast from 'react-hot-toast';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { seller, logout } = useSellerAuth();
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);
  
  useEffect(() => {
    console.log('Current seller:', seller); // Debug log
  }, [seller]);

  const menuItems = [
    { path: '/seller/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/seller/products', label: 'Products', icon: '📦' },
    { path: '/seller/add-product', label: 'Add Product', icon: '➕' },
    { path: '/seller/orders', label: 'Orders to Dispatch', icon: '📦' },
    { path: '/seller/completed-orders', label: 'Completed Orders', icon: '✅' },
    { path: '/seller/size-chart', label: 'Size Chart', icon: '📏' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/seller/login');
  };

  const handleResetPassword = () => {
    setChangingPassword(true);
  };

  const handleCancelPasswordChange = () => {
    setChangingPassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdatePassword = async () => {
    try {
      // Validate input
      if (!passwordData.currentPassword) {
        toast.error('Please enter your current password');
        return;
      }
      
      if (!passwordData.newPassword) {
        toast.error('Please enter a new password');
        return;
      }
      
      if (passwordData.newPassword.length < 6) {
        toast.error('New password must be at least 6 characters');
        return;
      }
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }
      
      setUpdatingPassword(true);
      
      // First verify the current password is correct by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: seller.business_email,
        password: passwordData.currentPassword
      });
      
      if (signInError) {
        toast.error('Current password is incorrect');
        throw signInError;
      }
      
      // If current password is verified, update to the new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });
      
      if (updateError) {
        throw updateError;
      }
      
      // Reset state and show success message
      setChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      toast.success('Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="bg-gray-800 text-white w-64 h-full flex flex-col">
      <div className="p-4">
        <h2 className="text-2xl font-bold">{seller?.brand_name || 'Loading...'}</h2>
        <p className="text-sm text-gray-400 mt-1">Seller Dashboard</p>
      </div>
      <nav className="flex-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-6 py-3 text-lg ${
              isActive(item.path)
                ? 'bg-indigo-600'
                : 'hover:bg-gray-700'
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-gray-700">
        {changingPassword ? (
          <div className="p-4">
            <h3 className="text-lg font-medium mb-3">Change Password</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="currentPassword" className="block text-sm text-gray-300 mb-1">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="newPassword" className="block text-sm text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password" 
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
                />
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <button 
                  className="px-3 py-2 bg-indigo-600 rounded-md text-white hover:bg-indigo-700"
                  onClick={handleUpdatePassword}
                  disabled={updatingPassword}
                >
                  {updatingPassword ? 'Updating...' : 'Update Password'}
                </button>
                <button 
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white hover:bg-gray-600"
                  onClick={handleCancelPasswordChange}
                  disabled={updatingPassword}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={handleResetPassword}
            className="flex items-center px-6 py-3 text-lg text-blue-400 hover:bg-gray-700 w-full"
          >
            <span className="mr-3">🔒</span>
            Change Password
          </button>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center px-6 py-3 text-lg text-red-400 hover:bg-gray-700 w-full"
        >
          <span className="mr-3">🚪</span>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 