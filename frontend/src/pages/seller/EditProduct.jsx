import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSellerAuth } from '../../context/SellerAuthContext';
import supabase from '../../config/supabase';
import { calculateDiscount } from '../../utils/helpers';

const CATEGORIES = [
  'T-Shirts',
  'Shirts',
  'Jeans',
  'Trousers',
  'Dresses',
  'Jackets',
  'Sweaters',
  'Co-ords',
  'Sweatshirts',
  'Activewear',
];

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const COLORS = [
  'Red', 'Blue', 'Black', 'White', 'Green',
  'Yellow', 'Purple', 'Orange', 'Grey',
];
const STYLE_TYPES = ['Casual', 'Formal', 'Sportswear', 'Ethnic', 'Party'];
const DELIVERY_TIMES = ['2-4 Days', '5-7 Days', '7-10 Days', '10-14 Days'];
const RETURN_POLICIES = ['No Return', '7 Days Return', '15 Days Return', '30 Days Return'];

const EditProduct = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { seller } = useSellerAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewImages, setPreviewImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  
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
        const { data, error } = await supabase.storage
          .from('product_images')
          .upload(`${Date.now()}-${file.name}`, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        const imageUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product_images/${data.path}`;
        newImages.push(imageUrl);
        newPreviewImages.push(URL.createObjectURL(file));
      } catch (error) {
        console.error('Error uploading image:', error);
        setError('Error uploading image. Please try again.');
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
        const path = url.split('/product_images/')[1];
        if (path) {
          const { error } = await supabase.storage
            .from('product_images')
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

      const { error: updateError } = await supabase
        .from('products')
        .update(formData)
        .eq('id', productId);

      if (updateError) throw updateError;

      if (imagesToDelete.length > 0) {
        await deleteImagesFromStorage(imagesToDelete);
      }

      setSuccess('Product updated successfully!');
      setImagesToDelete([]);
      setTimeout(() => navigate('/seller/products'), 1500);
    } catch (err) {
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