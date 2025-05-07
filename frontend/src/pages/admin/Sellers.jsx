import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon, PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import axios from 'axios';

// Use the explicit backend URL - adjust to your actual backend port
const API_BASE_URL = 'http://localhost:5011'; // Updated to match the error message port

const Sellers = () => {
  const { fetchAllSellers, updateSellerStatus, admin } = useAdminAuth();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [showAddSellerModal, setShowAddSellerModal] = useState(false);
  const [newSellerData, setNewSellerData] = useState({
    brand_name: '',
    business_email: '',
    phone_number: '',
    password: ''
  });
  const [emailError, setEmailError] = useState('');
  const [addingNewSeller, setAddingNewSeller] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    // Check admin authentication on component mount
    checkAdminAuth();
    loadSellers();
  }, []);

  // Check if admin is authenticated
  const checkAdminAuth = async () => {
    // Use the admin object from AdminAuthContext
    if (!admin) {
      setAuthError('You must be logged in as an admin to perform this action');
      toast.error('Authentication required. Please log in as admin.');
    } else {
      console.log('Logged in as admin:', admin.email);
      setAuthError('');
    }
  };

  const loadSellers = async () => {
    setLoading(true);
    try {
      const result = await fetchAllSellers();
      if (result.success) {
        setSellers(result.data || []);
      } else {
        console.error('Failed to fetch sellers:', result.error);
        toast.error('Failed to load sellers');
      }
    } catch (error) {
      console.error('Error loading sellers:', error);
      toast.error('Error loading sellers');
    } finally {
      setLoading(false);
    }
  };

  // Handle sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sorted and filtered sellers
  const getSortedSellers = () => {
    const filteredSellers = sellers.filter(seller => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (seller.brand_name?.toLowerCase().includes(searchLower) || '') ||
        (seller.business_email?.toLowerCase().includes(searchLower) || '') ||
        (seller.phone_number?.toLowerCase().includes(searchLower) || '')
      );
    });
    
    if (!sortConfig.key) return filteredSellers;
    
    return [...filteredSellers].sort((a, b) => {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Format date to a readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle seller verification status update
  const handleVerificationUpdate = async (sellerId, newStatus) => {
    setUpdatingStatus(sellerId);
    try {
      const result = await updateSellerStatus(sellerId, newStatus);
      if (result.success) {
        // Update the local state to reflect the change
        setSellers(sellers.map(seller => 
          seller.id === sellerId 
            ? { ...seller, is_verified: newStatus } 
            : seller
        ));
        toast.success(`Seller ${newStatus ? 'verified' : 'unverified'} successfully`);
      } else {
        toast.error(`Failed to update seller status: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating seller status:', error);
      toast.error('Error updating seller status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Get the sorted, filtered sellers
  const sortedSellers = getSortedSellers();

  // Validate email
  const validateEmail = (email) => {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    
    // Check for common example domains
    const blockedDomains = ['example.com', 'test.com', 'domain.com'];
    const domain = email.split('@')[1];
    if (blockedDomains.includes(domain)) {
      return "Please use a real email domain. Example domains are not allowed.";
    }
    
    return "";
  };

  // Handle email change
  const handleEmailChange = (e) => {
    const email = e.target.value;
    setNewSellerData({...newSellerData, business_email: email});
    
    if (email) {
      setEmailError(validateEmail(email));
    } else {
      setEmailError('');
    }
  };

  // Create seller directly through backend API
  const createSellerDirectly = async (sellerData) => {
    try {
      // Check if admin is authenticated
      if (!admin || !admin.session) {
        throw new Error('Authentication required. Please log in as admin.');
      }
      
      const adminToken = admin.session.access_token;
      console.log('Using admin token for authentication:', adminToken.substring(0, 15) + '...');
      
      // Call our backend API with the admin token
      const response = await axios.post(`${API_BASE_URL}/api/admin/sellers/create-seller`, sellerData, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true // Include cookies
      });

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error creating seller:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to create seller';
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const handleAddSeller = async () => {
    // Check if admin is authenticated 
    if (!admin) {
      toast.error('Authentication required. Please log in as admin.');
      return;
    }
    
    // Validate email before submission
    const emailValidationError = validateEmail(newSellerData.business_email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      toast.error(emailValidationError);
      return;
    }
    
    // Validate required fields
    if (!newSellerData.brand_name || !newSellerData.business_email || 
        !newSellerData.phone_number || !newSellerData.password) {
      toast.error('All fields are required');
      return;
    }

    // Validate password length
    if (newSellerData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    setAddingNewSeller(true);
    try {
      const result = await createSellerDirectly(newSellerData);
      if (result.success) {
        toast.success('Seller added successfully');
        setNewSellerData({
          brand_name: '',
          business_email: '',
          phone_number: '',
          password: ''
        });
        setEmailError('');
        setShowAddSellerModal(false);
        // Refresh the sellers list
        loadSellers();
      } else {
        console.error('Failed to add seller:', result.error);
        toast.error(`Failed to add seller: ${result.error}`);
      }
    } catch (error) {
      console.error('Error adding seller:', error);
      toast.error('Error adding seller');
    } finally {
      setAddingNewSeller(false);
    }
  };

  return (
    <div className="space-y-6">
      {authError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{authError}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sellers</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Search sellers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowAddSellerModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={!!authError}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Seller
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  onClick={() => requestSort('brand_name')}
                >
                  Brand Name
                  {sortConfig.key === 'brand_name' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  scope="col" 
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  onClick={() => requestSort('business_email')}
                >
                  Email
                  {sortConfig.key === 'business_email' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  scope="col" 
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  onClick={() => requestSort('phone_number')}
                >
                  Phone
                  {sortConfig.key === 'phone_number' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  scope="col" 
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  onClick={() => requestSort('created_at')}
                >
                  Joined
                  {sortConfig.key === 'created_at' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  scope="col" 
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  onClick={() => requestSort('is_verified')}
                >
                  Status
                  {sortConfig.key === 'is_verified' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sortedSellers.length > 0 ? (
                sortedSellers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="font-medium text-gray-900">{seller.brand_name || 'N/A'}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {seller.business_email || 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {seller.phone_number || 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDate(seller.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      {seller.is_verified ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          <CheckCircleIcon className="mr-1 h-4 w-4" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          <XCircleIcon className="mr-1 h-4 w-4" />
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      {updatingStatus === seller.id ? (
                        <span className="text-gray-500">Updating...</span>
                      ) : seller.is_verified ? (
                        <button
                          onClick={() => handleVerificationUpdate(seller.id, false)}
                          className="font-medium text-red-600 hover:text-red-900"
                        >
                          Disable Seller
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerificationUpdate(seller.id, true)}
                          className="font-medium text-green-600 hover:text-green-900"
                        >
                          Verify Seller
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm ? 'No sellers match your search.' : 'No sellers found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        Total sellers: {sortedSellers.length}
      </div>

      {/* Add New Seller Modal */}
      {showAddSellerModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowAddSellerModal(false)}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Seller</h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="brand_name" className="block text-sm font-medium text-gray-700">Brand Name</label>
                      <input
                        type="text"
                        id="brand_name"
                        value={newSellerData.brand_name}
                        onChange={(e) => setNewSellerData({...newSellerData, brand_name: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="business_email" className="block text-sm font-medium text-gray-700">Business Email</label>
                      <input
                        type="email"
                        id="business_email"
                        value={newSellerData.business_email}
                        onChange={handleEmailChange}
                        className={`mt-1 block w-full rounded-md ${emailError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'} shadow-sm sm:text-sm`}
                        required
                      />
                      {emailError && (
                        <p className="mt-1 text-sm text-red-600">{emailError}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <input
                        type="tel"
                        id="phone_number"
                        value={newSellerData.phone_number}
                        onChange={(e) => setNewSellerData({...newSellerData, phone_number: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                      <input
                        type="password"
                        id="password"
                        value={newSellerData.password}
                        onChange={(e) => setNewSellerData({...newSellerData, password: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleAddSeller}
                  disabled={addingNewSeller || !newSellerData.brand_name || !newSellerData.business_email || !newSellerData.phone_number || !newSellerData.password}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-300"
                >
                  {addingNewSeller ? 'Adding...' : 'Add Seller'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSellerModal(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sellers; 