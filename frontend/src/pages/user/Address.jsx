import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../config/supabase';
import { ArrowLeft, Plus, MapPin, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Address = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    is_default: false
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    if (user) {
      setAuthChecking(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Current session:', session);
      console.log('Current user:', user);
      if (error) console.error('Auth error:', error);
    };
    
    checkAuth();
  }, []);

  const fetchAddresses = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching addresses:', error);
        toast.error('Failed to load addresses');
        return;
      }

      setAddresses(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) {
        toast.error('Please login to add an address');
        return;
      }

      // Create the address object exactly matching the database schema
      const newAddress = {
        user_id: user.id,
        full_name: formData.full_name,
        phone: formData.phone,
        address_line1: formData.address_line1,
        address_line2: formData.address_line2 || null, // Handle optional field
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        is_default: formData.is_default
      };

      // First, if this is a default address, update existing default
      if (newAddress.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('is_default', true);
      }

      // Then insert the new address
      const { data, error } = await supabase
        .from('addresses')
        .insert([newAddress])
        .select()
        .single();

      if (error) {
        console.error('Error details:', error);
        toast.error(error.message || 'Failed to add address');
        return;
      }

      setAddresses(prev => [data, ...prev]);
      setShowForm(false);
      setFormData({
        full_name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        pincode: '',
        is_default: false
      });
      toast.success('Address added successfully');
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAddresses(prev => prev.filter(addr => addr.id !== id));
      toast.success('Address deleted successfully');
    } catch (error) {
      toast.error('Error deleting address');
      console.error(error);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[480px] mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b">
          <div className="flex items-center h-14 px-4">
            <button 
              onClick={() => navigate(-1)}
              className="mr-4"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold">Manage Addresses</h1>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-4">
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-gray-200 rounded-lg"></div>
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        )}

        {!loading && (
          <div className="p-4">
            {/* Add New Address Button */}
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center gap-2 text-gray-600 hover:border-gray-400 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add New Address
              </button>
            )}

            {/* Address Form */}
            {showForm && (
              <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Address Line 1"
                    value={formData.address_line1}
                    onChange={(e) => setFormData(prev => ({ ...prev, address_line1: e.target.value }))}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Address Line 2 (Optional)"
                    value={formData.address_line2}
                    onChange={(e) => setFormData(prev => ({ ...prev, address_line2: e.target.value }))}
                    className="w-full p-3 border rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full p-3 border rounded-lg"
                      required
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full p-3 border rounded-lg"
                      required
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Pincode"
                    value={formData.pincode}
                    onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    <span className="text-sm text-gray-600">Set as default address</span>
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-3 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            )}

            {/* Address List */}
            <div className="space-y-4 mt-6">
              {addresses.map((address) => (
                <div 
                  key={address.id} 
                  className="p-4 border rounded-lg relative"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium">{address.full_name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {address.address_line1}
                          {address.address_line2 && `, ${address.address_line2}`}
                        </div>
                        <div className="text-sm text-gray-600">
                          {address.city}, {address.state} - {address.pincode}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Phone: {address.phone}
                        </div>
                        {address.is_default && (
                          <span className="inline-block mt-2 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                            Default Address
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(address.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Address; 