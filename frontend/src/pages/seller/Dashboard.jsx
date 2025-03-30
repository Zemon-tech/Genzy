import { useState, useEffect } from 'react';
import supabase from '../../config/supabase';
import { useSellerAuth } from '../../context/SellerAuthContext';

const Dashboard = () => {
  const { seller } = useSellerAuth();
  const [productCount, setProductCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Sample data (in a real app, this would come from an API)
  const stats = [
    { label: 'Total Products', value: isLoading ? '...' : productCount.toString(), icon: '📦' },
    { label: 'Pending Orders', value: '12', icon: '🔄' },
    { label: 'Completed Orders', value: '48', icon: '✅' },
    { label: 'Total Revenue', value: '₹24,000', icon: '💰' },
  ];

  const recentOrders = [
    { id: 'ORD001', customer: 'John Doe', product: 'Blue T-Shirt', status: 'Pending' },
    { id: 'ORD002', customer: 'Jane Smith', product: 'Red Hoodie', status: 'Processing' },
    { id: 'ORD003', customer: 'Mike Johnson', product: 'Black Jeans', status: 'Shipped' },
  ];

  useEffect(() => {
    if (seller) {
      fetchProductCount();
    }
  }, [seller]);

  const fetchProductCount = async () => {
    try {
      setIsLoading(true);
      
      if (!seller || !seller.id) {
        console.error('No seller information available');
        setProductCount(0);
        setIsLoading(false);
        return;
      }
      
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', String(seller.id));

      if (error) {
        console.error('Error fetching product count:', error);
        throw error;
      }
      
      setProductCount(count || 0);
    } catch (error) {
      console.error('Error fetching product count:', error.message);
      setProductCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full p-8">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Welcome Back, Seller!</h1>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.product}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                          order.status === 'Processing' ? 'bg-blue-100 text-blue-800' : 
                          'bg-green-100 text-green-800'}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 