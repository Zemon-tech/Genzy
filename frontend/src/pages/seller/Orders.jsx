import { useState, useEffect } from 'react';
import { useSellerAuth } from '../../context/SellerAuthContext';
import { Skeleton } from '../../components/ui/skeleton';
import { Package, Truck, Check, X, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const OrderStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

const Orders = () => {
  const { seller, fetchSellerOrders, updateOrderItemStatus } = useSellerAuth();
  const [activeTab, setActiveTab] = useState(OrderStatus.PENDING);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [showTrackingInput, setShowTrackingInput] = useState(null);

  useEffect(() => {
    if (seller) {
      loadOrders();
    }
  }, [seller, activeTab]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await fetchSellerOrders(activeTab);
      
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
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderItemId, newStatus) => {
    try {
      setUpdatingOrderId(orderItemId);
      
      // If shipping, we need a tracking number
      if (newStatus === OrderStatus.SHIPPED && !trackingNumber && !showTrackingInput) {
        setShowTrackingInput(orderItemId);
        return;
      }
      
      // Process the status update
      await updateOrderItemStatus(
        orderItemId, 
        newStatus, 
        newStatus === OrderStatus.SHIPPED ? trackingNumber : null
      );
      
      // Reset tracking input if we used it
      if (newStatus === OrderStatus.SHIPPED) {
        setTrackingNumber("");
        setShowTrackingInput(null);
      }
      
      toast.success(`Order status updated to ${newStatus}`);
      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.PROCESSING:
        return 'bg-blue-100 text-blue-800';
      case OrderStatus.SHIPPED:
        return 'bg-indigo-100 text-indigo-800';
      case OrderStatus.DELIVERED:
        return 'bg-green-100 text-green-800';
      case OrderStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case OrderStatus.PENDING:
        return OrderStatus.PROCESSING;
      case OrderStatus.PROCESSING:
        return OrderStatus.SHIPPED;
      case OrderStatus.SHIPPED:
        return OrderStatus.DELIVERED;
      default:
        return null;
    }
  };

  const getStatusActions = (item) => {
    const nextStatus = getNextStatus(item.item_status);
    
    // If status is already delivered or cancelled, no action needed
    if (item.item_status === OrderStatus.DELIVERED || item.item_status === OrderStatus.CANCELLED) {
      return null;
    }

    return (
      <div className="flex gap-2 mt-2">
        {nextStatus && (
          <>
            {showTrackingInput === item.id && nextStatus === OrderStatus.SHIPPED ? (
              <div className="flex items-center gap-2 w-full">
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  className="flex-1 px-3 py-1 text-sm border rounded"
                />
                <button
                  onClick={() => handleUpdateStatus(item.id, nextStatus)}
                  disabled={!trackingNumber}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded disabled:bg-gray-400"
                >
                  Submit
                </button>
                <button
                  onClick={() => setShowTrackingInput(null)}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleUpdateStatus(item.id, nextStatus)}
                disabled={updatingOrderId === item.id}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors inline-flex items-center gap-1"
              >
                {nextStatus === OrderStatus.PROCESSING && <RefreshCw className="w-3 h-3" />}
                {nextStatus === OrderStatus.SHIPPED && <Truck className="w-3 h-3" />}
                {nextStatus === OrderStatus.DELIVERED && <Check className="w-3 h-3" />}
                {updatingOrderId === item.id ? 'Updating...' : `Mark as ${nextStatus}`}
              </button>
            )}
          </>
        )}
        
        {item.item_status !== OrderStatus.CANCELLED && (
          <button
            onClick={() => handleUpdateStatus(item.id, OrderStatus.CANCELLED)}
            disabled={updatingOrderId === item.id}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors inline-flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Cancel
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen overflow-y-auto flex-1 p-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Orders</h1>
          <button 
            onClick={loadOrders}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
          >
            <span className="mr-2">🔄</span> Refresh
          </button>
        </div>

        {/* Custom tabs implementation */}
        <div className="mb-6">
          <div className="flex border-b">
            {Object.values(OrderStatus).map(status => (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                  activeTab === status
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div>
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white p-4 rounded-lg shadow">
                  <Skeleton className="h-8 w-64 mb-4" />
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <Skeleton className="h-20 w-20 rounded" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-xl font-medium text-gray-900">No {activeTab} orders</h3>
              <p className="mt-1 text-gray-500">When customers place orders with your products, they will appear here.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map(({ order, items }) => (
                <div key={order.id} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-lg font-semibold">Order #{order.id.substring(0, 8).toUpperCase()}</h2>
                      <p className="text-sm text-gray-500">
                        Placed on {formatDate(order.created_at)}
                      </p>
                    </div>
                    {order.tracking_number && (
                      <div className="text-sm">
                        <span className="font-medium">Tracking:</span> {order.tracking_number}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {items.map(item => (
                      <div key={item.id} className="flex gap-4 border-t pt-4 first:border-t-0 first:pt-0">
                        {item.product?.images && item.product.images.length > 0 && (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-20 h-20 object-cover rounded-md"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h3 className="font-medium">{item.product?.name || 'Product'}</h3>
                            <span className="font-medium">₹{item.price_at_time * item.quantity}</span>
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            <span>Size: {item.size || 'N/A'}</span>
                            <span className="mx-2">•</span>
                            <span>Color: {item.color || 'N/A'}</span>
                            <span className="mx-2">•</span>
                            <span>Qty: {item.quantity}</span>
                          </div>
                          <div className="mt-2 flex justify-between items-center">
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(item.item_status)}`}>
                              {item.item_status.charAt(0).toUpperCase() + item.item_status.slice(1)}
                            </span>
                            {getStatusActions(item)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t text-sm">
                    <div className="font-medium">Shipping Address:</div>
                    <p className="text-gray-600">{order.shipping_address}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders; 