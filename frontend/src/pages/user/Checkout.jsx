import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../config/supabase';
import { ArrowLeft, CreditCard, Truck, Package, Tag, MapPin, Plus, Check, Clock, Calendar, X, AlertCircle, Info, ShieldCheck, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { Skeleton } from '../../components/ui/skeleton';
import PropTypes from 'prop-types';
import { scrollToTop } from '../../utils/helpers';

// Payment methods - simplified for now to focus on COD
const PAYMENT_METHODS = [
  { id: 'cod', name: 'Cash on Delivery', description: 'Pay when your order arrives', available: true },
  { id: 'online', name: 'Online Payment', description: 'Pay using UPI, cards & more (Coming soon)', available: false }
];

// Order confirmation modal
const OrderConfirmation = ({ isVisible, onConfirm, onCancel, orderDetails }) => {
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl animate-fade-in">
        <div className="flex items-center gap-3 text-indigo-600 mb-4">
          <Info className="w-6 h-6" />
          <h3 className="text-lg font-semibold">Confirm Your Order</h3>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-700">
            You&apos;re about to place an order with the following details:
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Items:</span>
              <span className="font-medium">{orderDetails.itemCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-medium">Cash on Delivery</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery Phone:</span>
              <span className="font-medium">{orderDetails.phoneNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-medium">₹{orderDetails.total}</span>
            </div>
            {orderDetails.couponCode && (
              <div className="flex justify-between text-green-600">
                <span>Applied Coupon:</span>
                <span>{orderDetails.couponCode}</span>
              </div>
            )}
          </div>
          
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-yellow-800 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>For Cash on Delivery orders, please ensure someone is available at the delivery address to receive and pay for the order.</p>
          </div>
        </div>
        
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Confirm Order</span>
          </button>
        </div>
      </div>
    </div>
  );
};

OrderConfirmation.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  orderDetails: PropTypes.shape({
    itemCount: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
    couponCode: PropTypes.string,
    phoneNumber: PropTypes.string.isRequired
  }).isRequired
};

const Checkout = () => {
  const navigate = useNavigate();
  const { 
    cart, 
    getPriceBreakdown, 
    clearCart, 
    getMaxDeliveryTime,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    couponError,
    couponLoading
  } = useCart();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [savedPhoneNumber, setSavedPhoneNumber] = useState('');
  const [useSavedPhone, setUseSavedPhone] = useState(true);
  const [shouldSavePhone, setShouldSavePhone] = useState(false);
  
  useEffect(() => {
    // Scroll to top when component mounts
    scrollToTop();
    
    if (!authLoading && cart.length === 0) {
      navigate('/cart');
    }
  }, [cart, authLoading, navigate]);
  
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchUserAddresses();
  }, [user, authLoading, navigate]);
  
  const fetchUserAddresses = async () => {
    try {
      setLoading(true);
      
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Record not found
          setAddresses([]);
        } else {
          throw error;
        }
      } else if (profileData) {
        // Format the address data
        const formattedAddress = formatAddress(profileData);
        if (formattedAddress) {
          setAddresses([{ 
            id: 'primary',
            address: formattedAddress,
            raw: profileData
          }]);
          setSelectedAddress('primary');
          
          // Set phone number state if available in profile
          if (profileData.phone_number) {
            setSavedPhoneNumber(profileData.phone_number);
            setPhoneNumber(profileData.phone_number);
            setUseSavedPhone(true);
          } else {
            setSavedPhoneNumber('');
            setUseSavedPhone(false);
          }
        } else {
          setAddresses([]);
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };
  
  // Format address from multiple fields into a single line
  const formatAddress = (profile) => {
    if (!profile.address) return null;
    
    const addressParts = [];
    
    // Add address line
    if (profile.address) addressParts.push(profile.address);
    
    // Add landmark if available
    if (profile.landmark) addressParts.push(profile.landmark);
    
    // Add city
    if (profile.city) addressParts.push(profile.city);
    
    // Add state
    if (profile.state) addressParts.push(profile.state);
    
    // Add pincode
    if (profile.pincode) addressParts.push(profile.pincode);
    
    return addressParts.length > 0 ? addressParts.join(', ') : null;
  };
  
  // Calculate the estimated delivery date
  const getEstimatedDeliveryDate = () => {
    const deliveryDays = getMaxDeliveryTime();
    
    if (!deliveryDays) return null;
    
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + deliveryDays);
    
    // Format the date as "Month Day, Year" (e.g., "May 28, 2023")
    return deliveryDate.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  const handleAddAddress = () => {
    navigate('/address');
  };
  
  // Handle coupon application
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setApplyingCoupon(true);
    try {
      const result = await applyCoupon(couponCode);
      if (result.success) {
        setCouponCode('');
        toast.success('Coupon applied successfully!');
      }
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Handle coupon removal
  const handleRemoveCoupon = () => {
    removeCoupon();
    toast.success('Coupon removed');
  };
  
  // Generate a transaction ID for COD orders
  const generateTransactionId = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `COD${timestamp}${random}`;
  };
  
  // Handle place order button click - show confirmation first
  const handlePlaceOrderClick = () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }
    
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    
    // Validate phone number
    const deliveryPhone = useSavedPhone ? savedPhoneNumber : phoneNumber;
    if (!deliveryPhone) {
      toast.error('Please provide a valid phone number for delivery');
      return;
    }
    
    if (!/^\d{10}$/.test(deliveryPhone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    
    // Show the confirmation modal
    setShowConfirmation(true);
  };
  
  // Handle phone number changes
  const handlePhoneNumberChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d{0,10}$/.test(value)) {
      setPhoneNumber(value);
    }
  };
  
  // Toggle between saved and custom phone number
  const toggleUseSavedPhone = () => {
    setUseSavedPhone(!useSavedPhone);
    if (!useSavedPhone) {
      // Switching to use saved phone
      setPhoneNumber(savedPhoneNumber);
    } else {
      // Switching to use custom phone
      if (phoneNumber === savedPhoneNumber) {
        // Clear the field only if it's currently set to the saved number
        setPhoneNumber('');
      }
    }
  };
  
  // Save phone number to profile if requested
  const savePhoneToProfile = async () => {
    if (!shouldSavePhone || !phoneNumber || phoneNumber === savedPhoneNumber) return;
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          phone_number: phoneNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Update local state
      setSavedPhoneNumber(phoneNumber);
      toast.success('Phone number saved to your profile');
      
    } catch (error) {
      console.error('Error saving phone number to profile:', error);
    }
  };
  
  // The actual order placement logic
  const placeOrder = async () => {
    try {
      setPlacingOrder(true);
      
      // Basic validation for phone number
      const deliveryPhone = useSavedPhone ? savedPhoneNumber : phoneNumber;
      if (!deliveryPhone) {
        throw new Error('Please provide a valid phone number for delivery');
      }
      
      if (deliveryPhone && !/^\d{10}$/.test(deliveryPhone)) {
        throw new Error('Please enter a valid 10-digit phone number');
      }
      
      const priceBreakdown = getPriceBreakdown();
      const selectedAddressData = addresses.find(addr => addr.id === selectedAddress);
      
      if (!selectedAddressData) {
        throw new Error('Selected address not found');
      }
      
      // Save phone to profile if requested (and different from saved)
      if (shouldSavePhone && phoneNumber && phoneNumber !== savedPhoneNumber) {
        await savePhoneToProfile();
      }
      
      // Generate transaction ID for COD
      const transactionId = generateTransactionId();
      
      // Use the updated place_complete_order function with SECURITY DEFINER
      const { data, error } = await supabase.rpc('place_complete_order', {
        p_user_id: user.id,
        p_total_amount: priceBreakdown.total,
        p_subtotal: priceBreakdown.subtotal,
        p_shipping_fee: priceBreakdown.shippingFee,
        p_discount_amount: priceBreakdown.savings,
        p_coupon_code: priceBreakdown.couponCode || null,
        p_coupon_discount: priceBreakdown.couponDiscount,
        p_shipping_address: selectedAddressData.address,
        p_phone_number: deliveryPhone,
        p_payment_method: 'cod',
        p_payment_status: 'pending',
        p_estimated_delivery_date: new Date(Date.now() + (priceBreakdown.maxDeliveryTime * 24 * 60 * 60 * 1000)).toISOString(),
        p_transaction_id: transactionId,
        p_cart_items: cart.map(item => ({
          product_id: item.id,
          seller_id: item.seller_id,
          quantity: item.quantity,
          price_at_time: item.selling_price,
          size: item.selectedSize || null,
          color: item.selectedColor || null,
          item_status: 'pending'
        }))
      });
      
      if (error) {
        throw error;
      }
      
      // If the order was created successfully, data should contain the order ID
      if (!data || !data.order_id) {
        throw new Error('Failed to create order: No order ID returned');
      }
      
      // If using coupons, update the usage count
      if (priceBreakdown.couponCode) {
        await supabase
          .rpc('increment_coupon_usage', { 
            coupon_code_param: priceBreakdown.couponCode 
          })
          .catch(err => {
            console.error('Error updating coupon usage:', err);
            // Non-critical error, don't throw
          });
      }
      
      // Clear cart after successful order
      await clearCart();
      
      // Navigate to success page
      navigate(`/order-success/${data.order_id}`);
      
    } catch (error) {
      console.error('Error placing order:', error);
      
      // Provide more specific error messages
      if (error.code === '23505') {
        toast.error('A duplicate order was detected. Please check your orders.');
      } else if (error.code === '23503') {
        toast.error('One or more products in your cart are no longer available.');
      } else if (error.message?.includes('network')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error(error.message || 'Failed to place order. Please try again later.');
      }
    } finally {
      setPlacingOrder(false);
      setShowConfirmation(false);
    }
  };
  
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <Skeleton className="h-10 w-full mb-6" />
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-10 w-full" />
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
              onClick={() => navigate('/cart')}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-medium">Checkout</h1>
          </div>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Delivery Address */}
          <div className="bg-white p-4 rounded-lg border space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Delivery Address
              </h2>
              
              <button 
                onClick={handleAddAddress}
                className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                {addresses.length === 0 ? 'Add' : 'Change'}
              </button>
            </div>
            
            {addresses.length === 0 ? (
              <div className="p-3 bg-gray-50 rounded-lg border-dashed border-2 border-gray-200 text-center">
                <button
                  onClick={handleAddAddress} 
                  className="text-sm inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
                >
                  <Plus className="w-4 h-4" />
                  Add a new address
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map(address => (
                  <div 
                    key={address.id}
                    className={`p-3 rounded-lg border ${
                      selectedAddress === address.id 
                        ? 'border-indigo-600 bg-indigo-50' 
                        : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedAddress(address.id)}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center ${
                        selectedAddress === address.id 
                          ? 'border-indigo-600' 
                          : 'border-gray-400'
                      }`}>
                        {selectedAddress === address.id && (
                          <div className="h-2 w-2 rounded-full bg-indigo-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{address.address}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Phone Number Section */}
          <div className="bg-white p-4 rounded-lg border space-y-3">
            <h2 className="text-base font-medium flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Contact Number
            </h2>
            
            <div className="space-y-3">
              {savedPhoneNumber ? (
                <>
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="useSavedPhone"
                      checked={useSavedPhone}
                      onChange={toggleUseSavedPhone}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="useSavedPhone" className="ml-2 text-sm text-gray-700">
                      Use saved phone number ({savedPhoneNumber})
                    </label>
                  </div>
                  
                  {!useSavedPhone && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Enter a different number for this delivery:</p>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={handlePhoneNumberChange}
                        placeholder="Enter 10-digit phone number"
                        maxLength={10}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">No saved phone number. Enter a number for this delivery:</p>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneNumberChange}
                    placeholder="Enter 10-digit phone number"
                    maxLength={10}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="savePhoneNumber"
                      checked={shouldSavePhone}
                      onChange={() => setShouldSavePhone(!shouldSavePhone)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="savePhoneNumber" className="ml-2 text-xs text-gray-700">
                      Save this phone number to my profile for future orders
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Coupon Code Section */}
          <div className="bg-white p-4 rounded-lg border space-y-3">
            <h2 className="text-base font-medium flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Apply Coupon
            </h2>
            
            {appliedCoupon ? (
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm font-medium">
                      {appliedCoupon.code}
                    </span>
                    <p className="text-xs text-gray-600 mt-1">
                      {appliedCoupon.discount_type === 'percentage' 
                        ? `${appliedCoupon.discount_value}% off` 
                        : `₹${appliedCoupon.discount_value} off`}
                      {appliedCoupon.brand_name && ` on ${appliedCoupon.brand_name} products`}
                    </p>
                  </div>
                  <button 
                    onClick={handleRemoveCoupon}
                    className="text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim() || couponLoading || applyingCoupon}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:bg-indigo-300"
                  >
                    {applyingCoupon ? (
                      <span className="inline-block h-4 w-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                    ) : (
                      'Apply'
                    )}
                  </button>
                </div>
                {couponError && (
                  <p className="text-red-500 text-xs mt-1">{couponError}</p>
                )}
              </>
            )}
          </div>
          
          {/* Delivery Time Estimation */}
          {getMaxDeliveryTime() > 0 && (
            <div className="bg-white p-4 rounded-lg border space-y-3">
              <h2 className="text-base font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Delivery Estimate
              </h2>
              
              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Expected delivery by</p>
                    <p className="text-lg font-bold text-indigo-700">{getEstimatedDeliveryDate()}</p>
                  </div>
                </div>
                <div className="bg-indigo-100 px-3 py-1 rounded-full text-xs font-medium text-indigo-800">
                  {getMaxDeliveryTime()} days
                </div>
              </div>
              
              <p className="text-xs text-gray-500 italic">
                * Delivery time is calculated based on the maximum estimated time across all products in your cart
              </p>
            </div>
          )}
          
          {/* Order Summary */}
          <div className="bg-white p-4 rounded-lg border space-y-3">
            <h2 className="text-base font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              Order Summary
            </h2>
            
            <div className="space-y-4">
              {cart.map(item => (
                <div key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-3">
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">{item.name}</h3>
                    <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      <span>₹{item.selling_price}</span>
                      <span>•</span>
                      <span>Qty: {item.quantity}</span>
                    </div>
                    <div className="text-sm text-gray-500 truncate mb-1">
                      Size: {item.selectedSize}
                      {item.selectedColor && (
                        <> • Color: {item.selectedColor}</>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Price Details */}
          <div className="bg-white p-4 rounded-lg border space-y-3">
            <h2 className="text-base font-medium">Price Details</h2>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Price ({cart.length} items)</span>
                <span>₹{getPriceBreakdown().mrpTotal}</span>
              </div>
              
              <div className="flex justify-between text-green-600">
                <span className="flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  <span>Product Discount</span>
                </span>
                <span>- ₹{getPriceBreakdown().savings}</span>
              </div>
              
              {getPriceBreakdown().couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    <span>Coupon Discount</span>
                  </span>
                  <span>- ₹{getPriceBreakdown().couponDiscount}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="flex items-center gap-1">
                  <Truck className="w-4 h-4" />
                  <span>Delivery Fee</span>
                </span>
                <span>₹{getPriceBreakdown().shippingFee}</span>
              </div>
              
              <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                <span>Total Amount</span>
                <span>₹{getPriceBreakdown().total}</span>
              </div>
            </div>
          </div>
          
          {/* Payment Methods */}
          <div className="bg-white p-4 rounded-lg border space-y-3">
            <h2 className="text-base font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payment Method
            </h2>
            
            <div className="space-y-3">
              {PAYMENT_METHODS.map(method => (
                <div 
                  key={method.id}
                  className={`p-3 rounded-lg border ${
                    paymentMethod === method.id && method.available
                      ? 'border-indigo-600 bg-indigo-50' 
                      : method.available 
                        ? 'border-gray-200'
                        : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                  onClick={() => {
                    if (method.available) {
                      setPaymentMethod(method.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center ${
                      paymentMethod === method.id && method.available
                        ? 'border-indigo-600' 
                        : 'border-gray-400'
                    }`}>
                      {paymentMethod === method.id && method.available && (
                        <div className="h-2 w-2 rounded-full bg-indigo-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{method.name}</p>
                        {!method.available && (
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">Coming Soon</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{method.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* COD Info */}
            {paymentMethod === 'cod' && (
              <div className="mt-2 bg-blue-50 p-3 rounded-lg text-blue-800 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">About Cash on Delivery</p>
                  <p>Please keep the exact amount ready at the time of delivery. Our delivery personnel may not have change available.</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Order Safety Information */}
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2 text-gray-700">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              <p className="text-sm">Your order is protected by our secure checkout process</p>
            </div>
          </div>
          
          {/* Place Order Button */}
          <button
            onClick={handlePlaceOrderClick}
            disabled={placingOrder || addresses.length === 0 || !PAYMENT_METHODS.find(m => m.id === paymentMethod)?.available}
            className="w-full bg-black text-white py-4 rounded-lg hover:bg-gray-900 transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2"
          >
            {placingOrder ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>Place Order</span>
              </>
            )}
          </button>
          
          {/* Terms and conditions */}
          <p className="text-center text-xs text-gray-500 mb-4">
            By placing your order, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
      
      {/* Order confirmation modal */}
      <OrderConfirmation 
        isVisible={showConfirmation}
        onConfirm={placeOrder}
        onCancel={() => setShowConfirmation(false)}
        orderDetails={{
          itemCount: cart.length,
          total: getPriceBreakdown().total,
          couponCode: getPriceBreakdown().couponCode,
          phoneNumber: useSavedPhone ? savedPhoneNumber : phoneNumber
        }}
      />
    </div>
  );
};

export default Checkout; 