import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { 
  UsersIcon, 
  ShoppingBagIcon, 
  BuildingStorefrontIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { fetchAllUsers, fetchAllSellers, fetchAllProducts, fetchAllOrders } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    sellers: 0,
    products: 0,
    orders: 0,
    ordersByStatus: {}
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch all required data in parallel
        const [usersResult, sellersResult, productsResult, ordersResult] = await Promise.all([
          fetchAllUsers(),
          fetchAllSellers(),
          fetchAllProducts(),
          fetchAllOrders()
        ]);

        const ordersByStatus = {};
        if (ordersResult.success && ordersResult.data) {
          // Count orders by status
          ordersResult.data.forEach(order => {
            const status = order.status || 'unknown';
            ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
          });
        }

        setStats({
          users: usersResult.success ? usersResult.data?.length || 0 : 0,
          sellers: sellersResult.success ? sellersResult.data?.length || 0 : 0,
          products: productsResult.success ? productsResult.data?.length || 0 : 0,
          orders: ordersResult.success ? ordersResult.data?.length || 0 : 0,
          ordersByStatus
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [fetchAllUsers, fetchAllSellers, fetchAllProducts, fetchAllOrders]);

  // Array of stats cards to display
  const statCards = [
    {
      title: 'Total Users',
      value: stats.users,
      icon: UsersIcon,
      color: 'bg-blue-500',
      link: '/admin/users'
    },
    {
      title: 'Total Sellers',
      value: stats.sellers,
      icon: BuildingStorefrontIcon,
      color: 'bg-purple-500',
      link: '/admin/sellers'
    },
    {
      title: 'Total Products',
      value: stats.products,
      icon: ShoppingBagIcon,
      color: 'bg-green-500',
      link: '/admin/products'
    },
    {
      title: 'Total Orders',
      value: stats.orders,
      icon: ShoppingCartIcon,
      color: 'bg-orange-500',
      link: '/admin/orders'
    }
  ];

  // Status colors for order status badges
  const statusColors = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'processing': 'bg-blue-100 text-blue-800',
    'shipped': 'bg-purple-100 text-purple-800',
    'delivered': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800',
    'default': 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      {loading ? (
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <Link
                to={stat.link}
                key={stat.title}
                className="block transform rounded-lg bg-white p-6 shadow-md transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-semibold text-gray-700">{stat.title}</h2>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Orders by status */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">Orders by Status</h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                <div 
                  key={status}
                  className={`rounded-full px-4 py-1 ${statusColors[status] || statusColors.default}`}
                >
                  <span className="font-medium">{status}</span>: {count}
                </div>
              ))}
              {Object.keys(stats.ordersByStatus).length === 0 && (
                <p className="text-gray-500">No order data available</p>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Link 
                to="/admin/products" 
                className="rounded-md bg-blue-50 p-4 text-center text-blue-700 transition-colors hover:bg-blue-100"
              >
                <ShoppingBagIcon className="mx-auto mb-2 h-8 w-8" />
                <span className="font-medium">Manage Products</span>
              </Link>
              <Link 
                to="/admin/orders" 
                className="rounded-md bg-green-50 p-4 text-center text-green-700 transition-colors hover:bg-green-100"
              >
                <ShoppingCartIcon className="mx-auto mb-2 h-8 w-8" />
                <span className="font-medium">View Orders</span>
              </Link>
              <Link 
                to="/admin/featured-categories" 
                className="rounded-md bg-purple-50 p-4 text-center text-purple-700 transition-colors hover:bg-purple-100"
              >
                <ShoppingBagIcon className="mx-auto mb-2 h-8 w-8" />
                <span className="font-medium">Manage Categories</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard; 