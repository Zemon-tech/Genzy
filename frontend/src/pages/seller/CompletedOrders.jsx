import { useState, useEffect } from 'react';
import { useSellerAuth } from '../../context/SellerAuthContext';
import { Skeleton } from '../../components/ui/skeleton';
import { Package, Download, Search, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const CompletedOrders = () => {
  const { seller, fetchSellerOrders } = useSellerAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);

  useEffect(() => {
    if (seller) {
      loadOrders();
    }
  }, [seller]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredOrders(orders);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = orders.filter(({ order, items }) => {
        // Search through order ID
        if (order.id.toLowerCase().includes(lowercasedSearch)) return true;
        
        // Search through shipping address
        if (order.shipping_address.toLowerCase().includes(lowercasedSearch)) return true;
        
        // Search through phone number
        if (order.phone_number?.toLowerCase().includes(lowercasedSearch)) return true;
        
        // Search through product names
        if (items.some(item => 
          item.product?.name?.toLowerCase().includes(lowercasedSearch)
        )) return true;
        
        return false;
      });
      setFilteredOrders(filtered);
    }
  }, [searchTerm, orders]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await fetchSellerOrders('delivered');
      
      // Group items by order ID
      const groupedOrders = data.reduce((acc, item) => {
        const orderId = item.order_id;
        if (!acc[orderId]) {
          acc[orderId] = {
            order: item.order,
            items: []
          };
        }
        acc[orderId].items.push(item);
        return acc;
      }, {});
      
      // Convert to array for easier rendering
      const ordersList = Object.values(groupedOrders);
      setOrders(ordersList);
      setFilteredOrders(ordersList);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load completed orders');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Helper function to truncate product names list
  const formatProductNames = (items) => {
    const names = items.map(item => item.product?.name || 'Unknown Product');
    if (names.length <= 2) {
      return names.join(', ');
    } else {
      return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
    }
  };

  // Helper to count total items in an order
  const countTotalItems = (items) => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Download orders as CSV
  const downloadAsCSV = () => {
    const headers = [
      'Order ID',
      'Date',
      'Products',
      'Quantity',
      'Amount',
      'Customer Address',
      'Phone Number',
      'Est. Delivery Date',
      'Actual Delivery Date',
      'Payment Method'
    ];

    const csvData = filteredOrders.map(({ order, items }) => {
      return [
        order.id,
        formatDate(order.created_at),
        items.map(item => `${item.product?.name} (${item.quantity})`).join('; '),
        countTotalItems(items),
        order.total_amount,
        order.shipping_address,
        order.phone_number || 'N/A',
        formatDate(order.estimated_delivery_date),
        formatDate(order.actual_delivery_date),
        order.payment_method
      ];
    });

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create a CSV Blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `completed-orders-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-screen overflow-y-auto flex-1 p-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Completed Orders</h1>
          <div className="flex space-x-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button 
              onClick={loadOrders}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
            >
              <span className="mr-2">🔄</span> Refresh
            </button>
            <button 
              onClick={downloadAsCSV}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Order count summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredOrders.length} completed orders
            {searchTerm && ` matching "${searchTerm}"`}
            {searchTerm && filteredOrders.length !== orders.length && 
              ` (filtered from ${orders.length} total)`
            }
          </p>
        </div>

        {/* Table display */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-xl font-medium text-gray-900">No completed orders</h3>
              <p className="mt-1 text-gray-500">
                {searchTerm 
                  ? "No orders match your search criteria. Try different keywords." 
                  : "Completed orders will appear here once customers receive their orders."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      S.No
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID / Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Products
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer Address
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivery Dates
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map(({ order, items }, index) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{order.id.substring(0, 8).toUpperCase()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(order.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatProductNames(items)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {countTotalItems(items)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(order.total_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {order.shipping_address}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.phone_number || 'No phone number'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-orange-500" />
                            <span className="text-gray-600">Est: </span>
                            <span className="ml-1">{formatDate(order.estimated_delivery_date)}</span>
                          </div>
                          <div className="flex items-center mt-1">
                            <Calendar className="h-3 w-3 mr-1 text-green-500" />
                            <span className="text-gray-600">Act: </span>
                            <span className="ml-1">{formatDate(order.actual_delivery_date)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompletedOrders; 