import { useState, useEffect } from 'react';
import supabase from '../../config/supabase';
import { useSellerAuth } from '../../context/SellerAuthContext';
import toast from 'react-hot-toast';
import { Building2, Phone, MapPin, Mail, FileText, Users, ShoppingBag, TrendingUp, Clock } from 'lucide-react';

const Dashboard = () => {
  const { seller, updateSellerProfile } = useSellerAuth();
  const [productCount, setProductCount] = useState(0);
  const [pendingOrderCount, setPendingOrderCount] = useState(0);
  const [processingOrderCount, setProcessingOrderCount] = useState(0);
  const [completedOrderCount, setCompletedOrderCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  
  // State for editing profile
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    business_name: '',
    business_address: '',
    phone_number: '',
    gst_number: '',
  });

  // Update profile data when seller data changes
  useEffect(() => {
    if (seller) {
      setProfileData({
        business_name: seller.brand_name || '',
        business_address: seller.business_address || '',
        phone_number: seller.phone_number || '',
        gst_number: seller.gst_number || '',
      });
    }
  }, [seller]);

  useEffect(() => {
    if (seller) {
      fetchDashboardData();
    }
  }, [seller]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      if (!seller || !seller.id) {
        console.error('No seller information available');
        setIsLoading(false);
        return;
      }
      
      // Fetch product count
      fetchProductCount();
      
      // Fetch orders data
      await fetchOrdersData();
      
      // Fetch recent orders
      await fetchRecentOrders();
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductCount = async () => {
    try {
      if (!seller || !seller.id) {
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
    }
  };
  
  const fetchOrdersData = async () => {
    try {
      if (!seller || !seller.id) {
        return;
      }
      
      // Fetch pending orders count
      const { count: pendingCount, error: pendingError } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', String(seller.id))
        .eq('item_status', 'pending');
        
      if (pendingError) {
        console.error('Error fetching pending orders count:', pendingError);
        throw pendingError;
      }
      
      setPendingOrderCount(pendingCount || 0);
      
      // Fetch processing orders count
      const { count: processingCount, error: processingError } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', String(seller.id))
        .eq('item_status', 'processing');
        
      if (processingError) {
        console.error('Error fetching processing orders count:', processingError);
        throw processingError;
      }
      
      setProcessingOrderCount(processingCount || 0);
      
      // Fetch completed orders count
      const { count: completedCount, error: completedError } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', String(seller.id))
        .eq('item_status', 'delivered');
        
      if (completedError) {
        console.error('Error fetching completed orders count:', completedError);
        throw completedError;
      }
      
      setCompletedOrderCount(completedCount || 0);
      
      // Fetch total revenue from delivered orders
      const { data: revenueData, error: revenueError } = await supabase
        .from('order_items')
        .select('price_at_time, quantity')
        .eq('seller_id', String(seller.id))
        .eq('item_status', 'delivered');
        
      if (revenueError) {
        console.error('Error fetching revenue data:', revenueError);
        throw revenueError;
      }
      
      const revenue = revenueData?.reduce((total, item) => {
        return total + (item.price_at_time * item.quantity);
      }, 0) || 0;
      
      setTotalRevenue(revenue);
      
    } catch (error) {
      console.error('Error fetching orders data:', error.message);
    }
  };
  
  const fetchRecentOrders = async () => {
    try {
      if (!seller || !seller.id) {
        return;
      }
      
      // Get date from 10 days ago
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      const tenDaysAgoStr = tenDaysAgo.toISOString();
      
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          id,
          item_status,
          quantity,
          price_at_time,
          created_at,
          order:order_id(id, created_at, phone_number),
          product:product_id(name)
        `)
        .eq('seller_id', String(seller.id))
        .gte('created_at', tenDaysAgoStr)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) {
        console.error('Error fetching recent orders:', error);
        throw error;
      }
      
      setRecentOrders(data || []);
      
    } catch (error) {
      console.error('Error fetching recent orders:', error.message);
      setRecentOrders([]);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value
    });
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    
    try {
      setIsProfileLoading(true);
      
      const updateData = {
        // Do not include brand_name in the update data
        business_address: profileData.business_address,
        phone_number: profileData.phone_number,
        gst_number: profileData.gst_number
      };
      
      const result = await updateSellerProfile(updateData);
      
      if (result.success) {
        toast.success('Profile updated successfully');
        setIsEditing(false);
      } else {
        toast.error('Failed to update profile: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An error occurred while updating your profile');
    } finally {
      setIsProfileLoading(false);
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

  // Get stats dynamically
  const stats = [
    { 
      label: 'Total Products', 
      value: isLoading ? '...' : productCount.toString(), 
      icon: <ShoppingBag className="h-8 w-8 text-blue-500" />,
      color: 'bg-blue-50 border-blue-200'
    },
    { 
      label: 'Pending Orders', 
      value: isLoading ? '...' : pendingOrderCount.toString(), 
      icon: <Users className="h-8 w-8 text-amber-500" />,
      color: 'bg-amber-50 border-amber-200'
    },
    { 
      label: 'Processing Orders', 
      value: isLoading ? '...' : processingOrderCount.toString(), 
      icon: <Clock className="h-8 w-8 text-indigo-500" />,
      color: 'bg-indigo-50 border-indigo-200'
    },
    { 
      label: 'Completed Orders', 
      value: isLoading ? '...' : completedOrderCount.toString(), 
      icon: <TrendingUp className="h-8 w-8 text-green-500" />,
      color: 'bg-green-50 border-green-200'
    },
    { 
      label: 'Total Revenue', 
      value: isLoading ? '...' : formatCurrency(totalRevenue), 
      icon: <FileText className="h-8 w-8 text-purple-500" />,
      color: 'bg-purple-50 border-purple-200'
    },
  ];

  return (
    <div className="h-full w-full p-8">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome Back, {seller?.brand_name || 'Seller'}!
        </h1>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`p-6 rounded-lg shadow border ${stat.color} transition-all duration-200 hover:shadow-md`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className="bg-white p-3 rounded-full shadow-sm">
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Seller Profile Card */}
        <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Seller Profile</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
          
          <div className="p-6">
            {isEditing ? (
              <form onSubmit={handleSubmitProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Name
                    </label>
                    <input
                      type="text"
                      name="business_name"
                      value={profileData.business_name}
                      className="w-full px-4 py-2 border rounded-md bg-gray-100 cursor-not-allowed"
                      disabled
                      title="Business name cannot be changed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Business name cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GST Number
                    </label>
                    <input
                      type="text"
                      name="gst_number"
                      value={profileData.gst_number}
                      onChange={handleProfileChange}
                      placeholder="Enter GST Number"
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone_number"
                      value={profileData.phone_number}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Address
                    </label>
                    <textarea
                      name="business_address"
                      value={profileData.business_address}
                      onChange={handleProfileChange}
                      rows="2"
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your business address"
                    ></textarea>
                  </div>
                </div>
                
                <div className="flex space-x-4 pt-2">
                  <button
                    type="submit"
                    disabled={isProfileLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                  >
                    {isProfileLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <Building2 className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Business Name</p>
                    <p className="font-medium text-gray-900">{seller?.brand_name || 'Not set'}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">GST Number</p>
                    <p className="font-medium text-gray-900">{seller?.gst_number || 'Not set'}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Phone Number</p>
                    <p className="font-medium text-gray-900">{seller?.phone_number || 'Not set'}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Business Address</p>
                    <p className="font-medium text-gray-900">{seller?.business_address || 'Not set'}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Business Email</p>
                    <p className="font-medium text-gray-900">{seller?.business_email || 'Not set'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-teal-600 px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Recent Orders (Last 10 Days)</h2>
              <span className="px-3 py-1 bg-white text-green-600 rounded-full text-sm font-medium">
                {recentOrders.length} Orders
              </span>
            </div>
          </div>
          
          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">No orders in the last 10 days</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
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
                          #{order.order.id.substring(0, 8).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.product?.name || 'Unknown Product'} × {order.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.order.phone_number || 'Anonymous'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(order.price_at_time * order.quantity)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${order.item_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                              order.item_status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                              order.item_status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                              order.item_status === 'delivered' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'}`}>
                            {order.item_status.charAt(0).toUpperCase() + order.item_status.slice(1)}
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
    </div>
  );
};

export default Dashboard; 