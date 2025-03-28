import { deleteImageFromBucket } from '../utils/supabaseStorage.js'
import supabase from '../config/supabase.js';

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params
    
    // First get the product to access its images
    const product = await Product.findById(id)
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    // Delete images from Supabase bucket
    if (product.images && product.images.length > 0) {
      const deletePromises = product.images.map(imageUrl => {
        // Extract just the filename from the full URL
        // Example URL: https://zxefjghtlnmkhnwkdlej.supabase.co/storage/v1/object/public/product_images/filename.jpg
        const imagePath = imageUrl.split('product_images/')[1]
        console.log('Deleting image:', imagePath) // Add this for debugging
        return deleteImageFromBucket(imagePath)
      })

      await Promise.all(deletePromises)
    }

    // Delete the product from database
    await Product.findByIdAndDelete(id)

    res.status(200).json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error in deleteProduct:', error)
    res.status(500).json({ message: 'Error deleting product', error: error.message })
  }
}

/**
 * Get products with optional category filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getProducts = async (req, res) => {
  try {
    const { category } = req.query;
    console.log('Getting products with category:', category);
    
    // Start building the query
    let query = supabase.from('products').select('*, sellers(brand_name)');
    
    // Add category filter if provided
    if (category) {
      // First try with direct transformation (replacing hyphens with spaces)
      const formattedCategory = category
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      console.log('First attempt formatted category (with spaces):', formattedCategory);
      
      // Second attempt - preserve hyphens but capitalize
      const formattedCategoryWithHyphens = category
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('-');
      
      console.log('Second attempt formatted category (with hyphens):', formattedCategoryWithHyphens);
      
      // Use a simpler approach - check for either format
      // This approach works by using an "in" filter with an array of possible values
      query = query.in('category', [formattedCategory, formattedCategoryWithHyphens]);
    }
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
    
    // Ensure we're sending an array even if data is null or undefined
    const productsArray = Array.isArray(data) ? data : [];
    console.log(`Found ${productsArray.length} products`);
    
    return res.status(200).json(productsArray);
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}; 