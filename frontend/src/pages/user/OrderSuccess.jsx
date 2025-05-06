import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Check, Package, ShoppingCart, Clock, Receipt } from 'lucide-react';
import { Skeleton } from '../../components/ui/skeleton';

const OrderSuccess = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!orderId) {
      navigate('/');
      return;
    }
    
    fetchOrderDetails();
  }, [orderId, user, authLoading, navigate]);
  
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      
      // Directly query the orders table (now with fixed RLS policies)
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();
      
      if (orderError) {
        throw orderError;
      }
      
      setOrder(orderData);
      
      // Directly query the order_items table (with fixed RLS policies)
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*, product:product_id(*)')
        .eq('order_id', orderId);
      
      if (itemsError) {
        throw itemsError;
      }
      
      setOrderItems(itemsData || []);
      
    } catch (error) {
      console.error('Error fetching order details:', error);
      // If there's an error, navigate back to home
      navigate('/');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getEstimatedDeliveryDate = (createdAt, deliveryDate) => {
    if (!createdAt || !deliveryDate) return 'Not available';
    
    // Format the date as "Month Day, Year" (e.g., "May 28, 2023")
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(deliveryDate).toLocaleDateString(undefined, options);
  };
  
  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format transaction ID for display
  const formatTransactionId = (transactionId) => {
    if (!transactionId) return null;
    
    // Add spaces for better readability
    if (transactionId.startsWith('COD')) {
      return transactionId.replace(/(\w{3})(\d{10})(\d{4})/, '$1 $2 $3');
    }
    
    return transactionId;
  };
  
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-24 w-full mb-2" />
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-12 w-full mb-2" />
            <Skeleton className="h-12 w-full mb-2" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[480px] mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-medium">Order Confirmation</h1>
          </div>
        </div>
        
        {/* Success Message */}
        <div className="bg-green-50 p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-green-800 mb-2">Order Placed Successfully!</h2>
          <p className="text-green-700">
            Thank you for your order. We&apos;ll notify you once it ships.
          </p>
          {order.transaction_id && (
            <div className="mt-3 bg-white p-3 rounded-lg inline-flex items-center gap-2">
              <Receipt className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium">Transaction ID: {formatTransactionId(order.transaction_id)}</span>
            </div>
          )}
        </div>
        
        {/* Order Details */}
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-medium mb-4">Order Details</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID</span>
                <span className="font-medium">{order.id.substring(0, 8).toUpperCase()}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span>{formatDate(order.created_at)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`px-2 py-1 rounded-full ${getOrderStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method</span>
                <span>{order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method.toUpperCase()}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status</span>
                <span className={order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}>
                  {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                </span>
              </div>
              
              {/* Transaction ID (for both COD and online payments) */}
              {order.transaction_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {formatTransactionId(order.transaction_id)}
                  </span>
                </div>
              )}

              {order.estimated_delivery_date && (
                <div className="flex items-center gap-2 text-gray-700 bg-gray-50 p-3 rounded-lg mt-3">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-medium">Estimated Delivery</div>
                    <div className="text-sm">{getEstimatedDeliveryDate(order.created_at, order.estimated_delivery_date)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              <span>Order Items</span>
            </h2>
            
            <div className="space-y-4">
              {orderItems.map(item => (
                <div key={item.id} className="flex gap-3 pb-3 border-b last:border-b-0 last:pb-0">
                  {item.product?.images && item.product.images.length > 0 && (
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">{item.product?.name || 'Product'}</h3>
                    <div className="text-xs text-gray-500 mt-1 space-y-1">
                      <div className="flex gap-2">
                        <span>Size: {item.size || 'N/A'}</span>
                        <span>Color: {item.color || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Qty: {item.quantity}</span>
                        <span className="font-medium">₹{item.price_at_time * item.quantity}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getOrderStatusColor(item.item_status)}`}>
                        {item.item_status.charAt(0).toUpperCase() + item.item_status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Price Summary */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-medium mb-4">Price Summary</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              
              <div className="flex justify-between text-green-600">
                <span>Product Discount</span>
                <span>- ₹{order.discount_amount}</span>
              </div>
              
              {order.coupon_discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <div className="flex items-center gap-1">
                    <span>Coupon Discount</span>
                    {order.coupon_code && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                        {order.coupon_code}
                      </span>
                    )}
                  </div>
                  <span>- ₹{order.coupon_discount}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>₹{order.shipping_fee}</span>
              </div>
              
              <div className="border-t pt-3 flex justify-between font-bold">
                <span>Total Amount</span>
                <span>₹{order.total_amount}</span>
              </div>
            </div>
          </div>
          
          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-medium mb-4">Shipping Address</h2>
            <p className="text-sm">{order.shipping_address}</p>
          </div>
          
          <div className="pt-4 pb-8">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-black text-white py-4 rounded-lg hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Continue Shopping</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess; 