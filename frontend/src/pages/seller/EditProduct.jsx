import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSellerAuth } from '../../context/SellerAuthContext';
import supabase from '../../config/supabase';
import { calculateDiscount } from '../../utils/helpers';
import { 
  CATEGORIES, 
  SIZES, 
  COLORS, 
  STYLE_TYPES, 
  DELIVERY_TIMES, 
  RETURN_POLICIES 
} from '../../utils/constants';

const EditProduct = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { seller } = useSellerAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewImages, setPreviewImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [sizeChartImages, setSizeChartImages] = useState({
    image1: null,
    image2: null,
    image3: null
  });
  const [loadingSizeCharts, setLoadingSizeCharts] = useState(true);
  const [nameWordCount, setNameWordCount] = useState(0);
  const [descriptionWordCount, setDescriptionWordCount] = useState(0);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mrp: '',
    selling_price: '',
    category: '',
    sizes: [],
    colors: [],
    has_multiple_colors: false,
    stock_quantity: '',
    style_type: '',
    shipping_charges: '',
    estimated_delivery: '',
    return_policy: '',
    images: [],
    size_chart: '',
  });

  // Add a separate state for hasMultipleColors
  const [hasMultipleColors, setHasMultipleColors] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (error) throw error;
        if (data) {
          // Calculate if the product has multiple colors defined
          const hasMultipleColors = data.colors && data.colors.length > 0;
          
          // Store hasMultipleColors in client-side state but don't add it to formData
          setFormData(data);
          setHasMultipleColors(hasMultipleColors);
          
          setPreviewImages(data.images);
          
          // Initialize word counts
          if (data.name) {
            setNameWordCount(data.name.trim().split(/\s+/).length);
          }
          
          if (data.description) {
            setDescriptionWordCount(data.description.trim().split(/\s+/).length);
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Failed to fetch product details');
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  // Fetch size chart images for this seller
  useEffect(() => {
    const fetchSizeChartImages = async () => {
      if (!seller) return;
      
      try {
        setLoadingSizeCharts(true);
        const { data, error } = await supabase
          .from('sellers')
          .select('size_chart_image1_url, size_chart_image2_url, size_chart_image3_url')
          .eq('id', seller.id)
          .single();
        
        if (error) throw error;
        
        setSizeChartImages({
          image1: data.size_chart_image1_url || null,
          image2: data.size_chart_image2_url || null,
          image3: data.size_chart_image3_url || null
        });
      } catch (error) {
        console.error('Error fetching size chart images:', error);
      } finally {
        setLoadingSizeCharts(false);
      }
    };
    
    fetchSizeChartImages();
  }, [seller]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      if (name === 'has_multiple_colors') {
        // Handle has_multiple_colors separately
        setHasMultipleColors(checked);
        // If unchecking, clear colors array
        if (!checked) {
          setFormData(prev => ({ ...prev, colors: [] }));
        }
      } else {
        const array = formData[name];
        if (checked) {
          setFormData({ ...formData, [name]: [...array, value] });
        } else {
          setFormData({
            ...formData,
            [name]: array.filter((item) => item !== value),
          });
        }
      }
    } else if (name === 'name') {
      // Count words in name and limit to 7 words
      const words = value.trim().split(/\s+/);
      const wordCount = words.length;
      setNameWordCount(wordCount);
      
      if (wordCount <= 7) {
        setFormData({ ...formData, [name]: value });
      }
    } else if (name === 'description') {
      // Count words in description and limit to 99 words
      const words = value.trim().split(/\s+/);
      const wordCount = words.length;
      setDescriptionWordCount(wordCount);
      
      if (wordCount <= 99) {
        setFormData({ ...formData, [name]: value });
      }
    } else if (name === 'selling_price') {
      // Ensure selling price is not greater than MRP
      const sellingPrice = parseFloat(value);
      const mrp = parseFloat(formData.mrp);
      
      if (!mrp || sellingPrice <= mrp) {
        setFormData({ ...formData, [name]: value });
      } else {
        setError('Selling price cannot be greater than MRP');
      }
    } else {
      setFormData({ ...formData, [name]: value });
      
      // If MRP is updated, check if selling price needs to be adjusted
      if (name === 'mrp' && formData.selling_price) {
        const newMrp = parseFloat(value);
        const currentSellingPrice = parseFloat(formData.selling_price);
        
        if (currentSellingPrice > newMrp) {
          setFormData(prev => ({ ...prev, selling_price: value }));
        }
      }
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newPreviewImages = [];
    const validFiles = [];

    // Validate file types and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 1.46 * 1024 * 1024; // 1.46MB

    for (const file of files) {
      // Log file information for debugging
      console.log('File details:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        setError(`File "${file.name}" is not supported. Please upload JPEG, JPG or PNG images only.`);
        continue;
      }

      // Validate file size
      if (file.size > maxSize) {
        setError(`File "${file.name}" is too large. Maximum size is 1.46MB.`);
        continue;
      }

      // Store valid files for later upload
      validFiles.push(file);
      newPreviewImages.push(URL.createObjectURL(file));
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      setPreviewImages(prev => [...prev, ...newPreviewImages.map(url => ({ isNew: true, url }))]);
      setError(''); // Clear error if at least one image was valid
      setSuccess(`${validFiles.length} files ready for upload when the product is saved.`);
    }
  };

  const handleDeleteImage = (indexToDelete) => {
    const image = previewImages[indexToDelete];
    
    // If it's an existing image (has a URL from the server)
    if (typeof image === 'string') {
      setImagesToDelete(prev => [...prev, image]);
      
      // Remove from formData.images
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, index) => index !== indexToDelete)
      }));
    } else if (image && image.isNew) {
      // If it's a newly added image (has a preview URL)
      // Remove from selectedFiles
      setSelectedFiles(prev => prev.filter((_, index) => index !== indexToDelete));
    }
    
    // Remove from preview images
    setPreviewImages(prev => prev.filter((_, index) => index !== indexToDelete));
  };

  const deleteImagesFromStorage = async (imageUrls) => {
    for (const url of imageUrls) {
      try {
        const path = url.split('/productimages/')[1];
        if (path) {
          const { error } = await supabase.storage
            .from('productimages')
            .remove([path]);
          
          if (error) {
            console.error('Error deleting image:', error);
          }
        }
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Validate the selling price against MRP
      if (parseFloat(formData.selling_price) > parseFloat(formData.mrp)) {
        setError('Selling price cannot be greater than MRP');
        return;
      }

      // Validate word counts
      const nameWords = formData.name.trim().split(/\s+/).length;
      const descriptionWords = formData.description.trim().split(/\s+/).length;
      
      if (nameWords > 7) {
        setError('Product name cannot exceed 7 words');
        return;
      }
      
      if (descriptionWords > 99) {
        setError('Product description cannot exceed 99 words');
        return;
      }

      // Delete any images that were marked for deletion
      if (imagesToDelete.length > 0) {
        await deleteImagesFromStorage(imagesToDelete);
      }
      
      // Upload any new images that were selected
      const uploadedImageUrls = [];
      
      for (const file of selectedFiles) {
        // Sanitize filename: remove special characters and spaces
        const timestamp = Date.now();
        const sanitizedName = file.name
          .replace(/[^a-zA-Z0-9.]/g, '_')
          .replace(/\s+/g, '_');
        const fileName = `${timestamp}_${sanitizedName}`;

        console.log('Uploading file with name:', fileName);

        // Upload the file
        const { data, error } = await supabase.storage
          .from('productimages')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type
          });

        if (error) {
          console.error('Supabase upload error:', error);
          throw error;
        }

        console.log('Upload successful:', data);

        // Get the public URL for the image
        const { data: publicURLData } = supabase
          .storage
          .from('productimages')
          .getPublicUrl(data.path);

        console.log('Generated public URL:', publicURLData);
        uploadedImageUrls.push(publicURLData.publicUrl);
      }
      
      // Create updated product data
      const productData = {
        ...formData,
        // Combine existing images with new uploaded images
        images: [...formData.images, ...uploadedImageUrls],
        updated_at: new Date().toISOString(),
      };

      // Remove has_multiple_colors as it's not a database field
      delete productData.has_multiple_colors;
      
      console.log('Updating product with data:', productData);

      const { error: updateError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', productId);

      if (updateError) {
        throw updateError;
      }

      setSuccess('Product updated successfully!');
      // Navigate back to products page after successful update
      setTimeout(() => navigate('/seller/products'), 1500);
    } catch (err) {
      console.error('Error updating product:', err);
      setError('Error updating product: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-y-auto flex-1">
      <div className="max-w-[1200px] mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Edit Product</h1>
          <button
            onClick={() => navigate('/seller/products')}
            className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-500 p-4 rounded-md mb-6">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            {/* Basic Details */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Basic Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">Enter a clear, descriptive name</span>
                    <span className={`text-xs ${nameWordCount > 7 ? 'text-red-500' : 'text-gray-500'}`}>
                      {nameWordCount}/7 words
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">Describe your product features, materials, etc.</span>
                    <span className={`text-xs ${descriptionWordCount > 99 ? 'text-red-500' : 'text-gray-500'}`}>
                      {descriptionWordCount}/99 words
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      MRP
                    </label>
                    <input
                      type="number"
                      name="mrp"
                      value={formData.mrp}
                      onChange={handleChange}
                      required
                      min="0"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Selling Price
                    </label>
                    <input
                      type="number"
                      name="selling_price"
                      value={formData.selling_price}
                      onChange={handleChange}
                      required
                      min="0"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-gray-500 mt-1">Must be less than or equal to MRP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Product Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Select Category</option>
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Sizes
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {SIZES.map((size) => (
                      <label key={size} className="inline-flex items-center">
                        <input
                          type="checkbox"
                          name="sizes"
                          value={size}
                          checked={formData.sizes.includes(size)}
                          onChange={handleChange}
                          className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <span className="ml-2">{size}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Colors
                  </label>
                  <div className="mb-2 flex items-center">
                    <input
                      type="checkbox"
                      id="has_multiple_colors"
                      name="has_multiple_colors"
                      checked={hasMultipleColors}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <label htmlFor="has_multiple_colors" className="ml-2 text-sm text-gray-700">
                      This product is available in multiple colors
                    </label>
                  </div>
                  
                  {hasMultipleColors && (
                    <div className="flex flex-wrap gap-4">
                      {COLORS.map((color) => (
                        <label key={color} className="inline-flex items-center">
                          <input
                            type="checkbox"
                            name="colors"
                            value={color}
                            checked={formData.colors.includes(color)}
                            onChange={handleChange}
                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                          <span className="ml-2 flex items-center">
                            <span 
                              className="inline-block w-4 h-4 rounded-full mr-1"
                              style={{ backgroundColor: color.toLowerCase() }}
                            />
                            {color}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  required
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Style Type
                </label>
                <select
                  name="style_type"
                  value={formData.style_type}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select Style</option>
                  {STYLE_TYPES.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Estimated Delivery
                </label>
                <select
                  name="estimated_delivery"
                  value={formData.estimated_delivery}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select Delivery Time</option>
                  {DELIVERY_TIMES.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Return Policy
                </label>
                <select
                  name="return_policy"
                  value={formData.return_policy}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select Return Policy</option>
                  {RETURN_POLICIES.map((policy) => (
                    <option key={policy} value={policy}>
                      {policy}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Shipping Charges
                </label>
                <input
                  type="number"
                  name="shipping_charges"
                  value={formData.shipping_charges}
                  onChange={handleChange}
                  required
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Product Images
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Images will be uploaded when product is saved
                </p>
                {selectedFiles.length > 0 && (
                  <div className="text-sm text-gray-600 mt-2">
                    {selectedFiles.length} new {selectedFiles.length === 1 ? 'image' : 'images'} selected
                  </div>
                )}
              </div>
            </div>

            {/* Size Chart Selection */}
            <div>
              <h3 className="text-lg font-medium mb-4">Size Chart</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select a Size Chart for this Product
                </label>
                {loadingSizeCharts ? (
                  <div className="h-10 w-full bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <>
                    <select
                      name="size_chart"
                      value={formData.size_chart || ''}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">No Size Chart</option>
                      {sizeChartImages.image1 && (
                        <option value={sizeChartImages.image1}>Size Chart 1</option>
                      )}
                      {sizeChartImages.image2 && (
                        <option value={sizeChartImages.image2}>Size Chart 2</option>
                      )}
                      {sizeChartImages.image3 && (
                        <option value={sizeChartImages.image3}>Size Chart 3</option>
                      )}
                    </select>
                    
                    {Object.values(sizeChartImages).every(chart => chart === null) && (
                      <p className="mt-2 text-sm text-amber-600">
                        You haven&apos;t uploaded any size charts yet. 
                        <button 
                          type="button"
                          onClick={() => navigate('/seller/size-chart')}
                          className="ml-1 text-indigo-600 hover:text-indigo-800 underline"
                        >
                          Manage Size Charts
                        </button>
                      </p>
                    )}
                    
                    {/* Preview selected size chart */}
                    {formData.size_chart && (
                      <div className="mt-3 border rounded-md p-3">
                        <p className="text-sm font-medium mb-2">Selected Size Chart Preview:</p>
                        <img 
                          src={formData.size_chart} 
                          alt="Selected Size Chart"
                          className="max-h-48 mx-auto"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Preview Section */}
            <div className="bg-white p-6 rounded-lg shadow mt-4">
              <h2 className="text-xl font-semibold mb-4">Product Preview</h2>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {previewImages.map((item, index) => {
                  const url = typeof item === 'string' ? item : item.url;
                  return (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        ✕
                      </button>
                      {typeof item !== 'string' && item.isNew && (
                        <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                          New
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">{formData.name || 'Product Name'}</h3>
                <p className="text-sm text-gray-600">{formData.description || 'Product Description'}</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold">₹{formData.selling_price || '0'}</span>
                  <span className="text-gray-500 line-through">₹{formData.mrp || '0'}</span>
                  {calculateDiscount(formData.mrp, formData.selling_price) > 0 && (
                    <span className="text-green-600 text-sm">
                      ({calculateDiscount(formData.mrp, formData.selling_price)}% off)
                    </span>
                  )}
                </div>
                {formData.sizes.length > 0 && (
                  <div className="text-sm">
                    <span className="text-gray-600">Sizes: </span>
                    {formData.sizes.join(', ')}
                  </div>
                )}
                {formData.colors.length > 0 && (
                  <div className="text-sm">
                    <span className="text-gray-600">Colors: </span>
                    {formData.colors.join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className={`w-full py-3 px-6 rounded-md text-white font-medium ${
                  loading ? 'bg-gray-400' : 'bg-black hover:bg-gray-800'
                }`}
              >
                {loading ? 'Updating...' : 'Update Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProduct; 