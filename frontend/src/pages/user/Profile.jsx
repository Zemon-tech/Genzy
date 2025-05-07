import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../config/supabase';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { Skeleton } from '../../components/ui/skeleton';
import {
  ShoppingBag,
  Heart,
  MapPin,
  LogOut,
  Phone,
  Edit,
  Download,
  KeyIcon,
  Mail,
  User,
  AlertCircle
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [updatingPhone, setUpdatingPhone] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [fullName, setFullName] = useState('');
  const [updatingName, setUpdatingName] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // PWA installation detection
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the default browser install prompt
      e.preventDefault();
      // Save the event for later use
      setDeferredPrompt(e);
      // Update UI to show the install button
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Handle app installation
  const handleInstallClick = () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsInstallable(false);
      } else {
        console.log('User dismissed the install prompt');
      }
      // Clear the saved prompt
      setDeferredPrompt(null);
    });
  };

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
          setFullName(newProfile.full_name || '');
        } else {
          setUserProfile(profile);
          setPhoneNumber(profile.phone_number || '');
          setFullName(profile.full_name || '');
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

  const handleResetPassword = () => {
    setChangingPassword(true);
  };

  const handleCancelPasswordChange = () => {
    setChangingPassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdatePassword = async () => {
    try {
      // Validate input
      if (!passwordData.currentPassword) {
        toast.error('Please enter your current password');
        return;
      }
      
      if (!passwordData.newPassword) {
        toast.error('Please enter a new password');
        return;
      }
      
      if (passwordData.newPassword.length < 6) {
        toast.error('New password must be at least 6 characters');
        return;
      }
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }
      
      setUpdatingPassword(true);
      
      // First verify the current password is correct by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword
      });
      
      if (signInError) {
        toast.error('Current password is incorrect');
        throw signInError;
      }
      
      // If current password is verified, update to the new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });
      
      if (updateError) {
        throw updateError;
      }
      
      // Reset state and show success message
      setChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      toast.success('Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
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

  const handleEditName = () => {
    setEditingName(true);
  };

  const handleSaveName = async () => {
    try {
      if (!user) return;
      
      setUpdatingName(true);
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          full_name: fullName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Update local state
      setUserProfile({
        ...userProfile,
        full_name: fullName
      });
      
      setEditingName(false);
      toast.success('Name updated successfully');
      
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error('Failed to update name');
    } finally {
      setUpdatingName(false);
    }
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

  // Create sections array including PWA install option if available
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

  // Add install app section if PWA is installable
  if (isInstallable) {
    sections.push({
      icon: Download,
      label: 'Install App',
      onClick: handleInstallClick,
      className: "text-green-600 hover:bg-green-50 border-green-100"
    });
  }
  
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-[480px] mx-auto min-h-screen">
        {/* Brand Header with Dark Background */}
        <div className="bg-[#292728] px-4 pt-3 pb-6 text-center">
          <img 
            src="/photologo.svg" 
            alt="Brand Logo" 
            className="h-14 mx-auto object-contain drop-shadow-lg"
          />
        </div>

        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="relative px-6 py-8 -mt-4 rounded-t-3xl bg-white shadow-lg min-h-[calc(100vh-100px)]"
        >
          {/* Profile Header */}
          <motion.div
            variants={fadeIn}
            className="flex items-center mb-6"
          >
            {loading ? (
              <div className="flex items-center w-full">
                <Skeleton className="h-20 w-20 rounded-full flex-shrink-0" />
                <div className="ml-4 flex-1">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ) : (
              <>
                <Avatar className="h-20 w-20 flex-shrink-0 border-4 border-white shadow-lg">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-[#292728] text-white text-xl">
                    {getInitials(userProfile?.full_name || user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[#292728]">
                      {userProfile?.full_name || 'User'}
                    </h2>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Mail className="w-3 h-3 mr-1" />
                    {user.email}
                  </div>
                  {error && (
                    <div className="flex items-center text-sm text-red-500 mt-1">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {error}
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>

          {/* Main Content */}
          <motion.div 
            variants={staggerContainer}
            className="space-y-4"
          >
            {/* Personal Info Card */}
            <motion.div variants={fadeIn} className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="font-semibold text-[#292728]">Personal Information</h3>
              </div>
              
              {/* Name Section */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium">Full Name</span>
                  </div>
                  {!editingName && (
                    <button 
                      onClick={handleEditName}
                      className="text-xs text-[#292728] font-medium flex items-center"
                      disabled={loading}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </button>
                  )}
                </div>
                {!editingName ? (
                  <p className="mt-1 text-sm text-gray-600 ml-6">
                    {userProfile?.full_name || 'Set your name'}
                  </p>
                ) : (
                  <div className="mt-2 ml-6 space-y-2">
                    <Input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="text-sm rounded-xl"
                    />
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        onClick={handleSaveName}
                        disabled={updatingName}
                        className="rounded-xl bg-[#292728] hover:bg-black"
                      >
                        {updatingName ? 'Saving...' : 'Save'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setEditingName(false);
                          setFullName(userProfile?.full_name || '');
                        }}
                        disabled={updatingName}
                        className="rounded-xl"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Phone Number Section */}
              <div className="px-4 py-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium">Phone Number</span>
                  </div>
                  {!editingPhone && (
                    <button 
                      onClick={handleEditPhone}
                      className="text-xs text-[#292728] font-medium flex items-center"
                      disabled={loading}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </button>
                  )}
                </div>
                
                {!editingPhone ? (
                  <p className="mt-1 text-sm text-gray-600 ml-6">
                    {userProfile?.phone_number ? userProfile.phone_number : 'Add your phone number'}
                  </p>
                ) : (
                  <div className="mt-2 ml-6 space-y-2">
                    <Input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter your phone number"
                      maxLength={10}
                      className="text-sm rounded-xl"
                    />
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        onClick={handleSavePhone}
                        disabled={updatingPhone}
                        className="rounded-xl bg-[#292728] hover:bg-black"
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
                        className="rounded-xl"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Password Section */}
              <div className="px-4 py-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <KeyIcon className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium">Password</span>
                  </div>
                  {!changingPassword && (
                    <button 
                      onClick={handleResetPassword}
                      className="text-xs text-[#292728] font-medium flex items-center"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Change
                    </button>
                  )}
                </div>
                
                {changingPassword ? (
                  <div className="mt-2 ml-6 space-y-2">
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Current password"
                      className="text-sm rounded-xl"
                    />
                    
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="New password"
                      className="text-sm rounded-xl"
                    />
                    
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password" 
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                      className="text-sm rounded-xl"
                    />
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        onClick={handleUpdatePassword}
                        disabled={updatingPassword}
                        className="rounded-xl bg-[#292728] hover:bg-black"
                      >
                        {updatingPassword ? 'Updating...' : 'Update'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleCancelPasswordChange}
                        disabled={updatingPassword}
                        className="rounded-xl"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-600 ml-6">
                    ••••••••
                  </p>
                )}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={fadeIn} className="mt-6">
              <h3 className="font-semibold text-[#292728] px-1 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {loading ? (
                  // Loading skeletons for sections in a grid
                  Array(4).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                  ))
                ) : (
                  sections.map((section, index) => (
                    <motion.div
                      key={section.label}
                      variants={fadeIn}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.1 * index }}
                    >
                      <button
                        onClick={section.onClick}
                        className="w-full flex flex-col items-center justify-center gap-2 py-6 text-gray-700 hover:bg-gray-50 transition-colors rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#292728]"
                      >
                        <section.icon className="w-6 h-6 text-[#292728]" />
                        <span className="text-sm font-medium">{section.label}</span>
                      </button>
                    </motion.div>
                  ))
                )}
                
                {/* Logout Button */}
                <motion.div
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.1 * sections.length }}
                >
                  <button
                    onClick={handleLogout}
                    className="w-full flex flex-col items-center justify-center gap-2 py-6 text-red-600 hover:bg-red-50 transition-colors rounded-xl border border-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <LogOut className="w-6 h-6" />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile; 