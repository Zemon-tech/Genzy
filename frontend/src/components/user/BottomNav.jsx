import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';

// Custom BagWithHeart icon component
const BagWithHeart = ({ isActive, hasItems }) => (
  <div className="relative w-5 h-5">
    {/* Bag */}
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      className="w-5 h-5"
      strokeWidth={isActive ? "2.5" : "1.5"}
    >
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 01-8 0" />
      {/* Heart inside bag */}
      <path
        d="M12 14.5l-.5-.5c-1-1-1.5-1.5-1.5-2.1 0-.5.4-.9.9-.9.4 0 .7.2.9.4l.2.2.2-.2c.2-.2.5-.4.9-.4.5 0 .9.4.9.9 0 .6-.5 1.1-1.5 2.1l-.5.5z"
        fill={isActive ? "currentColor" : "none"}
        strokeWidth={isActive ? "0" : "1.5"}
      />
    </svg>
    {/* Item count badge */}
    {hasItems && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
        {hasItems}
      </span>
    )}
  </div>
);

const BottomNav = () => {
  const location = useLocation();
  const { cartItems } = useCart();
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white border-t border-gray-100 px-6 py-3 backdrop-blur-lg bg-white/80">
      <div className="flex justify-between items-center max-w-[380px] mx-auto">
        <Link 
          to="/" 
          className={`flex flex-col items-center ${
            isActive('/') 
              ? 'text-black' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Home className="w-5 h-5" strokeWidth={isActive('/') ? 2.5 : 1.5} />
          <span className="text-[10px] mt-1 font-medium">Home</span>
        </Link>
        
        <Link 
          to="/search" 
          className={`flex flex-col items-center ${
            isActive('/search') 
              ? 'text-black' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Search className="w-5 h-5" strokeWidth={isActive('/search') ? 2.5 : 1.5} />
          <span className="text-[10px] mt-1 font-medium">Search</span>
        </Link>
        
        <Link 
          to="/cart" 
          className={`flex flex-col items-center ${
            isActive('/cart') 
              ? 'text-black' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <BagWithHeart 
            isActive={isActive('/cart')} 
            hasItems={cartItems?.length}
          />
          <span className="text-[10px] mt-1 font-medium">Cart</span>
        </Link>
        
        <Link 
          to="/profile" 
          className={`flex flex-col items-center ${
            isActive('/profile') 
              ? 'text-black' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <User className="w-5 h-5" strokeWidth={isActive('/profile') ? 2.5 : 1.5} />
          <span className="text-[10px] mt-1 font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNav; 