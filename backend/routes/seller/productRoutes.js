const express = require('express');
const { supabase } = require('../../config/supabaseClient');
const router = express.Router();

// Add Product
router.post('/add-product', async (req, res) => {
  try {
    const {
      name,
      description,
      brand_name,
      category,
      mrp,
      selling_price,
      sizes,
      colors,
      stock_quantity,
      material,
      style,
      images,
      shipping,
      return_policy,
      seller_id,
      is_draft
    } = req.body;

    // Insert into products table
    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          seller_id,
          name,
          description,
          brand_name,
          category,
          mrp,
          selling_price,
          sizes,
          colors,
          stock_quantity,
          material,
          style,
          images,
          shipping,
          return_policy,
          is_draft: is_draft || false,
          status: is_draft ? 'draft' : 'active'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add product'
    });
  }
});

module.exports = router; 