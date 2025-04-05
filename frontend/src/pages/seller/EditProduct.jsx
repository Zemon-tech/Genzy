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
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [sizeChartImages, setSizeChartImages] = useState({
    image1: null,
    image2: null,
    image3: null
  });
  const [loadingSizeCharts, setLoadingSizeCharts] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mrp: '',
    selling_price: '',
    category: '',
    sizes: [],
    colors: [],
    stock_quantity: '',
    style_type: '',
    shipping_charges: '',
    estimated_delivery: '',
    return_policy: '',
    images: [],
    size_chart: '',
  });

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
          setFormData(data);
          setPreviewImages(data.images);
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
      const array = formData[name];
      if (checked) {
        setFormData({ ...formData, [name]: [...array, value] });
      } else {
        setFormData({
          ...formData,
          [name]: array.filter((item) => item !== value),
        });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    const newImages = [];
    const newPreviewImages = [];

    for (const file of files) {
      try {
        // Sanitize filename: remove special characters and spaces
        const timestamp = Date.now();
        const sanitizedName = file.name
          .replace(/[^a-zA-Z0-9.]/g, '_') // Replace special chars with underscore
          .replace(/\s+/g, '_'); // Replace spaces with underscore
        const fileName = `${timestamp}_${sanitizedName}`;

        console.log('Uploading file with name:', fileName);

        const { data, error } = await supabase.storage
          .from('productimages')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true, // Change to true to overwrite if exists
            contentType: file.type // Explicitly set content type
          });

        if (error) {
          console.error('Upload error:', error);
          throw error;
        }

        console.log('Upload successful:', data);

        // Get the public URL for the image
        const { data: publicURLData } = supabase
          .storage
          .from('productimages')
          .getPublicUrl(data.path);

        console.log('Generated public URL:', publicURLData);

        const imageUrl = publicURLData.publicUrl;
        newImages.push(imageUrl);
        newPreviewImages.push(URL.createObjectURL(file));
      } catch (error) {
        console.error('Error uploading image:', error);
        setError('Error uploading image: ' + (error.message || 'Unknown error'));
      }
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
    setPreviewImages(prev => [...prev, ...newPreviewImages]);
  };

  const handleDeleteImage = (indexToDelete) => {
    const imageUrl = formData.images[indexToDelete];
    
    if (imageUrl) {
      setImagesToDelete(prev => [...prev, imageUrl]);
    }

    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToDelete)
    }));
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
      
      console.log('Updating product with ID:', productId);

      if (!seller || !seller.id) {
        setError('You must be logged in as a seller to update products');
        setLoading(false);
        return;
      }

      // Make sure seller_id is set correctly and as a string
      const updatedData = {
        ...formData,
        seller_id: String(seller.id), // Ensure seller_id is a string
        updated_at: new Date().toISOString()
      };

      console.log('Updating product with data:', {
        id: productId,
        sellerId: updatedData.seller_id,
        name: updatedData.name
      });

      // Don't filter by seller_id in the query, let RLS handle that
      const { data, error: updateError } = await supabase
        .from('products')
        .update(updatedData)
        .eq('id', productId)
        .select();

      if (updateError) {
        console.error('Error updating product:', updateError);
        throw updateError;
      }

      console.log('Update response:', data);
      
      if (!data || data.length === 0) {
        console.error('Product not updated, possibly due to RLS or it doesn\'t exist');
        throw new Error('Failed to update product. You may not have permission to edit this product.');
      }

      if (imagesToDelete.length > 0) {
        console.log('Deleting old images:', imagesToDelete);
        await deleteImagesFromStorage(imagesToDelete);
      }

      setSuccess('Product updated successfully!');
      setImagesToDelete([]);
      setTimeout(() => navigate('/seller/products'), 1500);
    } catch (err) {
      console.error('Error in handleSubmit:', err);
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

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              </div>

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
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Variants */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Variants</h3>
              
              {/* Sizes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Sizes
                </label>
                <div className="flex flex-wrap gap-3">
                  {SIZES.map((size) => (
                    <label key={size} className="flex items-center">
                      <input
                        type="checkbox"
                        name="sizes"
                        value={size}
                        checked={formData.sizes.includes(size)}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2">{size}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Colors
                </label>
                <div className="flex flex-wrap gap-3">
                  {COLORS.map((color) => (
                    <label key={color} className="flex items-center">
                      <input
                        type="checkbox"
                        name="colors"
                        value={color}
                        checked={formData.colors.includes(color)}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2">{color}</span>
                    </label>
                  ))}
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
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Product Preview</h2>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {previewImages.map((url, index) => (
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
                  </div>
                ))}
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
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? 'Updating Product...' : 'Update Product'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct; 