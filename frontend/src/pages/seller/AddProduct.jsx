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
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Current session:', session);
      
      if (!session) {
        throw new Error('No active session found');
      }

      if (!seller || !seller.id) {
        throw new Error('You must be logged in to upload images');
      }

      const uploadedUrls = [];

      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Each file must be less than 5MB');
        }

        // Enhanced unique file name generation
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15) + 
                           Math.random().toString(36).substring(2, 15);
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        // Add a unique identifier based on file content
        const uniqueIdentifier = await generateUniqueIdentifier(file);
        const fileName = `${timestamp}-${randomString}-${uniqueIdentifier}.${fileExtension}`;
        
        // Create the file path with seller ID and timestamp
        const filePath = `${seller.id}/${fileName}`;

        console.log('Attempting to upload file:', {
          filePath,
          fileSize: file.size,
          fileType: file.type,
          sellerId: seller.id
        });

        // Upload with upsert: true to overwrite if file exists
        const { error: uploadError, data } = await supabase.storage
          .from('product_images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true, // Changed to true to overwrite existing files
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
      setPreviewImages([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to generate a unique identifier based on file content
  const generateUniqueIdentifier = async (file) => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.slice(0, 8); // Take first 8 characters of hash
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
    <div className="h-screen overflow-y-auto flex-1">
      <div className="max-w-[1200px] mx-auto p-8">
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

          {/* Image Preview Section */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow sticky top-8">
              <h2 className="text-xl font-semibold mb-4">Product Images</h2>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer block text-center"
                  >
                    <div className="space-y-2">
                      <div className="mx-auto h-12 w-12 text-gray-400">
                        {/* You can add an upload icon here */}
                      </div>
                      <div className="text-sm text-gray-600">
                        Click to upload images (max 5)
                      </div>
                    </div>
                  </label>
                </div>

                {/* Image Previews */}
                <div className="grid grid-cols-2 gap-4">
                  {previewImages.map((url, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden"
                    >
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct; 