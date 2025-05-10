import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import supabase from '../../config/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export default function ProductEditorModal({ product, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mrp: '',
    selling_price: '',
    category: '',
    stock_quantity: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  useEffect(() => {
    if (product) {
      // Convert all values to strings for the form
      setFormData({
        name: product.name || '',
        description: product.description || '',
        mrp: product.mrp?.toString() || '',
        selling_price: product.selling_price?.toString() || '',
        category: product.category || '',
        stock_quantity: product.stock_quantity?.toString() || '',
        tags: Array.isArray(product.tags) ? product.tags.join(', ') : ''
      });
      
      setExistingImages(product.images || []);
    }
  }, [product]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleImageChange = (e) => {
    if (e.target.files) {
      setImageFiles([...e.target.files]);
    }
  };
  
  const removeExistingImage = (imageUrl) => {
    setExistingImages(existingImages.filter(img => img !== imageUrl));
  };
  
  // Upload images to Supabase Storage
  const handleUploadImages = async () => {
    if (imageFiles.length === 0) return [];
    
    setUploading(true);
    const uploadedUrls = [];
    
    try {
      // Upload each file
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${product.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;
        
        // Upload to productimages bucket
        const { error } = await supabase.storage
          .from('productimages')
          .upload(filePath, file);
          
        if (error) throw error;
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('productimages')
          .getPublicUrl(filePath);
          
        uploadedUrls.push(urlData.publicUrl);
      }
      
      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
      return [];
    } finally {
      setUploading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Process the form data
      const processedData = {
        name: formData.name,
        description: formData.description,
        mrp: formData.mrp ? parseFloat(formData.mrp) : null,
        selling_price: formData.selling_price ? parseFloat(formData.selling_price) : null,
        category: formData.category,
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity, 10) : null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      };
      
      // Handle image uploads if there are any
      let finalImages = [...existingImages];
      
      if (imageFiles.length > 0) {
        const newImageUrls = await handleUploadImages();
        finalImages = [...finalImages, ...newImageUrls];
      }
      
      // Update product with new data
      const { error } = await supabase
        .from('products')
        .update({
          ...processedData,
          images: finalImages
        })
        .eq('id', product.id);
        
      if (error) throw error;
      
      toast.success('Product updated successfully');
      
      // Notify parent component
      if (onSave) {
        onSave({
          ...product,
          ...processedData,
          images: finalImages
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Edit Product</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <Input
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MRP Price
                </label>
                <Input
                  name="mrp"
                  type="number"
                  step="0.01"
                  value={formData.mrp}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selling Price
                </label>
                <Input
                  name="selling_price"
                  type="number"
                  step="0.01"
                  value={formData.selling_price}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity
                </label>
                <Input
                  name="stock_quantity"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma separated)
                </label>
                <Input
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="fashion, summer, casual"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Images
                </label>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mb-2"
                />
                
                {/* Display selected files */}
                {imageFiles.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      New images to upload:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(imageFiles).map((file, index) => (
                        <div key={index} className="relative">
                          <div className="h-16 w-16 border rounded-md">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`New product image ${index}`}
                              className="h-full w-full object-cover rounded-md"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Display existing images */}
                {existingImages.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Current images:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {existingImages.map((imageUrl, index) => (
                        <div key={index} className="relative">
                          <div className="h-16 w-16 border rounded-md">
                            <img
                              src={imageUrl}
                              alt={`Product image ${index}`}
                              className="h-full w-full object-cover rounded-md"
                              onError={(e) => {
                                e.target.src = 'https://placehold.co/100x100?text=Error';
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExistingImage(imageUrl)}
                            className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                            title="Remove image"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || uploading}
              >
                {loading || uploading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

ProductEditorModal.propTypes = {
  product: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func
}; 