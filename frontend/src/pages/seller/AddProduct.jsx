import { useState, useEffect } from 'react';
import { useSellerAuth } from '../../context/SellerAuthContext';
import { useNavigate } from 'react-router-dom';
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

const AddProduct = () => {
  const { seller } = useSellerAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    gender: 'unisex',
    size_chart: '',
  });

  // Separate state for has_multiple_colors since it's not in the database
  const [hasMultipleColors, setHasMultipleColors] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [nameWordCount, setNameWordCount] = useState(0);
  const [descriptionWordCount, setDescriptionWordCount] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);

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
        // Handle has_multiple_colors as client-side state
        setHasMultipleColors(checked);
        // If unchecking, clear the colors array in formData
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
      setPreviewImages(prev => [...prev, ...newPreviewImages]);
      setError(''); // Clear error if at least one image was valid
      setSuccess(`${validFiles.length} files ready for upload when the product is saved.`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setError('Please select at least one image');
      return;
    }

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

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      console.log('Current seller:', seller);

      if (!seller || !seller.id) {
        setError('You must be logged in as a seller to add products');
        setLoading(false);
        return;
      }

      // First, upload all images
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

      // Create a copy of formData including the uploaded image URLs
      const productData = {
        ...formData,
        images: uploadedImageUrls, // Use the newly uploaded image URLs
        seller_id: String(seller.id),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Don't include has_multiple_colors in the data sent to the server
      delete productData.has_multiple_colors;

      console.log('Adding product with data:', {
        ...productData,
        description: productData.description.substring(0, 20) + '...' // Truncate for logging
      });

      const { data, error: insertError } = await supabase
        .from('products')
        .insert([productData])
        .select();

      if (insertError) {
        console.error('Product insertion error:', insertError);
        throw insertError;
      }

      console.log('Product added successfully:', data);
      setSuccess('Product added successfully!');
      resetForm();
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError('Error adding product: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
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
      gender: 'unisex',
      size_chart: '',
    });
    setHasMultipleColors(false);
    setPreviewImages([]);
    setSelectedFiles([]);
    setNameWordCount(0);
    setDescriptionWordCount(0);
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
                    <span className={`text-xs ${descriptionWordCount >99 ? 'text-red-500' : 'text-gray-500'}`}>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="unisex">Unisex</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Size Chart Selection */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Size Chart</h2>
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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

          {/* Right Column - Preview and Images */}
          <div className="lg:col-span-1">
            {/* Product Preview */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="text-xl font-semibold mb-4">Product Preview</h2>
              <div className="border rounded-lg p-4">
                <div className="aspect-square w-full max-w-[200px] mb-4 overflow-hidden rounded-lg">
                  {previewImages.length > 0 ? (
                    <img
                      src={previewImages[0]}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
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
            </div>

            {/* Image Upload Section */}
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
                        Click to select images (max 5)
                      </div>
                      <p className="text-xs text-gray-500">
                        Images will be uploaded when product is submitted
                      </p>
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
                      <button
                        type="button"
                        onClick={() => {
                          // Remove the file and preview
                          setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                          setPreviewImages(prev => prev.filter((_, i) => i !== index));
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                {selectedFiles.length > 0 && (
                  <div className="text-sm text-gray-600 mt-2">
                    {selectedFiles.length} {selectedFiles.length === 1 ? 'image' : 'images'} selected (will be uploaded when saved)
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct; 