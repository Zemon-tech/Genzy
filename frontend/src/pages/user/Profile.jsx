import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { HiOutlineUser, HiOutlineShoppingBag, HiOutlineHeart, HiOutlineLocationMarker, HiOutlineCog, HiOutlineLogout } from 'react-icons/hi';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    checkUser();
    // Add listener for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/login');
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [navigate]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Fetch user profile
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        setProfile(profile);
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  const menuItems = [
    {
      icon: <HiOutlineShoppingBag className="w-6 h-6" />,
      label: 'My Orders',
      link: '/orders',
    },
    {
      icon: <HiOutlineHeart className="w-6 h-6" />,
      label: 'Wishlist',
      link: '/wishlist',
    },
    {
      icon: <HiOutlineLocationMarker className="w-6 h-6" />,
      label: 'Addresses',
      link: '/addresses',
    },
    {
      icon: <HiOutlineCog className="w-6 h-6" />,
      label: 'Settings',
      link: '/settings',
    },
  ];

  return (
    <div className="pb-16 bg-gray-50 min-h-screen">
      {/* Profile Header */}
      <div className="relative">
        <div 
          className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm cursor-pointer"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{user?.avatar}</span>
            <div>
              <h2 className="font-semibold">{user?.name}</h2>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
          </div>
          <span className="text-gray-400">▼</span>
        </div>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg overflow-hidden z-10">
            <div 
              className="p-3 hover:bg-gray-50 cursor-pointer flex items-center space-x-2"
              onClick={() => {
                setShowDropdown(false);
                navigate('/profile/edit');
              }}
            >
              <span>👤</span>
              <span>Edit Profile</span>
            </div>
            <div 
              className="p-3 hover:bg-gray-50 cursor-pointer flex items-center space-x-2 text-red-500"
              onClick={handleLogout}
            >
              <span>🚪</span>
              <span>Logout</span>
            </div>
          </div>
        )}
      </div>

      {/* Profile Content */}
      <div className="mt-6 space-y-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-semibold mb-2">My Orders</h3>
          <p className="text-gray-600 text-sm">No orders yet</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-semibold mb-2">Saved Addresses</h3>
          <p className="text-gray-600 text-sm">No addresses saved</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-semibold mb-2">Settings</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Notifications</p>
            <p className="text-sm text-gray-600">Language</p>
            <p className="text-sm text-gray-600">Theme</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="bg-white">
        {menuItems.map((item, index) => (
          <div
            key={item.label}
            className={`flex items-center gap-4 p-4 ${
              index !== menuItems.length - 1 ? 'border-b' : ''
            }`}
            onClick={() => navigate(item.link)}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Profile; 