import supabase from '../config/supabase';

export const deleteImageFromStorage = async (imageUrl) => {
  try {
    console.log('Attempting to delete image URL:', imageUrl);
    
    // Extract filename from URL - handle both formats of URLs
    let filePath;
    
    if (imageUrl.includes('/productimages/')) {
      // Extract just the filename from the full URL path
      filePath = imageUrl.split('/productimages/')[1];
    } else if (imageUrl.includes('productimages')) {
      // This is likely a Supabase storage URL with a different format
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      // Look for 'productimages' in the path and get everything after it
      for (let i = 0; i < pathParts.length; i++) {
        if (pathParts[i] === 'productimages' && i < pathParts.length - 1) {
          filePath = pathParts.slice(i + 1).join('/');
          break;
        }
      }
    }
    
    if (!filePath) {
      console.error('Could not extract file path from URL:', imageUrl);
      return { success: false, error: 'Invalid image URL' };
    }

    console.log('Attempting to delete file with path:', filePath);

    const { data, error } = await supabase.storage
      .from('productimages')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      return { success: false, error };
    }

    console.log('Successfully deleted image:', filePath);
    return { success: true, data };
  } catch (error) {
    console.error('Error in deleteImageFromStorage:', error);
    return { success: false, error };
  }
};

export const uploadSizeChartImage = async (file, brandName) => {
  try {
    if (!file || !brandName) {
      throw new Error('File and brand name are required');
    }
    
    // Generate a unique file name
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;
    
    // Create the path with the brand name folder
    const filePath = `${brandName}/${fileName}`;
    
    console.log('Uploading size chart image to:', filePath);
    
    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from('sizechart')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('Error uploading size chart:', error);
      throw error;
    }
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('sizechart')
      .getPublicUrl(filePath);
    
    return { 
      success: true, 
      url: publicUrlData.publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Error in uploadSizeChartImage:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to upload size chart image'
    };
  }
};

export const deleteSizeChartImage = async (imageUrl) => {
  try {
    console.log('Attempting to delete size chart image URL:', imageUrl);
    
    // Extract file path from URL
    let filePath;
    
    if (imageUrl.includes('/sizechart/')) {
      // Extract just the filename from the full URL path
      filePath = imageUrl.split('/sizechart/')[1];
    } else if (imageUrl.includes('sizechart')) {
      // This is likely a Supabase storage URL with a different format
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      // Look for 'sizechart' in the path and get everything after it
      for (let i = 0; i < pathParts.length; i++) {
        if (pathParts[i] === 'sizechart' && i < pathParts.length - 1) {
          filePath = pathParts.slice(i + 1).join('/');
          break;
        }
      }
    }
    
    if (!filePath) {
      console.error('Could not extract file path from URL:', imageUrl);
      return { success: false, error: 'Invalid image URL' };
    }

    console.log('Attempting to delete size chart file with path:', filePath);

    const { data, error } = await supabase.storage
      .from('sizechart')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting size chart image:', error);
      return { success: false, error };
    }

    console.log('Successfully deleted size chart image:', filePath);
    return { success: true, data };
  } catch (error) {
    console.error('Error in deleteSizeChartImage:', error);
    return { success: false, error };
  }
}; 