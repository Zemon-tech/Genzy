import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineUser, HiOutlineShoppingBag, HiOutlineHeart, HiOutlineLocationMarker, HiOutlineCog, HiOutlineLogout } from 'react-icons/hi';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    {
      icon: <HiOutlineShoppingBag className="w-6 h-6" />,
      label: 'My Orders',
      link: '/orders',
    },
    {
      icon: <HiOutlineHeart className="w-6 h-6" />,
      label: 'Wishlist',
      link: '/wishlist',
    },
    {
      icon: <HiOutlineLocationMarker className="w-6 h-6" />,
      label: 'Addresses',
      link: '/addresses',
    },
    {
      icon: <HiOutlineCog className="w-6 h-6" />,
      label: 'Settings',
      link: '/settings',
    },
  ];

  return (
    <div className="pb-16 bg-gray-50 min-h-screen">
      {/* Profile Header */}
      <div className="relative">
        <div 
          className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm cursor-pointer"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{user.avatar}</span>
            <div>
              <h2 className="font-semibold">{user.name}</h2>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>
          <span className="text-gray-400">▼</span>
        </div>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg overflow-hidden z-10">
            <div 
              className="p-3 hover:bg-gray-50 cursor-pointer flex items-center space-x-2"
              onClick={() => {
                setShowDropdown(false);
                navigate('/profile/edit');
              }}
            >
              <span>👤</span>
              <span>Edit Profile</span>
            </div>
            <div 
              className="p-3 hover:bg-gray-50 cursor-pointer flex items-center space-x-2 text-red-500"
              onClick={handleLogout}
            >
              <span>🚪</span>
              <span>Logout</span>
            </div>
          </div>
        )}
      </div>

      {/* Profile Content */}
      <div className="mt-6 space-y-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-semibold mb-2">My Orders</h3>
          <p className="text-gray-600 text-sm">No orders yet</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-semibold mb-2">Saved Addresses</h3>
          <p className="text-gray-600 text-sm">No addresses saved</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-semibold mb-2">Settings</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Notifications</p>
            <p className="text-sm text-gray-600">Language</p>
            <p className="text-sm text-gray-600">Theme</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="bg-white">
        {menuItems.map((item, index) => (
          <div
            key={item.label}
            className={`flex items-center gap-4 p-4 ${
              index !== menuItems.length - 1 ? 'border-b' : ''
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Profile; 