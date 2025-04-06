import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../config/supabase';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { Skeleton } from '../../components/ui/skeleton';
import ProfileSection from '../../components/user/ProfileSection';
import {
  ShoppingBag,
  Heart,
  MapPin,
  LogOut,
  Phone,
  Edit
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [updatingPhone, setUpdatingPhone] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchUserProfile = async () => {
      try {
        if (!user) return;

        console.log('Current user ID:', user.id);

        // First try to fetch the existing profile
        const { data: profile, error: fetchError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching profile:', fetchError);
          setError('Failed to load profile. Please try again later.');
          return;
        }

        if (!profile) {
          // Profile doesn't exist, create one
          console.log('Creating new profile for user:', user.id);
          
          const { data: newProfile, error: insertError } = await supabase
            .from('user_profiles')
            .insert([{
              id: user.id,
              full_name: user.user_metadata?.full_name || '',
              phone_number: user.phone || '',
              address: '',
              landmark: '',
              city: '',
              state: '',
              pincode: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select('*')
            .maybeSingle();

          if (insertError) {
            console.error('Error creating profile:', insertError);
            setError('Failed to create profile. Please try again later.');
            return;
          }

          setUserProfile(newProfile);
          setPhoneNumber(newProfile.phone_number || '');
        } else {
          setUserProfile(profile);
          setPhoneNumber(profile.phone_number || '');
        }
      } catch (err) {
        console.error('Error in profile operation:', err);
        setError('An unexpected error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const handleEditPhone = () => {
    setEditingPhone(true);
  };

  const handleSavePhone = async () => {
    try {
      if (!user) return;
      
      setUpdatingPhone(true);
      
      // Basic validation
      if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
        toast.error('Please enter a valid 10-digit phone number');
        return;
      }
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          phone_number: phoneNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Update local state
      setUserProfile({
        ...userProfile,
        phone_number: phoneNumber
      });
      
      setEditingPhone(false);
      toast.success('Phone number updated successfully');
      
    } catch (error) {
      console.error('Error updating phone number:', error);
      toast.error('Failed to update phone number');
    } finally {
      setUpdatingPhone(false);
    }
  };

  const sections = [
    {
      icon: ShoppingBag,
      label: 'My Orders',
      onClick: () => navigate('/orders')
    },
    {
      icon: Heart,
      label: 'Wishlist',
      onClick: () => navigate('/wishlist')
    },
    {
      icon: MapPin,
      label: 'Manage Addresses',
      onClick: () => navigate('/address')
    }
  ];

  if (!user) return null;

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      <div className="max-w-[480px] mx-auto bg-white h-screen flex flex-col">
        {/* Profile Header */}
        <div className="flex items-center p-6 border-b">
          {loading ? (
            <div className="flex items-center w-full">
              <Skeleton className="h-16 w-16 rounded-full flex-shrink-0" />
              <div className="ml-4 flex-1">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ) : (
            <>
              <Avatar className="h-16 w-16 flex-shrink-0">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback>
                  {getInitials(userProfile?.full_name || user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="ml-4 flex-1">
                <h2 className="text-xl font-semibold">
                  {userProfile?.full_name || 'User'}
                </h2>
                <p className="text-sm text-gray-500">
                  {user.email}
                </p>
                {error && (
                  <p className="text-sm text-red-500 mt-1">
                    Error loading profile: {error}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Phone Number Section */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Phone className="w-5 h-5 text-gray-500 mr-2" />
              <span className="text-sm font-medium">Phone Number</span>
            </div>
            {!editingPhone && (
              <button 
                onClick={handleEditPhone}
                className="text-xs text-indigo-600 flex items-center"
                disabled={loading}
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </button>
            )}
          </div>
          
          {editingPhone ? (
            <div className="mt-2 flex items-center gap-2">
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number"
                maxLength={10}
                className="text-sm"
              />
              <Button 
                size="sm" 
                onClick={handleSavePhone}
                disabled={updatingPhone}
              >
                {updatingPhone ? 'Saving...' : 'Save'}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setEditingPhone(false);
                  setPhoneNumber(userProfile?.phone_number || '');
                }}
                disabled={updatingPhone}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <p className="mt-1 text-sm text-gray-600 ml-7">
              {userProfile?.phone_number ? userProfile.phone_number : 'No phone number added'}
            </p>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="p-6 flex-1">
          {loading ? (
            // Loading skeletons for sections in a grid
            <div className="grid grid-cols-2 gap-4">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {sections.map((section) => (
                <ProfileSection
                  key={section.label}
                  icon={section.icon}
                  label={section.label}
                  onClick={section.onClick}
                />
              ))}
              
              {/* Logout Section */}
              <ProfileSection
                icon={LogOut}
                label="Logout"
                onClick={handleLogout}
                className="text-red-600 hover:bg-red-50 border-red-100"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 