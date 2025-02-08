import { useState } from 'react';
import { useSellerAuth } from '../../context/SellerAuthContext';
import supabase from '../../config/supabase';

const CATEGORIES = [
  'T-Shirts',
  'Shirts',
  'Jeans',
  'Trousers',
  'Dresses',
  'Jackets',
  'Sweaters',
  'Activewear',
];

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const COLORS = [
  'Red',
  'Blue',
  'Black',
  'White',
  'Green',
  'Yellow',
  'Purple',
  'Orange',
  'Grey',
];

const STYLE_TYPES = ['Casual', 'Formal', 'Sportswear', 'Ethnic', 'Party'];

const DELIVERY_TIMES = [
  '2-4 Days',
  '5-7 Days',
  '7-10 Days',
  '10-14 Days',
];

const RETURN_POLICIES = [
  'No Return',
  '7 Days Return',
  '15 Days Return',
  '30 Days Return',
];

const AddProduct = () => {
  const { seller } = useSellerAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  
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
  });

  const [previewImages, setPreviewImages] = useState([]);

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
    if (files.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(previews);

    try {
      setLoading(true);
      setError('');
      
      // Debug authentication state
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Current session:', session);
      console.log('Session error:', sessionError);
      console.log('Seller state:', seller);

      if (!session) {
        throw new Error('No active session found');
      }

      // Check if seller is authenticated
      if (!seller || !seller.id) {
        throw new Error('You must be logged in to upload images');
      }

      const uploadedUrls = [];

      for (const file of files) {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Each file must be less than 5MB');
        }

        // Create a unique file name
        const timestamp = new Date().getTime();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = file.name.split('.').pop();
        const fileName = `${timestamp}-${randomString}.${fileExtension}`;
        
        // Create the file path with seller ID and timestamp
        const filePath = `${seller.id}/${fileName}`;

        console.log('Attempting to upload file:', {
          filePath,
          fileSize: file.size,
          fileType: file.type,
          sellerId: seller.id
        });

        // Upload the file with explicit headers
        const { error: uploadError, data } = await supabase.storage
          .from('product_images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          });

        if (uploadError) {
          console.error('Upload error details:', uploadError);
          throw new Error(uploadError.message || 'Error uploading image');
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product_images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      setFormData({ ...formData, images: uploadedUrls });
      setSuccess('Images uploaded successfully');
    } catch (err) {
      console.error('Error details:', err);
      setError(err.message || 'Error uploading images');
      // Clear previews on error
      setPreviewImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const productData = {
        ...formData,
        seller_id: seller.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error: insertError } = await supabase
        .from('products')
        .insert([productData]);

      if (insertError) throw insertError;

      setSuccess('Product added successfully!');
      setFormData({
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
      });
      setPreviewImages([]);
    } catch (err) {
      setError('Error adding product: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Add a New Product</h1>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                  Colors
                </label>
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
                      <span className="ml-2">{color}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
              </div>
            </div>
          </div>

          {/* Shipping & Delivery */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Shipping & Delivery</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Estimated Delivery Time
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
            </div>
          </div>

          {/* Image Upload */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Product Images</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Images (Max 5)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              {previewImages.length > 0 && (
                <div className="grid grid-cols-5 gap-4">
                  {previewImages.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Adding Product...' : 'Add Product'}
            </button>
          </div>
        </form>

        {/* Live Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow sticky top-6">
            <h2 className="text-xl font-semibold mb-4">Product Preview</h2>
            <div className="space-y-4">
              {previewImages.length > 0 && (
                <img
                  src={previewImages[0]}
                  alt="Main Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <h3 className="text-lg font-medium">{formData.name || 'Product Name'}</h3>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-gray-500 line-through">₹{formData.mrp || '0'}</span>
                  <span className="text-2xl font-bold ml-2">₹{formData.selling_price || '0'}</span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {formData.description || 'Product description will appear here'}
              </div>
              {formData.sizes.length > 0 && (
                <div className="flex gap-2">
                  {formData.sizes.map((size) => (
                    <span
                      key={size}
                      className="px-2 py-1 bg-gray-100 rounded text-sm"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              )}
              {formData.colors.length > 0 && (
                <div className="flex gap-2">
                  {formData.colors.map((color) => (
                    <span
                      key={color}
                      className="px-2 py-1 bg-gray-100 rounded text-sm"
                    >
                      {color}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct; 