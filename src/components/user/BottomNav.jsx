import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HiHome, HiSearch, HiShoppingBag, HiUser } from 'react-icons/hi';

const BottomNav = () => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-between items-center max-w-md mx-auto">
        <Link to="/" className={`flex flex-col items-center ${isActive('/') ? 'text-blue-600' : 'text-gray-600'}`}>
          <HiHome className="w-6 h-6" />
          <span className="text-xs mt-1">Home</span>
        </Link>
        
        <Link to="/search" className={`flex flex-col items-center ${isActive('/search') ? 'text-blue-600' : 'text-gray-600'}`}>
          <HiSearch className="w-6 h-6" />
          <span className="text-xs mt-1">Search</span>
        </Link>
        
        <Link to="/cart" className={`flex flex-col items-center ${isActive('/cart') ? 'text-blue-600' : 'text-gray-600'}`}>
          <div className="relative">
            <HiShoppingBag className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              0
            </span>
          </div>
          <span className="text-xs mt-1">Cart</span>
        </Link>
        
        <Link to="/profile" className={`flex flex-col items-center ${isActive('/profile') ? 'text-blue-600' : 'text-gray-600'}`}>
          <HiUser className="w-6 h-6" />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNav; 