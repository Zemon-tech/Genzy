import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSellerAuth } from '../../context/SellerAuthContext';
import supabase from '../../config/supabase';
import { uploadSizeChartImage, deleteSizeChartImage } from '../../utils/storage';
import toast from 'react-hot-toast';

const SizeChart = () => {
  const navigate = useNavigate();
  const { seller } = useSellerAuth();
  const [images, setImages] = useState([]);
  const [imageUrls, setImageUrls] = useState({
    image1: null,
    image2: null,
    image3: null
  });
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  
  // Fetch existing size chart images on component mount
  useEffect(() => {
    if (!seller) {
      navigate('/seller/login');
      return;
    }
    
    const fetchImages = async () => {
      try {
        setIsLoadingImages(true);
        const { data, error } = await supabase
          .from('sellers')
          .select('size_chart_image1_url, size_chart_image2_url, size_chart_image3_url')
          .eq('id', seller.id)
          .single();
        
        if (error) throw error;
        
        setImageUrls({
          image1: data.size_chart_image1_url || null,
          image2: data.size_chart_image2_url || null,
          image3: data.size_chart_image3_url || null
        });
      } catch (error) {
        console.error('Error fetching size chart images:', error);
        toast.error('Failed to load existing size charts');
      } finally {
        setIsLoadingImages(false);
      }
    };
    
    fetchImages();
  }, [seller, navigate]);
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  // Count existing images
  const countExistingImages = () => {
    return Object.values(imageUrls).filter(url => url !== null).length;
  };
  
  const validateFiles = (files) => {
    const existingCount = countExistingImages();
    const totalAfterUpload = existingCount + files.length;
    
    // Check if the total would exceed 3 images
    if (totalAfterUpload > 3) {
      toast.error(`You can only have up to 3 size chart images. Please delete existing images first.`);
      return false;
    }
    
    const validFiles = [];
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!validTypes.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}. Only JPG, PNG, and WEBP are allowed.`);
        continue;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(`File too large: ${file.name}. Maximum size is 5MB.`);
        continue;
      }
      
      validFiles.push(file);
    }
    
    return validFiles;
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = validateFiles(Array.from(e.dataTransfer.files));
      if (validFiles && validFiles.length > 0) {
        setImages(validFiles);
      }
    }
  };
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = validateFiles(Array.from(e.target.files));
      if (validFiles && validFiles.length > 0) {
        setImages(validFiles);
      }
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!seller || !seller.brand_name) {
      toast.error('Seller information not available');
      return;
    }
    
    if (images.length === 0) {
      toast.error('Please select at least one image to upload');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Start with current image URLs
      const newImageUrls = { ...imageUrls };
      
      // Find empty slots for new images
      const slots = [];
      if (!newImageUrls.image1) slots.push('image1');
      if (!newImageUrls.image2) slots.push('image2');
      if (!newImageUrls.image3) slots.push('image3');
      
      // If there aren't enough slots, use the first available slots
      if (slots.length < images.length) {
        if (!slots.includes('image1')) slots.unshift('image1');
        if (slots.length < images.length && !slots.includes('image2')) slots.unshift('image2');
        if (slots.length < images.length && !slots.includes('image3')) slots.unshift('image3');
      }
      
      // Upload each image and assign to available slots
      for (let i = 0; i < images.length; i++) {
        const slot = slots[i];
        if (!slot) break; // This shouldn't happen due to our validation
        
        const result = await uploadSizeChartImage(images[i], seller.brand_name);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to upload image');
        }
        
        newImageUrls[slot] = result.url;
      }
      
      // Update seller record with the new image URLs
      const { error } = await supabase
        .from('sellers')
        .update({
          size_chart_image1_url: newImageUrls.image1,
          size_chart_image2_url: newImageUrls.image2,
          size_chart_image3_url: newImageUrls.image3
        })
        .eq('id', seller.id);
      
      if (error) throw error;
      
      setImageUrls(newImageUrls);
      setImages([]);
      toast.success('Size chart images uploaded successfully');
    } catch (error) {
      console.error('Error uploading size chart images:', error);
      toast.error('Failed to upload size chart images');
    } finally {
      setIsLoading(false);
    }
  };
  
  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };
  
  const deleteExistingImage = async (imageKey) => {
    if (!seller || !seller.id) {
      toast.error('Seller information not available');
      return;
    }
    
    if (!imageUrls[imageKey]) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Delete from Supabase storage
      const result = await deleteSizeChartImage(imageUrls[imageKey]);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete image');
      }
      
      // Update the seller record to remove the image URL
      const updateData = {};
      updateData[`size_chart_image${imageKey.slice(-1)}_url`] = null;
      
      const { error } = await supabase
        .from('sellers')
        .update(updateData)
        .eq('id', seller.id);
      
      if (error) throw error;
      
      // Update local state
      const newImageUrls = { ...imageUrls };
      newImageUrls[imageKey] = null;
      setImageUrls(newImageUrls);
      
      toast.success('Size chart image deleted successfully');
    } catch (error) {
      console.error('Error deleting size chart image:', error);
      toast.error('Failed to delete size chart image');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to check if uploads are disabled
  const isUploadDisabled = () => {
    const existingCount = countExistingImages();
    return existingCount >= 3;
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Size Chart</h1>
      <p className="text-gray-600 mb-6">Upload up to 3 size chart images for your brand</p>
      
      {/* Current size chart images */}
      <div className="mb-8">
        <h2 className="text-xl font-medium mb-4">Current Size Charts</h2>
        {isLoadingImages ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">Loading images...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((num) => {
              const imageKey = `image${num}`;
              return (
                <div key={imageKey} className="border rounded-lg p-4 flex flex-col items-center">
                  <div className="h-48 w-full flex items-center justify-center bg-gray-100 rounded-lg mb-3">
                    {imageUrls[imageKey] ? (
                      <img 
                        src={imageUrls[imageKey]} 
                        alt={`Size Chart ${num}`}
                        className="h-full object-contain"
                      />
                    ) : (
                      <p className="text-gray-400">No image uploaded</p>
                    )}
                  </div>
                  {imageUrls[imageKey] && (
                    <button
                      onClick={() => deleteExistingImage(imageKey)}
                      disabled={isLoading}
                      className="text-red-500 hover:text-red-700 mt-2 disabled:opacity-50"
                    >
                      Delete Image
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Upload form */}
      <form onSubmit={handleSubmit}>
        <h2 className="text-xl font-medium mb-4">Upload New Size Charts</h2>
        
        {isUploadDisabled() && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700">
            <p>You already have 3 size chart images. Please delete existing images to upload new ones.</p>
          </div>
        )}
        
        {/* Drag & drop area */}
        <div 
          className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center h-60 transition-colors
            ${isUploadDisabled() ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : 
              dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}`}
          onDragEnter={!isUploadDisabled() ? handleDrag : undefined}
          onDragOver={!isUploadDisabled() ? handleDrag : undefined}
          onDragLeave={!isUploadDisabled() ? handleDrag : undefined}
          onDrop={!isUploadDisabled() ? handleDrop : undefined}
        >
          <div className="text-center">
            <p className="mb-2">Drag and drop your size chart images here</p>
            <p className="text-sm text-gray-500 mb-4">JPG, PNG, or WEBP (max 5MB) - Up to 3 images total</p>
            <label className={`inline-block py-2 px-4 rounded-md cursor-pointer ${
              isUploadDisabled() 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}>
              Select Images
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
                disabled={isLoading || isUploadDisabled()}
              />
            </label>
          </div>
        </div>
        
        {/* Selected images preview */}
        {images.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Selected Images</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {images.map((file, index) => (
                <div key={index} className="border rounded-lg p-3 flex flex-col">
                  <div className="h-40 mb-2 flex items-center justify-center bg-gray-100 rounded">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={`Preview ${index + 1}`}
                      className="h-full object-contain"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm truncate max-w-[180px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Submit button */}
        <div className="mt-6">
          <button
            type="submit"
            disabled={isLoading || images.length === 0 || isUploadDisabled()}
            className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Uploading...' : 'Upload Size Charts'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SizeChart; 