import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const Sellers = () => {
  const { fetchAllSellers, updateSellerStatus } = useAdminAuth();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  useEffect(() => {
    loadSellers();
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sellers</h1>
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
    </div>
  );
};

export default Sellers; 