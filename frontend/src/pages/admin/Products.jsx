import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon, PencilIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const Products = () => {
  const { fetchAllProducts, updateProductStatus } = useAdminAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [filterCategory, setFilterCategory] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const result = await fetchAllProducts();
      if (result.success) {
        setProducts(result.data || []);
        
        // Extract unique categories from products
        const uniqueCategories = [...new Set(result.data.map(product => product.category))].filter(Boolean);
        setCategories(uniqueCategories.sort());
      } else {
        console.error('Failed to fetch products:', result.error);
        toast.error('Failed to load products');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Error loading products');
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

  // Get sorted and filtered products
  const getSortedProducts = () => {
    const filteredProducts = products.filter(product => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        (product.name?.toLowerCase().includes(searchLower) || '') ||
        (product.category?.toLowerCase().includes(searchLower) || '') ||
        (product.sellers?.brand_name?.toLowerCase().includes(searchLower) || '')
      );
      
      // Apply category filter if set
      const matchesCategory = !filterCategory || product.category === filterCategory;
      
      return matchesSearch && matchesCategory;
    });
    
    if (!sortConfig.key) return filteredProducts;
    
    return [...filteredProducts].sort((a, b) => {
      // Special case for nested properties like sellers.brand_name
      if (sortConfig.key === 'seller') {
        const aValue = a.sellers?.brand_name || '';
        const bValue = b.sellers?.brand_name || '';
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      }
      
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

  // Format price to currency
  const formatPrice = (price) => {
    if (price === undefined || price === null) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Handle product status update
  const handleStatusUpdate = async (productId, newStatus) => {
    setUpdatingStatus(productId);
    try {
      const result = await updateProductStatus(productId, newStatus);
      if (result.success) {
        // Update the local state to reflect the change
        setProducts(products.map(product => 
          product.id === productId 
            ? { ...product, is_active: newStatus } 
            : product
        ));
        toast.success(`Product ${newStatus ? 'activated' : 'deactivated'} successfully`);
      } else {
        toast.error(`Failed to update product status: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating product status:', error);
      toast.error('Error updating product status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Get the sorted, filtered products
  const sortedProducts = getSortedProducts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h1 className="text-2xl font-bold">Products</h1>
        
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
          {/* Category filter */}
          <div className="relative rounded-md shadow-sm">
            <select
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          {/* Search input */}
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
                  onClick={() => requestSort('name')}
                >
                  Product Name
                  {sortConfig.key === 'name' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  scope="col" 
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  onClick={() => requestSort('seller')}
                >
                  Seller
                  {sortConfig.key === 'seller' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  scope="col" 
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  onClick={() => requestSort('category')}
                >
                  Category
                  {sortConfig.key === 'category' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  scope="col" 
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  onClick={() => requestSort('selling_price')}
                >
                  Price
                  {sortConfig.key === 'selling_price' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  scope="col" 
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  onClick={() => requestSort('stock_quantity')}
                >
                  Stock
                  {sortConfig.key === 'stock_quantity' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  scope="col" 
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  onClick={() => requestSort('is_active')}
                >
                  Status
                  {sortConfig.key === 'is_active' && (
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
              {sortedProducts.length > 0 ? (
                sortedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {product.images && product.images[0] ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.name} 
                            className="mr-3 h-10 w-10 rounded-md object-cover"
                            onError={(e) => {
                              e.target.src = 'https://placehold.co/50x50?text=No+Image';
                            }}
                          />
                        ) : (
                          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-md bg-gray-200 text-xs text-gray-500">
                            No img
                          </div>
                        )}
                        <div className="font-medium text-gray-900">{product.name || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {product.sellers?.brand_name || 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {product.category || 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatPrice(product.selling_price)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {product.stock_quantity || 0}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      {product.is_active ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          <CheckCircleIcon className="mr-1 h-4 w-4" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          <XCircleIcon className="mr-1 h-4 w-4" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <div className="flex space-x-2">
                        {updatingStatus === product.id ? (
                          <span className="text-gray-500">Updating...</span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(product.id, !product.is_active)}
                              className={`font-medium ${product.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                            >
                              {product.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <a 
                              href={`/product/${product.id}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="font-medium text-blue-600 hover:text-blue-900"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </a>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm || filterCategory ? 'No products match your filters.' : 'No products found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        Total products: {sortedProducts.length}
      </div>
    </div>
  );
};

export default Products; 