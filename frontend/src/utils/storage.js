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