import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/seller/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/seller/products', label: 'Products', icon: '📦' },
    { path: '/seller/add-product', label: 'Add Product', icon: '➕' },
    { path: '/seller/orders', label: 'Orders to Dispatch', icon: '📦' },
    { path: '/seller/completed-orders', label: 'Completed Orders', icon: '✅' },
    { path: '/seller/size-chart', label: 'Size Chart', icon: '📏' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="bg-gray-800 text-white w-64 h-full flex flex-col">
      <div className="p-4">
        <h2 className="text-2xl font-bold">Seller Dashboard</h2>
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
          onClick={() => {
            localStorage.removeItem('sellerAuth');
            window.location.href = '/seller/login';
          }}
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