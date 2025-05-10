import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import supabase from '../../config/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export default function ProductSelector({ collectionName, onProductAdded }) {
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = allProducts.filter((product) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          product.name?.toLowerCase().includes(searchLower) ||
          product.category?.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(allProducts);
    }
  }, [searchTerm, allProducts]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Fetch all products not in the current collection
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, category, mrp, selling_price, images, collections')
        .not('collections', 'cs', `{${collectionName}}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setAllProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!selectedProductId) {
      toast.error('Please select a product to add');
      return;
    }

    setAdding(true);
    try {
      // Find the selected product
      const productToAdd = allProducts.find(p => p.id === selectedProductId);
      
      if (!productToAdd) {
        throw new Error('Product not found');
      }
      
      // Update the product with the new collection
      const collections = [...(productToAdd.collections || [])];
      
      // Don't add duplicate
      if (!collections.includes(collectionName)) {
        collections.push(collectionName);
      }
      
      const { error } = await supabase
        .from('products')
        .update({ collections })
        .eq('id', selectedProductId);
        
      if (error) throw error;
      
      toast.success('Product added to collection');
      
      // Update local state
      setAllProducts(allProducts.filter(p => p.id !== selectedProductId));
      setSelectedProductId('');
      
      // Notify parent component
      if (onProductAdded) {
        onProductAdded(productToAdd);
      }
    } catch (error) {
      console.error('Error adding product to collection:', error);
      toast.error('Failed to add product to collection');
    } finally {
      setAdding(false);
    }
  };

  // Format price to currency
  const formatPrice = (price) => {
    if (price === undefined || price === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-medium">Add Products to &quot;{collectionName}&quot; Collection</h2>
      
      <div className="mb-4">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search products by name, category or description"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      {filteredProducts.length === 0 ? (
        <p className="text-center text-gray-500 py-4">
          {searchTerm 
            ? 'No products found matching your search' 
            : 'No products available to add to this collection'}
        </p>
      ) : (
        <>
          <div className="mb-4 max-h-96 overflow-y-auto border rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Select
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr 
                    key={product.id} 
                    className={`hover:bg-gray-50 cursor-pointer ${selectedProductId === product.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedProductId(product.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="radio"
                        name="selectedProduct"
                        checked={selectedProductId === product.id}
                        onChange={() => setSelectedProductId(product.id)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {product.images && product.images[0] ? (
                            <img 
                              className="h-10 w-10 rounded-full object-cover" 
                              src={product.images[0]} 
                              alt={product.name} 
                              onError={(e) => {
                                e.target.src = 'https://placehold.co/100x100?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-xs text-gray-500">No img</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{product.category || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatPrice(product.selling_price)}</div>
                      {product.mrp && product.mrp !== product.selling_price && (
                        <div className="text-xs text-gray-500 line-through">{formatPrice(product.mrp)}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-end">
            <Button
              onClick={handleAddProduct}
              disabled={!selectedProductId || adding}
            >
              <PlusIcon className="mr-1 h-5 w-5" />
              {adding ? 'Adding...' : 'Add to Collection'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

ProductSelector.propTypes = {
  collectionName: PropTypes.string.isRequired,
  onProductAdded: PropTypes.func
}; 