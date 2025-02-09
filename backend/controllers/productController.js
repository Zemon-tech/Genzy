import { deleteImageFromBucket } from '../utils/supabaseStorage.js'

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