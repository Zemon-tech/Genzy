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
    
    // Generate a unique file name with timestamp to avoid cache issues
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;
    
    // Create the path with the brand name folder
    const filePath = `${brandName}/${fileName}`;
    
    // The bucket name in SQL is exactly 'sizechart' - make sure we use this precise name
    const bucketName = 'sizechart';
    
    // Log the bucket name being used
    console.log('Using bucket:', bucketName);
    console.log('Uploading size chart image to path:', filePath);
    
    // Upload to Supabase with cache control and forced upsert
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });
    
    if (error) {
      console.error('Error uploading size chart:', error);
      throw error;
    }
    
    console.log('Successfully uploaded file to storage:', data?.path);
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    console.log('Generated public URL:', publicUrlData?.publicUrl);
    
    // Log the URL that will be saved to the sellers table
    console.log('URL to save in database:', publicUrlData.publicUrl);
    
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
    if (!imageUrl) {
      console.error('Cannot delete: Image URL is null or empty');
      return { success: false, error: 'Image URL is required' };
    }
    
    console.log('Attempting to delete size chart image URL:', imageUrl);
    
    // The bucket name in SQL is exactly 'sizechart' - make sure we use this precise name
    const bucketName = 'sizechart';
    
    // Extract file path from URL
    let filePath;
    
    if (imageUrl.includes(`/${bucketName}/`)) {
      // Extract just the filename from the full URL path
      filePath = imageUrl.split(`/${bucketName}/`)[1];
    } else if (imageUrl.includes(bucketName)) {
      // This is likely a Supabase storage URL with a different format
      try {
        const url = new URL(imageUrl);
        const pathParts = url.pathname.split('/');
        // Look for 'sizechart' in the path and get everything after it
        for (let i = 0; i < pathParts.length; i++) {
          if (pathParts[i] === bucketName && i < pathParts.length - 1) {
            filePath = pathParts.slice(i + 1).join('/');
            break;
          }
        }
      } catch (urlError) {
        console.error('Error parsing URL:', urlError);
        throw new Error('Invalid image URL format');
      }
    }
    
    if (!filePath) {
      console.error('Could not extract file path from URL:', imageUrl);
      return { success: false, error: 'Invalid image URL' };
    }

    console.log('Attempting to delete size chart file with path:', filePath);

    // Use a forceful delete operation
    const { data, error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting size chart image from storage:', error);
      return { success: false, error };
    }

    console.log('Successfully deleted size chart image from storage:', filePath);
    return { success: true, data };
  } catch (error) {
    console.error('Error in deleteSizeChartImage:', error);
    return { success: false, error };
  }
}; 