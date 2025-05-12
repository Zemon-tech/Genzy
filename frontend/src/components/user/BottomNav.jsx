import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const BottomNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { cart } = useCart();
  
  const navItems = [
    {
      icon: Home,
      label: 'Home',
      path: '/'
    },
    {
      icon: Search,
      label: 'Discover',
      path: '/search'
    },
    {
      icon: ({ className }) => {
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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg py-2 px-6 z-50 max-w-[480px] mx-auto">
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