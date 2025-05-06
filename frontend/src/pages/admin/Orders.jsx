import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { MagnifyingGlassIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const Orders = () => {
  const { fetchAllOrders } = useAdminAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const result = await fetchAllOrders();
      if (result.success) {
        setOrders(result.data || []);
      } else {
        console.error('Failed to fetch orders:', result.error);
        toast.error('Failed to load orders');
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  // Handle sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sorted and filtered orders
  const getSortedOrders = () => {
    const filteredOrders = orders.filter(order => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        (order.id?.toLowerCase().includes(searchLower) || '') ||
        (order.user_id?.toLowerCase().includes(searchLower) || '') ||
        (String(order.total_amount)?.includes(searchLower) || '')
      );
      
      // Apply status filter if set
      const matchesStatus = !filterStatus || order.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
    
    if (!sortConfig.key) return filteredOrders;
    
    return [...filteredOrders].sort((a, b) => {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Format date to a readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format price to currency
  const formatPrice = (price) => {
    if (price === undefined || price === null) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Toggle order details expansion
  const toggleOrderExpansion = (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
    }
  };

  // Get status badge color
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Extract unique statuses from orders
  const orderStatuses = [...new Set(orders.map(order => order.status))].filter(Boolean);

  // Get the sorted, filtered orders
  const sortedOrders = getSortedOrders();

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h1 className="text-2xl font-bold">Orders</h1>
        
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
          {/* Status filter */}
          <div className="relative rounded-md shadow-sm">
            <select
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {orderStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          
          {/* Search input */}
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="w-10 px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  
                </th>
                <th 
                  scope="col" 
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  onClick={() => requestSort('id')}
                >
                  ID
                  {sortConfig.key === 'id' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  scope="col" 
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  onClick={() => requestSort('created_at')}
                >
                  Date
                  {sortConfig.key === 'created_at' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  scope="col" 
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  onClick={() => requestSort('user_id')}
                >
                  Customer
                  {sortConfig.key === 'user_id' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  scope="col" 
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  onClick={() => requestSort('total_amount')}
                >
                  Total
                  {sortConfig.key === 'total_amount' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  scope="col" 
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  onClick={() => requestSort('status')}
                >
                  Status
                  {sortConfig.key === 'status' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  scope="col" 
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  onClick={() => requestSort('payment_status')}
                >
                  Payment
                  {sortConfig.key === 'payment_status' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sortedOrders.length > 0 ? (
                sortedOrders.map((order) => (
                  <>
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <button
                          onClick={() => toggleOrderExpansion(order.id)}
                          className="rounded p-1 hover:bg-gray-200"
                        >
                          {expandedOrderId === order.id ? (
                            <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                          )}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {order.id}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {order.user_id}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {formatPrice(order.total_amount)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                          {order.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          order.payment_status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.payment_status || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                    {expandedOrderId === order.id && (
                      <tr>
                        <td colSpan="7" className="px-6 py-4">
                          <div className="rounded-md bg-gray-50 p-4">
                            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div>
                                <h4 className="mb-2 text-sm font-medium text-gray-500">Shipping Address</h4>
                                <p className="text-sm">
                                  {order.shipping_address || 'No address provided'}
                                </p>
                              </div>
                              <div>
                                <h4 className="mb-2 text-sm font-medium text-gray-500">Payment Information</h4>
                                <p className="text-sm">
                                  <span className="font-medium">Method:</span> {order.payment_method || 'N/A'}<br />
                                  <span className="font-medium">Transaction ID:</span> {order.transaction_id || 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div>
                              <h4 className="mb-2 text-sm font-medium text-gray-500">Order Notes</h4>
                              <p className="text-sm text-gray-600">
                                {order.delivery_notes || 'No notes provided'}
                              </p>
                            </div>
                            {order.tracking_number && (
                              <div className="mt-2">
                                <span className="text-sm font-medium text-gray-500">Tracking Number:</span>
                                <span className="ml-2 text-sm text-gray-600">{order.tracking_number}</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm || filterStatus ? 'No orders match your filters.' : 'No orders found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        Total orders: {sortedOrders.length}
      </div>
    </div>
  );
};

export default Orders; 