import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSellerAuth } from '../../context/SellerAuthContext';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { seller, logout } = useSellerAuth();
  
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