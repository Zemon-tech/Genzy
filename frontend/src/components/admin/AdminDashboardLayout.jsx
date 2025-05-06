import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, 
  UsersIcon, 
  ShoppingBagIcon, 
  BuildingStorefrontIcon,
  ShoppingCartIcon,
  PhotoIcon,
  TagIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { toast } from 'react-hot-toast';

const AdminDashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  if (!admin) {
    navigate('/admin/login');
    return null;
  }

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result.success) {
        toast.success('Logged out successfully');
        navigate('/admin/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Navigation items for the sidebar
  const navigationItems = [
    { name: 'Dashboard', to: '/admin/dashboard', icon: HomeIcon },
    { name: 'Users', to: '/admin/users', icon: UsersIcon },
    { name: 'Sellers', to: '/admin/sellers', icon: BuildingStorefrontIcon },
    { name: 'Products', to: '/admin/products', icon: ShoppingBagIcon },
    { name: 'Orders', to: '/admin/orders', icon: ShoppingCartIcon },
    { name: 'Featured Categories', to: '/admin/featured-categories', icon: TagIcon },
    { name: 'Havendrip Collection', to: '/admin/havendrip-collection', icon: PhotoIcon },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden" 
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-xl font-bold">Admin Panel</h2>
            <button 
              className="lg:hidden" 
              onClick={closeSidebar}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navigationItems.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) => 
                      `flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                        isActive 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                    onClick={closeSidebar}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Sidebar footer */}
          <div className="border-t p-4">
            <div className="mb-4 flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                {admin.full_name ? admin.full_name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{admin.full_name || 'Admin User'}</p>
                <p className="text-xs text-gray-500">{admin.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top navbar */}
        <header className="bg-white shadow">
          <div className="flex h-16 items-center justify-between px-4">
            <button
              className="lg:hidden"
              onClick={toggleSidebar}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="ml-4 lg:ml-0">
              <h1 className="text-xl font-semibold">Admin Panel</h1>
            </div>
            <div></div> {/* Spacer for layout balance */}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardLayout; 