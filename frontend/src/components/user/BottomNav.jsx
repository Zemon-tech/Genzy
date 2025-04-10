import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingBag, User } from 'lucide-react';
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
  const currentPath = location.pathname;
  const { cart, wishlist } = useCart();
  
  const navItems = [
    {
      icon: Home,
      label: 'Home',
      path: '/'
    },
    {
      icon: Search,
      label: 'Search',
      path: '/search'
    },
    {
      icon: ({ className }) => {
        const isActive = currentPath === '/cart';
        const cartCount = cart.length;
        return (
          <div className="relative">
            <ShoppingBag className={className} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
        );
      },
      label: 'Cart',
      path: '/cart'
    },
    {
      icon: User,
      label: 'Profile',
      path: '/profile'
    }
  ];

  return (
    <div className="bg-white border-t shadow-lg py-2 px-6">
      <div className="flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center"
            >
              <div 
                className={`p-2 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-customBlack text-white scale-110' 
                    : 'text-gray-500 hover:text-customBlack hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span 
                className={`text-xs mt-1 font-medium ${
                  isActive ? 'text-customBlack' : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav; 