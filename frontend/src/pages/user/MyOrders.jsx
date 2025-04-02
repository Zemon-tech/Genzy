import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../config/supabase';
import { Skeleton } from '../../components/ui/skeleton';
import { ArrowLeft, Package, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const MyOrders = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchOrders();
  }, [user, authLoading, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items:order_items(*, product:product_id(*))
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusColor = (status) => {
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

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white p-4 mb-4 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <Skeleton className="h-7 w-7 rounded-full mr-2" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
          
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-4 mb-4 rounded-lg shadow">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48 mb-4" />
              <div className="flex gap-3">
                <Skeleton className="h-16 w-16 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/profile')}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-medium">My Orders</h1>
          </div>
        </div>
        
        {/* Orders List */}
        <div className="p-4">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-500 mb-6">Looks like you haven't placed any orders yet.</p>
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <Link 
                  key={order.id} 
                  to={`/order-success/${order.id}`}
                  className="block bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium">Order #{order.id.substring(0, 8).toUpperCase()}</h3>
                      <p className="text-sm text-gray-500">Placed on {formatDate(order.created_at)}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  
                  {/* Order Summary - Show first 2 items */}
                  <div className="space-y-3">
                    {order.order_items && order.order_items.slice(0, 2).map(item => (
                      <div key={item.id} className="flex gap-3">
                        {item.product?.images && item.product.images.length > 0 && (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded-md"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium line-clamp-1">{item.product?.name || 'Product'}</p>
                          <p className="text-xs text-gray-500">
                            Size: {item.size || 'N/A'} • Color: {item.color || 'N/A'} • Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Show count of remaining items if more than 2 */}
                    {order.order_items && order.order_items.length > 2 && (
                      <p className="text-xs text-gray-500">
                        +{order.order_items.length - 2} more item(s)
                      </p>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center mt-3 pt-3 border-t">
                    <div className="font-medium">Total: ₹{order.total_amount}</div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyOrders; 