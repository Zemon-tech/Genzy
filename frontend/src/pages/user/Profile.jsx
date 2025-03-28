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
  User,
  MapPin,
  Settings,
  LogOut
} from 'lucide-react';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        } else {
          setUserProfile(profile);
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
      icon: User,
      label: 'Manage Account',
      onClick: () => navigate('/account')
    },
    {
      icon: MapPin,
      label: 'Manage Addresses',
      onClick: () => navigate('/address')
    },
    {
      icon: Settings,
      label: 'Settings',
      onClick: () => navigate('/settings')
    }
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Profile Header */}
        <div className="flex flex-col items-center pt-8 pb-6 px-4 border-b">
          {loading ? (
            <>
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="h-6 w-32 mt-4" />
              <Skeleton className="h-4 w-48 mt-2" />
            </>
          ) : (
            <>
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback>
                  {getInitials(userProfile?.full_name || user.email)}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-xl font-semibold">
                {userProfile?.full_name || 'User'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {userProfile?.phone_number || user.email}
              </p>
              {error && (
                <p className="text-sm text-red-500 mt-2">
                  Error loading profile: {error}
                </p>
              )}
            </>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="p-4 space-y-2">
          {loading ? (
            // Loading skeletons for sections
            Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))
          ) : (
            <>
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
                className="text-red-600 hover:bg-red-50"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 