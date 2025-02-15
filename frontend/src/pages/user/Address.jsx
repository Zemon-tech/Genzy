import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../config/supabase';
import { ArrowLeft, Plus, MapPin, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form"
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Form validation schema
const formSchema = z.object({
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().length(6, "Pincode must be 6 digits"),
});

const Address = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  console.log('Address component render:', { user, authLoading, timestamp: new Date().toISOString() });

  // Initialize form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }

    fetchAddresses(user.id);
  }, [user, authLoading, navigate]);

  const fetchAddresses = async (userId) => {
    try {
      setLoading(true);
      if (!userId) return;

      console.log('Fetching addresses for user:', userId);
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setAddresses([]);
        } else {
          throw error;
        }
      } else if (profileData?.address) {
        setAddresses([profileData.address]);
      } else {
        setAddresses([]);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to load address');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (address) => {
    // Parse the existing address string
    const [streetAddress, city, stateAndPin] = address.split(', ');
    const [state, pincode] = stateAndPin.split(' - ');

    // Set form values
    form.reset({
      address: streetAddress,
      city,
      state,
      pincode,
    });

    setIsEditing(true);
    setShowForm(true);
  };

  const onSubmit = async (values) => {
    try {
      if (!user) {
        throw new Error('No active session. Please login again.');
      }

      const formattedAddress = `${values.address}, ${values.city}, ${values.state} - ${values.pincode}`;
      console.log('Updating address for user:', user.id);
      console.log('New address:', formattedAddress);

      // First get the existing profile
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Prepare update data
      const updateData = {
        id: user.id,
        address: formattedAddress,
        updated_at: new Date().toISOString(),
        full_name: existingProfile?.full_name || user.user_metadata?.full_name || 'User',
        // Add any other required fields with their existing values
        created_at: existingProfile?.created_at || new Date().toISOString(),
        phone_number: existingProfile?.phone_number || null
      };

      // Perform the upsert
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(updateData)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Update failed - no data returned');

      console.log('Update successful:', data);
      setAddresses([formattedAddress]);
      toast.success(isEditing ? 'Address updated successfully' : 'Address added successfully');
      setShowForm(false);
      setIsEditing(false);
      form.reset();

      await fetchAddresses(user.id);
    } catch (error) {
      console.error('Error in onSubmit:', error);
      toast.error(`Failed to update address: ${error.message}`);
      if (error.message.includes('session')) {
        navigate('/login');
      }
    }
  };

  // Show loading state while auth is being checked
  if (authLoading) {
    return <div className="p-4">Checking authentication...</div>;
  }

  // Show loading state while addresses are being fetched
  if (loading) {
    return <div className="p-4">Loading addresses...</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold">Manage Addresses</h1>
      </div>

      {/* Add/Edit Address Button */}
      {!showForm && (
        <Button
          onClick={() => {
            setShowForm(true);
            setIsEditing(false);
            form.reset(); // Reset form when adding new address
          }}
          className="w-full mb-4 flex items-center gap-2 justify-center"
          variant="outline"
        >
          <Plus className="w-4 h-4" />
          Add New Address
        </Button>
      )}

      {/* Address Form */}
      {showForm && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mb-6 p-4 border rounded-lg">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="house/flat no, building name, street, area" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="enter city name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input placeholder="enter state name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pincode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pincode</FormLabel>
                  <FormControl>
                    <Input placeholder="enter pincode" maxLength={6} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {isEditing ? 'Update Address' : 'Save Address'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowForm(false);
                  setIsEditing(false);
                  form.reset();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      )}

      {/* Existing Addresses */}
      <div className="space-y-4">
        {addresses.map((address, index) => (
          <div key={index} className="p-4 border rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 mt-1 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm">{address}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(address)}
                className="shrink-0"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Address; 