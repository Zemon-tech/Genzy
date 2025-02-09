import supabase from '../config/supabase';

export const deleteImageFromStorage = async (imageUrl) => {
  try {
    // Extract filename from URL
    const fileName = imageUrl.split('/').pop();
    
    if (!fileName) {
      console.error('Could not extract filename from URL:', imageUrl);
      return null;
    }

    console.log('Attempting to delete file:', fileName);

    const { data, error } = await supabase.storage
      .from('product_images')
      .remove([fileName]);

    if (error) {
      console.error('Error deleting image:', error);
      return { success: false, error };
    }

    console.log('Successfully deleted image:', fileName);
    return { success: true, data };
  } catch (error) {
    console.error('Error in deleteImageFromStorage:', error);
    return { success: false, error };
  }
}; 