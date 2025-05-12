import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeftIcon, 
  ArrowTopRightOnSquareIcon, 
  PlusIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  PhotoIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import supabase from '../../config/supabase';
import ProductCard from '../../components/admin/ProductCard';
import ProductEditorModal from '../../components/admin/ProductEditorModal';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';

// Define our new color scheme
const COLORS = {
  black: "#292728",
  white: "#feffee",
  gold: "#eaaa07"
};

export default function Collection() {
  const { name } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isManageMode, setIsManageMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [collection, setCollection] = useState(null);
  const [isMetadataDialogOpen, setIsMetadataDialogOpen] = useState(false);
  const [editingMetadata, setEditingMetadata] = useState(null);
  
  useEffect(() => {
    if (name) {
      fetchCollectionData();
    }
  }, [name]);
  
  const fetchCollectionData = async () => {
    setLoading(true);
    try {
      // Fetch collection metadata
      const { data: collectionData, error: collectionError } = await supabase
        .from('collections')
        .select('*')
        .eq('name', name)
        .single();
      
      if (collectionError && collectionError.code !== 'PGRST116') {
        console.error('Error fetching collection metadata:', collectionError);
      } else {
        setCollection(collectionData || { name });
      }
      
      // Fetch all products that include this collection in their collections array
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .contains('collections', [name])
        .order('name');
        
      if (error) throw error;
      
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching collection data:', error);
      toast.error('Failed to load collection data');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAvailableProducts = async () => {
    setLoadingAvailable(true);
    try {
      // Fetch all products that don't include this collection
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, category, mrp, selling_price, images, collections')
        .not('collections', 'cs', `{${name}}`)
        .order('name');
        
      if (error) throw error;
      
      setAvailableProducts(data || []);
    } catch (error) {
      console.error('Error fetching available products:', error);
      toast.error('Failed to load available products');
    } finally {
      setLoadingAvailable(false);
    }
  };
  
  const handleEnterManageMode = () => {
    setIsManageMode(true);
    fetchAvailableProducts();
    setSelectedProductIds([]);
  };
  
  const handleExitManageMode = () => {
    setIsManageMode(false);
    setSelectedProductIds([]);
  };
  
  const handleProductRemoved = (productId) => {
    setProducts(products.filter(p => p.id !== productId));
  };
  
  const handleProductEdit = (product) => {
    setEditingProduct(product);
  };
  
  const handleProductSaved = (updatedProduct) => {
    // Update the product in the local state
    setProducts(products.map(p => 
      p.id === updatedProduct.id ? updatedProduct : p
    ));
    setEditingProduct(null);
  };
  
  const toggleProductSelection = (productId) => {
    if (selectedProductIds.includes(productId)) {
      setSelectedProductIds(selectedProductIds.filter(id => id !== productId));
    } else {
      setSelectedProductIds([...selectedProductIds, productId]);
    }
  };
  
  const handleRemoveSelected = async () => {
    if (selectedProductIds.length === 0) {
      toast.error('Please select products to remove');
      return;
    }
    
    if (!confirm(`Are you sure you want to remove ${selectedProductIds.length} product(s) from this collection?`)) {
      return;
    }
    
    try {
      const productsToUpdate = products.filter(p => selectedProductIds.includes(p.id));
      
      // Process each product in a batch
      const promises = productsToUpdate.map(product => {
        const collections = (product.collections || []).filter(c => c !== name);
        return supabase
          .from('products')
          .update({ collections })
          .eq('id', product.id);
      });
      
      await Promise.all(promises);
      
      toast.success(`${selectedProductIds.length} product(s) removed from collection`);
      
      // Update local state
      setProducts(products.filter(p => !selectedProductIds.includes(p.id)));
      setSelectedProductIds([]);
    } catch (error) {
      console.error('Error removing products from collection:', error);
      toast.error('Failed to remove products from collection');
    }
  };
  
  const handleAddSelected = async () => {
    if (selectedProductIds.length === 0) {
      toast.error('Please select products to add');
      return;
    }
    
    try {
      const productsToAdd = availableProducts.filter(p => selectedProductIds.includes(p.id));
      
      // Process each product in a batch
      const promises = productsToAdd.map(product => {
        const collections = [...(product.collections || [])];
        if (!collections.includes(name)) {
          collections.push(name);
        }
        return supabase
          .from('products')
          .update({ collections })
          .eq('id', product.id);
      });
      
      await Promise.all(promises);
      
      toast.success(`${selectedProductIds.length} product(s) added to collection`);
      
      // Update local state
      const newProducts = [...products, ...productsToAdd];
      setProducts(newProducts);
      setAvailableProducts(availableProducts.filter(p => !selectedProductIds.includes(p.id)));
      setSelectedProductIds([]);
    } catch (error) {
      console.error('Error adding products to collection:', error);
      toast.error('Failed to add products to collection');
    }
  };

  const handleEditMetadata = () => {
    setEditingMetadata({
      ...collection,
      name: collection?.name || name,
      banner_url: collection?.banner_url || '',
      thumbnail_url: collection?.thumbnail_url || '',
      description: collection?.description || ''
    });
    setIsMetadataDialogOpen(true);
  };

  const handleSaveMetadata = async () => {
    try {
      const { error } = await supabase
        .from('collections')
        .update({
          banner_url: editingMetadata.banner_url,
          thumbnail_url: editingMetadata.thumbnail_url,
          description: editingMetadata.description
        })
        .eq('name', editingMetadata.name);
        
      if (error) throw error;
      
      toast.success(`Collection metadata updated`);
      
      // Update local state
      setCollection(editingMetadata);
      setIsMetadataDialogOpen(false);
      setEditingMetadata(null);
    } catch (error) {
      console.error('Error updating collection metadata:', error);
      toast.error('Failed to update collection metadata');
    }
  };
  
  if (loading && !isManageMode) {
    return (
      <div className="flex justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#eaaa07] border-t-transparent"></div>
          <p className="text-[#eaaa07] animate-pulse">Loading collection data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.5 }}
      className="space-y-8"
      style={{ backgroundColor: COLORS.white }}
    >
      {/* Collection Header Section */}
      <div 
        className="rounded-2xl p-6 shadow-lg text-[#feffee]"
        style={{ 
          background: `linear-gradient(135deg, ${COLORS.black} 0%, #3a3939 100%)`,
          boxShadow: `0 10px 30px rgba(0,0,0,0.15), 0 1px 3px rgba(234,170,7,0.2), 0 1px 0 rgba(255,255,255,0.05) inset` 
        }}
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Link 
              to="/admin/havendrip-collection" 
              className="flex items-center gap-2 bg-[#feffee]/10 backdrop-blur-sm hover:bg-[#feffee]/20 text-[#feffee] px-3 py-2 rounded-lg transition-all"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Back to Collections</span>
            </Link>
            
            <Link
              to={`/collection/${name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#feffee]/10 backdrop-blur-sm hover:bg-[#feffee]/20 text-[#feffee] px-3 py-2 rounded-lg transition-all"
            >
              <span>View Public Page</span>
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                {collection?.name ? collection.name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </h1>
              {collection?.description && (
                <p className="mt-2 text-[#feffee]/80 max-w-xl">{collection.description}</p>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleEditMetadata}
                className="bg-[#feffee]/10 backdrop-blur-sm hover:bg-[#feffee]/20 text-[#feffee] border-[#feffee]/20"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Details
              </Button>
              
              {isManageMode ? (
                <Button
                  onClick={handleExitManageMode}
                  className="whitespace-nowrap bg-[#eaaa07] hover:bg-[#eaaa07]/90 text-[#292728] font-medium"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Exit Manage Mode
                </Button>
              ) : (
                <Button
                  onClick={handleEnterManageMode}
                  className="whitespace-nowrap bg-[#eaaa07] hover:bg-[#eaaa07]/90 text-[#292728] font-medium"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Products
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Collection Banner Preview */}
      {collection?.banner_url && (
        <div className="relative overflow-hidden rounded-xl shadow-md aspect-[3/1] bg-gray-100">
          <img 
            src={collection.banner_url} 
            alt={`${name} banner`} 
            className="w-full h-full object-cover"
          />
          <button
            onClick={handleEditMetadata}
            className="absolute bottom-4 right-4 bg-[#292728]/70 backdrop-blur-sm hover:bg-[#292728]/90 text-[#feffee] p-2 rounded-full transition-all shadow-lg"
            title="Edit banner"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
        </div>
      )}
      
      {/* Products Management Section */}
      <div className="bg-[#feffee] rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-[#292728] to-[#3a3939] p-6 border-b border-[#eaaa07]/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-[#feffee]">
              {isManageMode ? 'Manage Products' : 'Collection Products'}
              <span className="ml-2 px-2.5 py-0.5 bg-[#eaaa07] rounded-full text-sm text-[#292728] font-normal">
                {products.length}
              </span>
            </h2>
            
            {isManageMode && (
              <div className="flex-shrink-0 flex gap-2">
                {selectedProductIds.length > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleRemoveSelected}
                    className="whitespace-nowrap bg-red-600 hover:bg-red-700"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Remove Selected ({selectedProductIds.length})
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6">
          {/* Products Grid */}
          {!isManageMode && (
            <>
              {products.length === 0 ? (
                <div className="text-center p-12 bg-gray-50 rounded-xl">
                  <div className="flex justify-center mb-4">
                    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No Products in This Collection</h3>
                  <p className="text-gray-500 mb-6">Start adding products to build your collection.</p>
                  <Button
                    onClick={handleEnterManageMode}
                    className="mx-auto bg-[#eaaa07] hover:bg-[#eaaa07]/90 text-[#292728] font-medium"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Products
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ProductCard
                        product={product}
                        onEdit={() => handleProductEdit(product)}
                        onRemove={() => {
                          if (confirm(`Remove "${product.name}" from this collection?`)) {
                            const newCollections = (product.collections || []).filter(c => c !== name);
                            supabase
                              .from('products')
                              .update({ collections: newCollections })
                              .eq('id', product.id)
                              .then(() => {
                                toast.success(`"${product.name}" removed from collection`);
                                handleProductRemoved(product.id);
                              })
                              .catch(error => {
                                console.error('Error removing product from collection:', error);
                                toast.error('Failed to remove product from collection');
                              });
                          }
                        }}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
          
          {/* Manage Mode - Available Products - Completely redesigned for 2030 look */}
          {isManageMode && (
            <div className="space-y-8">
              {/* Floating Action Button */}
              {selectedProductIds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="fixed bottom-8 right-8 z-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="bg-[#292728] text-[#feffee] px-4 py-2 rounded-l-full shadow-lg">
                      {selectedProductIds.length} selected
                    </span>
                    
                    {/* Action buttons */}
                    <div className="flex">
                      {products.some(p => selectedProductIds.includes(p.id)) && (
                        <Button 
                          onClick={handleRemoveSelected}
                          className="bg-red-600 hover:bg-red-700 text-white rounded-none"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </Button>
                      )}
                      
                      {availableProducts.some(p => selectedProductIds.includes(p.id)) && (
                        <Button
                          onClick={handleAddSelected}
                          className="bg-[#eaaa07] hover:bg-[#eaaa07]/90 text-[#292728] rounded-r-full"
                        >
                          <PlusIcon className="h-5 w-5 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Two column layout for product management */}
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Current Products Column */}
                <div className="lg:w-1/2 space-y-4">
                  <div className="bg-[#292728] text-[#feffee] p-4 rounded-t-lg">
                    <h3 className="font-bold flex items-center">
                      Current Products
                      <span className="ml-2 px-2.5 py-0.5 bg-[#eaaa07] rounded-full text-xs text-[#292728] font-medium">
                        {products.length}
                      </span>
                    </h3>
                  </div>
                  
                  <div className="border border-[#eaaa07]/20 rounded-b-lg overflow-hidden bg-[#feffee]">
                    {products.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <div className="flex justify-center mb-3">
                          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                          </svg>
                        </div>
                        No products in this collection yet
                      </div>
                    ) : (
                      <div className="divide-y divide-[#eaaa07]/10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {products.map((product) => (
                          <motion.div
                            key={product.id}
                            className={`
                              flex items-center p-3 hover:bg-[#eaaa07]/5 transition-all duration-300 cursor-pointer
                              ${selectedProductIds.includes(product.id) ? 'bg-[#eaaa07]/10' : ''}
                            `}
                            onClick={() => toggleProductSelection(product.id)}
                            whileHover={{ x: 5 }}
                          >
                            {/* Checkbox */}
                            <div className="flex-shrink-0 mr-4">
                              <div className={`
                                h-5 w-5 rounded flex items-center justify-center transition-colors
                                ${selectedProductIds.includes(product.id) 
                                  ? 'bg-[#eaaa07] border-[#eaaa07]' 
                                  : 'border border-gray-300 bg-white'}
                              `}>
                                {selectedProductIds.includes(product.id) && (
                                  <CheckIcon className="h-3 w-3 text-[#292728]" />
                                )}
                              </div>
                            </div>
                            
                            {/* Product Image */}
                            <div className="h-14 w-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                              {product.images && product.images[0] ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <PhotoIcon className="h-6 w-6 text-gray-300" />
                                </div>
                              )}
                            </div>
                            
                            {/* Product Info */}
                            <div className="ml-3 flex-1">
                              <p className="font-medium text-[#292728]">{product.name}</p>
                              <p className="text-sm text-gray-500">₹{product.selling_price || product.mrp}</p>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProductEdit(product);
                                }}
                                className="p-1.5 rounded-full hover:bg-[#292728] hover:text-[#feffee] text-gray-600 transition-colors"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Available Products Column */}
                <div className="lg:w-1/2 space-y-4">
                  <div className="bg-[#292728] text-[#feffee] p-4 rounded-t-lg">
                    <h3 className="font-bold flex items-center">
                      Available Products
                      <span className="ml-2 px-2.5 py-0.5 bg-[#eaaa07] rounded-full text-xs text-[#292728] font-medium">
                        {availableProducts.length}
                      </span>
                    </h3>
                  </div>
                  
                  <div className="border border-[#eaaa07]/20 rounded-b-lg overflow-hidden bg-[#feffee]">
                    {loadingAvailable ? (
                      <div className="flex justify-center items-center p-12">
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#eaaa07] border-t-transparent"></div>
                          <p className="text-sm text-gray-500">Loading products...</p>
                        </div>
                      </div>
                    ) : (
                      availableProducts.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <div className="flex justify-center mb-3">
                            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                          </div>
                          All products have been added to this collection
                        </div>
                      ) : (
                        <div className="divide-y divide-[#eaaa07]/10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                          {availableProducts.map((product) => (
                            <motion.div
                              key={product.id}
                              className={`
                                flex items-center p-3 hover:bg-[#eaaa07]/5 transition-all duration-300 cursor-pointer
                                ${selectedProductIds.includes(product.id) ? 'bg-[#eaaa07]/10' : ''}
                              `}
                              onClick={() => toggleProductSelection(product.id)}
                              whileHover={{ x: 5 }}
                            >
                              {/* Checkbox */}
                              <div className="flex-shrink-0 mr-4">
                                <div className={`
                                  h-5 w-5 rounded flex items-center justify-center transition-colors
                                  ${selectedProductIds.includes(product.id) 
                                    ? 'bg-[#eaaa07] border-[#eaaa07]' 
                                    : 'border border-gray-300 bg-white'}
                                `}>
                                  {selectedProductIds.includes(product.id) && (
                                    <CheckIcon className="h-3 w-3 text-[#292728]" />
                                  )}
                                </div>
                              </div>
                              
                              {/* Product Image */}
                              <div className="h-14 w-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                {product.images && product.images[0] ? (
                                  <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center h-full">
                                    <PhotoIcon className="h-6 w-6 text-gray-300" />
                                  </div>
                                )}
                              </div>
                              
                              {/* Product Info */}
                              <div className="ml-3 flex-1">
                                <p className="font-medium text-[#292728]">{product.name}</p>
                                <p className="text-sm text-gray-500">₹{product.selling_price || product.mrp}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Product Edit Modal */}
      {editingProduct && (
        <ProductEditorModal
          product={editingProduct}
          onSave={handleProductSaved}
          onCancel={() => setEditingProduct(null)}
        />
      )}
      
      {/* Collection Metadata Edit Dialog */}
      <Dialog open={isMetadataDialogOpen} onOpenChange={setIsMetadataDialogOpen}>
        <DialogContent className="max-w-lg bg-[#feffee] border border-[#eaaa07]/20">
          <DialogHeader className="bg-[#292728] -mx-6 -mt-6 mb-6 p-4 rounded-t-lg">
            <DialogTitle className="text-xl font-bold text-[#feffee]">Edit Collection Details</DialogTitle>
          </DialogHeader>
          
          {editingMetadata && (
            <div className="space-y-5 pt-4">
              <div>
                <label className="block text-sm font-medium text-[#292728] mb-1">
                  Collection Name
                </label>
                <Input
                  value={editingMetadata.name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  disabled
                  className="bg-gray-100 border-[#eaaa07]/20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#292728] mb-1">
                  Banner URL
                </label>
                <Input
                  value={editingMetadata.banner_url}
                  onChange={(e) => setEditingMetadata({...editingMetadata, banner_url: e.target.value})}
                  placeholder="Enter banner image URL"
                  className="border-[#eaaa07]/20 focus:border-[#eaaa07]"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Recommended size: 1200×400px. This image appears at the top of the collection page.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#292728] mb-1">
                  Thumbnail URL
                </label>
                <Input
                  value={editingMetadata.thumbnail_url}
                  onChange={(e) => setEditingMetadata({...editingMetadata, thumbnail_url: e.target.value})}
                  placeholder="Enter thumbnail image URL"
                  className="border-[#eaaa07]/20 focus:border-[#eaaa07]"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Recommended size: 600×400px. This image appears in collection listings.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#292728] mb-1">
                  Description
                </label>
                <Textarea
                  value={editingMetadata.description}
                  onChange={(e) => setEditingMetadata({...editingMetadata, description: e.target.value})}
                  placeholder="Enter collection description"
                  rows={3}
                  className="border-[#eaaa07]/20 focus:border-[#eaaa07]"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Brief description that appears on both the collection page and in listings.
                </p>
              </div>
              
              {/* Preview Images */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {editingMetadata.banner_url && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-500">Banner Preview</span>
                    <div className="border border-[#eaaa07]/20 rounded-lg overflow-hidden aspect-[3/1]">
                      <img
                        src={editingMetadata.banner_url}
                        alt="Banner preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
                
                {editingMetadata.thumbnail_url && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-500">Thumbnail Preview</span>
                    <div className="border border-[#eaaa07]/20 rounded-lg overflow-hidden aspect-video">
                      <img
                        src={editingMetadata.thumbnail_url}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsMetadataDialogOpen(false)}
              className="border-[#292728] text-[#292728] hover:bg-[#292728]/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveMetadata}
              className="bg-[#eaaa07] hover:bg-[#eaaa07]/90 text-[#292728] font-medium"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add custom scrollbar styles */}
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #eaaa07;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #d69c07;
          }
        `}
      </style>
    </motion.div>
  );
} 