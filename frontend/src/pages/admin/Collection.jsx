import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  ArrowTopRightOnSquareIcon, 
  PlusIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import supabase from '../../config/supabase';
import ProductCard from '../../components/admin/ProductCard';
import ProductEditorModal from '../../components/admin/ProductEditorModal';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';

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
      <div className="flex justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link to="/admin/havendrip-collection" className="text-blue-600 hover:text-blue-800">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">{name} Collection</h1>
          <a 
            href={`/collection/${name}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-2 p-1 text-gray-500 hover:text-blue-600 rounded"
            title="View public collection page"
          >
            <ArrowTopRightOnSquareIcon className="h-5 w-5" />
          </a>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleEditMetadata}
            className="flex items-center"
          >
            <PhotoIcon className="mr-1 h-5 w-5" />
            Edit Banner & Thumbnail
          </Button>
          
          {isManageMode ? (
            <Button
              variant="outline"
              onClick={handleExitManageMode}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <XMarkIcon className="mr-1 h-5 w-5" />
              Cancel
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleEnterManageMode}
            >
              <PencilIcon className="mr-1 h-5 w-5" />
              Manage Products
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={fetchCollectionData}
            disabled={isManageMode}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Collection Preview */}
      {(collection?.banner_url || collection?.thumbnail_url) && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium mb-4">Collection Preview</h2>
          <div className="space-y-4">
            {collection?.banner_url && (
              <div>
                <p className="text-sm font-medium mb-2">Banner:</p>
                <img 
                  src={collection.banner_url} 
                  alt={`${name} banner`} 
                  className="w-full h-40 object-cover rounded-lg border border-gray-200" 
                />
              </div>
            )}
            
            {collection?.thumbnail_url && (
              <div>
                <p className="text-sm font-medium mb-2">Thumbnail:</p>
                <img 
                  src={collection.thumbnail_url} 
                  alt={`${name} thumbnail`} 
                  className="w-32 h-32 object-cover rounded-lg border border-gray-200" 
                />
              </div>
            )}

            {collection?.description && (
              <div>
                <p className="text-sm font-medium mb-2">Description:</p>
                <p className="text-gray-700">{collection.description}</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {isManageMode ? (
        <div className="space-y-6">
          {/* Products in collection */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Products in Collection</h2>
              
              <Button
                variant="outline"
                onClick={handleRemoveSelected}
                disabled={selectedProductIds.length === 0}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <TrashIcon className="mr-1 h-5 w-5" />
                Remove Selected ({selectedProductIds.length})
              </Button>
            </div>
            
            {products.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No products in this collection yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <div 
                    key={product.id}
                    className={`border rounded p-4 transition-colors ${
                      selectedProductIds.includes(product.id) 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <h3 className="font-medium">{product.name}</h3>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleProductEdit(product)}
                          className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit product"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {product.images?.[0] && (
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                    )}
                    
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">{product.description}</p>
                    
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">₹{product.selling_price}</span>
                      {product.mrp > product.selling_price && (
                        <span className="text-gray-500 line-through">₹{product.mrp}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Available products */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Available Products</h2>
              
              <Button
                variant="outline"
                onClick={handleAddSelected}
                disabled={selectedProductIds.length === 0}
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <PlusIcon className="mr-1 h-5 w-5" />
                Add Selected ({selectedProductIds.length})
              </Button>
            </div>
            
            {loadingAvailable ? (
              <div className="flex justify-center p-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
              </div>
            ) : availableProducts.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No more products available to add.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableProducts.map((product) => (
                  <div 
                    key={product.id}
                    className={`border rounded p-4 transition-colors ${
                      selectedProductIds.includes(product.id) 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <h3 className="font-medium">{product.name}</h3>
                      </div>
                    </div>
                    
                    {product.images?.[0] && (
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                    )}
                    
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">{product.description}</p>
                    
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">₹{product.selling_price}</span>
                      {product.mrp > product.selling_price && (
                        <span className="text-gray-500 line-through">₹{product.mrp}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Products ({products.length})</h2>
          </div>
          
          {products.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No products in this collection yet.</p>
              <Button onClick={handleEnterManageMode}>
                <PlusIcon className="mr-1 h-5 w-5" />
                Add Products
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  onEdit={() => handleProductEdit(product)}
                  onRemove={() => handleProductRemoved(product.id)}
                  collectionName={name}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {editingProduct && (
        <ProductEditorModal 
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleProductSaved}
        />
      )}

      {/* Edit Collection Metadata Dialog */}
      <Dialog open={isMetadataDialogOpen} onOpenChange={setIsMetadataDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Collection Metadata</DialogTitle>
          </DialogHeader>
          
          {editingMetadata && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right font-medium">
                  Name
                </label>
                <Input
                  id="name"
                  value={editingMetadata.name}
                  className="col-span-3"
                  disabled
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="banner-url" className="text-right font-medium">
                  Banner URL
                </label>
                <Input
                  id="banner-url"
                  value={editingMetadata.banner_url || ''}
                  onChange={(e) => setEditingMetadata({
                    ...editingMetadata,
                    banner_url: e.target.value
                  })}
                  placeholder="https://example.com/banner.jpg"
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="thumbnail-url" className="text-right font-medium">
                  Thumbnail URL
                </label>
                <Input
                  id="thumbnail-url"
                  value={editingMetadata.thumbnail_url || ''}
                  onChange={(e) => setEditingMetadata({
                    ...editingMetadata,
                    thumbnail_url: e.target.value
                  })}
                  placeholder="https://example.com/thumbnail.jpg"
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="description" className="text-right font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  value={editingMetadata.description || ''}
                  onChange={(e) => setEditingMetadata({
                    ...editingMetadata,
                    description: e.target.value
                  })}
                  placeholder="Collection description"
                  className="col-span-3"
                  rows={3}
                />
              </div>
              
              {editingMetadata.banner_url && (
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-right font-medium">Banner Preview:</div>
                  <div className="col-span-3">
                    <img 
                      src={editingMetadata.banner_url} 
                      alt="Banner preview" 
                      className="w-full h-24 object-cover rounded-md border border-gray-200" 
                    />
                  </div>
                </div>
              )}
              
              {editingMetadata.thumbnail_url && (
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-right font-medium">Thumbnail Preview:</div>
                  <div className="col-span-3">
                    <img 
                      src={editingMetadata.thumbnail_url} 
                      alt="Thumbnail preview" 
                      className="w-32 h-32 object-cover rounded-md border border-gray-200" 
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMetadataDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMetadata}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 