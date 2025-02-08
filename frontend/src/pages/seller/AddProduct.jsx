import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSellerAuth } from '../../context/SellerAuthContext';
import ProductPreview from '../../components/seller/ProductPreview';
import ImageUpload from '../../components/seller/ImageUpload';
import { supabase } from '../../config/supabaseClient';

const AddProduct = () => {
  const { seller } = useSellerAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    brand_name: seller?.brand_name || '',
    category: '',
    mrp: '',
    selling_price: '',
    sizes: [],
    colors: [],
    stock_quantity: '',
    material: '',
    style: '',
    images: [],
    shipping: {
      estimated_delivery: '',
      charges: ''
    },
    return_policy: ''
  });

  const categories = ['Clothing', 'Footwear', 'Accessories'];
  const availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const availableColors = ['Red', 'Blue', 'Black', 'White', 'Green'];
  const styleTypes = ['Casual', 'Formal', 'Sportswear', 'Ethnic', 'Party'];
  const deliveryTimes = ['2-4 Days', '5-7 Days', '7-10 Days'];
  const returnPolicies = ['No Return', '7 Days Return', '15 Days Return', '30 Days Return'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProductData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProductData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSizeToggle = (size) => {
    setProductData(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const handleColorToggle = (color) => {
    setProductData(prev => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color]
    }));
  };

  const handleImageUpload = (files) => {
    setProductData(prev => ({
      ...prev,
      images: [...prev.images, ...files].slice(0, 5)
    }));
  };

  const handleSubmit = async (e, isDraft = false) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, upload images to Supabase storage
      const imageUrls = [];
      for (const image of productData.images) {
        const fileName = `${Date.now()}-${image.name}`;
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(`products/${seller.id}/${fileName}`, image);

        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(`products/${seller.id}/${fileName}`);
        
        imageUrls.push(publicUrl);
      }

      // Then send product data with image URLs
      const response = await fetch('http://localhost:5011/api/seller/add-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${seller?.session?.access_token}`
        },
        body: JSON.stringify({
          ...productData,
          images: imageUrls,
          is_draft: isDraft,
          seller_id: seller?.id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add product');
      }

      navigate('/seller/products');
    } catch (error) {
      console.error('Error adding product:', error);
      // Add error handling UI here
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 gap-6 p-6">
      <div className="flex-grow max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Add a New Product</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Details */}
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
            <h2 className="text-lg font-semibold mb-4">Basic Details</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={productData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                required
                value={productData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  name="category"
                  required
                  value={productData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Style Type *
                </label>
                <select
                  name="style"
                  required
                  value={productData.style}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select Style</option>
                  {styleTypes.map(style => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
            <h2 className="text-lg font-semibold mb-4">Pricing</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MRP (₹) *
                </label>
                <input
                  type="number"
                  name="mrp"
                  required
                  min="0"
                  value={productData.mrp}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  name="selling_price"
                  required
                  min="0"
                  value={productData.selling_price}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
            <h2 className="text-lg font-semibold mb-4">Variants</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Sizes *
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleSizeToggle(size)}
                    className={`px-4 py-2 rounded-md border ${
                      productData.sizes.includes(size)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-gray-300 hover:border-indigo-600'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colors *
              </label>
              <div className="flex flex-wrap gap-2">
                {availableColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorToggle(color)}
                    className={`px-4 py-2 rounded-md border ${
                      productData.colors.includes(color)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-gray-300 hover:border-indigo-600'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                name="stock_quantity"
                required
                min="0"
                value={productData.stock_quantity}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          {/* Images */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Product Images</h2>
            <ImageUpload
              images={productData.images}
              onUpload={handleImageUpload}
              maxImages={5}
            />
          </div>

          {/* Shipping */}
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
            <h2 className="text-lg font-semibold mb-4">Shipping & Returns</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Delivery *
                </label>
                <select
                  name="shipping.estimated_delivery"
                  required
                  value={productData.shipping.estimated_delivery}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select Delivery Time</option>
                  {deliveryTimes.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping Charges (₹) *
                </label>
                <input
                  type="number"
                  name="shipping.charges"
                  required
                  min="0"
                  value={productData.shipping.charges}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Return Policy *
              </label>
              <select
                name="return_policy"
                required
                value={productData.return_policy}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select Return Policy</option>
                {returnPolicies.map(policy => (
                  <option key={policy} value={policy}>{policy}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Adding Product...' : 'Add Product'}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={(e) => handleSubmit(e, true)}
              className="flex-1 border border-indigo-600 text-indigo-600 py-2 px-4 rounded-md hover:bg-indigo-50 disabled:opacity-50"
            >
              Save as Draft
            </button>
          </div>
        </form>
      </div>

      {/* Preview Card */}
      <div className="w-80 flex-shrink-0">
        <div className="sticky top-6">
          <ProductPreview product={productData} />
        </div>
      </div>
    </div>
  );
};

export default AddProduct; 