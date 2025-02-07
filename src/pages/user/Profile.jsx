import React from 'react';
import { Navigate } from 'react-router-dom';
import { HiOutlineUser, HiOutlineShoppingBag, HiOutlineHeart, HiOutlineLocationMarker, HiOutlineCog, HiOutlineLogout } from 'react-icons/hi';

const Profile = () => {
  // Mock authentication state - in real app, this would come from an auth context
  const isAuthenticated = false;
  const user = {
    name: 'John Doe',
    email: 'john@example.com',
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

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
      <div className="bg-white p-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <HiOutlineUser className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h2 className="font-bold text-lg">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
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

      {/* Logout Button */}
      <div className="p-4">
        <button className="flex items-center gap-2 text-red-500 mx-auto">
          <HiOutlineLogout className="w-6 h-6" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Profile; 