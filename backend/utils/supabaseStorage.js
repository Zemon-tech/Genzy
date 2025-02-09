import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const deleteImageFromBucket = async (imagePath) => {
  try {
    const { data, error } = await supabase
      .storage
      .from('product_images') // Changed from 'products' to 'product_images'
      .remove([imagePath])

    if (error) {
      console.error('Error deleting image from Supabase:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in deleteImageFromBucket:', error)
    throw error
  }
} 