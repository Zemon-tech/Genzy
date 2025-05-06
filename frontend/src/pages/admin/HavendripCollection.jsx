import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { 
  PlusIcon, 
  XMarkIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const HavendripCollection = () => {
  const { fetchAllProducts, manageHavendripCollection, getHavendripCollection } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [collectionProducts, setCollectionProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Get all products
        const productsResult = await fetchAllProducts();
        if (productsResult.success) {
          setAllProducts(productsResult.data || []);
        }

        // Get current collection
        const collectionResult = await getHavendripCollection();
        if (collectionResult.success) {
          // Sort by rank order
          const sortedCollection = collectionResult.data.sort((a, b) => a.rank - b.rank);
          setCollectionProducts(sortedCollection.map(item => item.products));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Error loading data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchAllProducts, getHavendripCollection]);

  const handleAddProduct = () => {
    if (!selectedProductId) {
      toast.error('Please select a product to add');
      return;
    }

    // Check if product is already in the collection
    const isProductInCollection = collectionProducts.some(
      product => product.id === selectedProductId
    );

    if (isProductInCollection) {
      toast.error('This product is already in the collection');
      return;
    }

    // Find the product from all products
    const productToAdd = allProducts.find(product => product.id === selectedProductId);
    if (!productToAdd) {
      toast.error('Product not found');
      return;
    }

    // Add to collection
    setCollectionProducts([...collectionProducts, productToAdd]);
    setSelectedProductId('');
  };

  const handleRemoveProduct = (index) => {
    const newCollection = [...collectionProducts];
    newCollection.splice(index, 1);
    setCollectionProducts(newCollection);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newCollection = [...collectionProducts];
    
    // Swap the items
    [newCollection[index], newCollection[index - 1]] = [newCollection[index - 1], newCollection[index]];
    
    setCollectionProducts(newCollection);
  };

  const handleMoveDown = (index) => {
    if (index === collectionProducts.length - 1) return;
    const newCollection = [...collectionProducts];
    
    // Swap the items
    [newCollection[index], newCollection[index + 1]] = [newCollection[index + 1], newCollection[index]];
    
    setCollectionProducts(newCollection);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare product IDs in the correct order for saving
      const productIds = collectionProducts.map(product => product.id);
      
      const result = await manageHavendripCollection(productIds);
      if (result.success) {
        toast.success('Havendrip collection saved successfully');
      } else {
        toast.error('Failed to save collection');
      }
    } catch (error) {
      console.error('Error saving collection:', error);
      toast.error('Error saving collection');
    } finally {
      setSaving(false);
    }
  };

  // Filter products for the dropdown
  const filteredProducts = allProducts.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    return (
      !collectionProducts.some(p => p.id === product.id) && 
      (
        product.name?.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower) ||
        product.sellers?.brand_name?.toLowerCase().includes(searchLower)
      )
    );
  });

  // Format price to currency
  const formatPrice = (price) => {
    if (price === undefined || price === null) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Havendrip Collection</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {saving ? 'Saving...' : 'Save Collection'}
        </button>
      </div>

      {/* Add Product Form */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium">Add Products to Collection</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="relative col-span-4">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <button
              onClick={handleAddProduct}
              disabled={!selectedProductId}
              className="flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-indigo-400"
            >
              <PlusIcon className="mr-1 h-5 w-5" />
              Add
            </button>
          </div>

          <div className="col-span-5">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="mt-2 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select a product</option>
              {filteredProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - {product.sellers?.brand_name || 'Unknown Seller'} - {formatPrice(product.selling_price)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Current Collection */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium">Current Collection</h2>
        
        {collectionProducts.length === 0 ? (
          <p className="text-center text-gray-500">No products in collection yet. Add some products above.</p>
        ) : (
          <div className="space-y-4">
            {collectionProducts.map((product, index) => (
              <div key={product.id} className="flex items-center space-x-4 rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowUpIcon className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => handleMoveDown(index)}
                    disabled={index === collectionProducts.length - 1}
                    className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowDownIcon className="h-5 w-5" />
                  </button>
                  <span className="ml-2 font-medium text-gray-700">{index + 1}</span>
                </div>

                <div className="flex flex-1 items-center space-x-4">
                  {product.images && product.images[0] ? (
                    <img 
                      src={product.images[0]} 
                      alt={product.name} 
                      className="h-16 w-16 rounded-md object-cover"
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/100x100?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-md bg-gray-200 text-xs text-gray-500">
                      No image
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-sm text-gray-500">
                      {product.sellers?.brand_name || 'Unknown Seller'} • {product.category || 'No category'}
                    </p>
                    <p className="text-sm font-medium">{formatPrice(product.selling_price)}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveProduct(index)}
                  className="rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HavendripCollection; 